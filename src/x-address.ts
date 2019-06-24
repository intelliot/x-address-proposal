import { HashType } from "./hash";

const {hash} = require('./hash');
const baseCodec = require('./base-x');
const codec = baseCodec('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');

// Colloquially, the new format is called an X Address because it
// starts when 'X' when the address is meant for use on the the
// production XRP Ledger network. The address starts with 'T'
// when used on the test network (aka Test Net or altnet).

class XAddress {
  public xAddress: string;

  public constructor(xAddress: string) {
    this.xAddress = xAddress;
  }

  public toLegacyAddress(hashFuncName: HashType = 'sha256x2'): LegacyAddress {
    // 1. Encode first character, which must be X or T
    const first = this.xAddress.slice(0, 1);
    if (first != 'X' && first != 'T') {
      throw new Error(`Invalid first character: ${first}`);
    }
    const networkByte = Buffer.from(first);

    // 2. Take everything between that character and the first '0', as the expiration and full checksum
    const separatorPosition = this.xAddress.indexOf('0');
    if (separatorPosition === -1) {
      throw new Error(`Missing separator: ${this.xAddress}`);
    }
    const checksumAndExpirationBase58 = this.xAddress.slice(1, separatorPosition);
    const checksumAndExpiration: Buffer = codec.decode(checksumAndExpirationBase58);

    let expirationBuffer: Buffer;
    let expiration: number | undefined;
    if (checksumAndExpiration.length === 4) {
      // expiration is undefined
      expirationBuffer = Buffer.alloc(0);
      expiration = undefined;
    } else if (checksumAndExpiration.length === 8) {
      expirationBuffer = checksumAndExpiration.slice(4, 8);
      expiration = expirationBuffer.readUInt32LE(0);
    } else {
      // Must be exactly 4 or 8 bytes
      throw new Error(`Invalid checksum/expiration length: ${checksumAndExpiration.length}`);
    }

    const checksumBuffer = checksumAndExpiration.slice(0, 4);

    // 3. Take everything between that '0' and the next 'r', as the tag
    const classicAddressPosition = this.xAddress.indexOf('r', separatorPosition + 1);
    if (classicAddressPosition === -1) {
      throw new Error(`Missing classic address: ${this.xAddress}`);
    }
    const tagString = this.xAddress.slice(separatorPosition + 1, classicAddressPosition);
    const tag: number | undefined = tagString === '' ? undefined : Number(tagString);
    if (tag !== undefined && isNaN(tag)) {
      throw new Error(`Invalid tag: ${tagString}`);
    }

    // 4. The rest is the classic address
    const classicAddress = this.xAddress.slice(classicAddressPosition);
    const accountID = decodeAccountID(classicAddress);

    // 5. Convert tag to Buffer (UInt32LE)
    let myTagBuffer: Buffer;
    if (tag !== undefined) {
      if (Number.isInteger(tag) === false) {
        throw new Error(`Invalid tag: ${tag}`);
      }
      myTagBuffer = Buffer.alloc(8); // 8 bytes = 64 bits
      myTagBuffer.writeUInt32LE(tag, 0);
    } else {
      myTagBuffer = Buffer.alloc(0);
    }
    const tagBuffer: Buffer = myTagBuffer;

    // 6. Concat networkByte, expirationBuffer, tagBuffer, and accountID
    //    to create the payload to be checksummed.
    //    NB: The ordering of these values has been changed from an earlier draft of this spec.
    const payload = Buffer.concat([networkByte, expirationBuffer, tagBuffer, accountID]);

    // 7. SHA256 x 2 and take first 4 bytes as checksum
    const computedChecksum = hash(payload, hashFuncName).slice(0, 4);

    // 8. Ensure checksums match
    if (computedChecksum.equals(checksumBuffer) == false) {
      throw new Error(`Invalid checksum (hex): ${checksumBuffer.toString('hex').toUpperCase()}`);
    }

    // 9. Set networkID based on first character
    let networkID: NetworkID;
    if (first === 'X') {
      networkID = 'production';
    } else if (first === 'T') {
      networkID = 'test';
    } else {
      throw new Error(`Invalid first character: ${first}`); // Cannot happen; just to double-check (invariant)
    }
    
    return new LegacyAddress(classicAddress, tag, networkID, expiration);
  }

  public toJSON(): object {
    return describeAddress(this.toLegacyAddress(), this);
  }

  public toString(): string {
    return this.xAddress;
  }
}

type NetworkID = 'production' | 'test';

class LegacyAddress {
  public classicAddress: string;
  public tag: number | undefined;
  public networkID: NetworkID;

  // seconds since XRP "epoch" or `undefined` if no expiration
  public expiration: number | undefined;

  public constructor(
    classicAddress: string,
    tag: number | undefined,
    networkID: NetworkID,
    //
    // If `expiration` is a string, it is parsed with JavaScript's Date.parse(),
    // which takes ISO 8601 date-time format (such as "2011-10-10T14:48:00").
    //
    // If it is a number, it is interpreted as the number of seconds since
    // the XRP Ledger "epoch" time of 2000-01-01 00:00:00 UTC.
    //
    // If the address/tag never expires, set `expiration` to `undefined`.
    //
    expiration: string | number | undefined
  ) {
    this.classicAddress = classicAddress;
    this.tag = tag;
    this.networkID = networkID;

    if (typeof expiration === 'string') {
      const unixTime: number = Date.parse(expiration);
      this.expiration = Math.round(unixTime / 1000) - 0x386D4380;
    } else if (typeof expiration === 'number') {
      this.expiration = expiration;
    } else {
      this.expiration = undefined; // does not expire
    }
  }

  public toXAddress(hashFuncName: HashType = 'sha256x2'): XAddress {
    // 1. Decode classicAddress to accountID
    const accountID: Buffer = decodeAccountID(this.classicAddress);

    // 2. Encode networkID
    let myNetworkByte: Buffer;
    if (this.networkID === 'production') {
      myNetworkByte = Buffer.from('X');
    } else if (this.networkID === 'test') {
      myNetworkByte = Buffer.from('T');
    } else {
      throw new Error(`Invalid networkID: ${this.networkID}`);
    }
    const networkByte = myNetworkByte;

    // 3. Convert tag to Buffer (UInt32LE)
    //    To support a 64-bit tag, fill the 8 bytes (64 bits) appropriately (little-endian).
    //    It's a little tricky since the JS 'number' type cannot support safely support values over 2^53 - 1,
    //    but it's doable with a BigNumber library.
    let myTagBuffer: Buffer;
    if (this.tag !== undefined) {
      if (Number.isInteger(this.tag) === false) {
        throw new Error(`Invalid tag: ${this.tag}`);
      }
      myTagBuffer = Buffer.alloc(8); // 8 bytes = 64 bits
      myTagBuffer.writeUInt32LE(this.tag, 0);
    } else {
      myTagBuffer = Buffer.alloc(0);
    }
    const tagBuffer: Buffer = myTagBuffer;

    // 4. Convert expiration to Buffer (UInt32LE)
    let myExpirationBuffer: Buffer;
    if (this.expiration !== undefined) {
      if (Number.isInteger(this.expiration) === false) {
        throw new Error(`Invalid expiration: ${this.expiration}`);
      }
      myExpirationBuffer = Buffer.alloc(4); // 4 bytes = 32 bits
      myExpirationBuffer.writeUInt32LE(this.expiration, 0);
    } else {
      myExpirationBuffer = Buffer.alloc(0); // no expiration
    }
    const expirationBuffer: Buffer = myExpirationBuffer;

    // 5. Concat networkByte, expirationBuffer, tagBuffer, and accountID
    //    to create the payload to be checksummed.
    //    NB: The ordering of these values has been changed from an earlier draft of this spec.
    const payload = Buffer.concat([networkByte, expirationBuffer, tagBuffer, accountID]);

    // 6. SHA256 x 2 and take first 4 bytes as checksum
    const checksum = hash(payload, hashFuncName).slice(0, 4);

    // 7. Encode the expiration with the checksum, in base58.
    //    NB: Put the checksum first so that any change to the address/tag/network/expiration
    //        changes the first several characters of the resulting address.
    const checksumAndExpirationBase58 = codec.encode(Buffer.concat([checksum, expirationBuffer]));

    // 8. Decide to use '0' as our separator. It must be a character that
    //    does not appear in our base58 alphabet, so it can only be '0' or 'l'
    const SEPARATOR = '0';

    // 9. Form the "X Address" and return it:
    //    - Start with 'X' or 'T' to make the address format obvious;
    //    - Lead with the checksum so that any (valid) change to the
    //      address/tag/network/expiration changes the first several characters of
    //      the resulting address;
    //    - Append the tag next for easy parsing.
    //      To get the tag, take everything between SEPARATOR and 'r'
    //      (since a classic address will always start with 'r').
    //      Notice that if we had put the tag after the address, we would
    //      need to add a second separator to avoid ambiguity: the numbers
    //      1-9 are all valid base58 characters in our alphabet.
    //      An added benefit of this approach is that the tag, in the middle
    //      of the string, (correctly) appears to be opaque and not user-editable.
    //    - Finish with the classic address.
    const tagString = this.tag !== undefined ? this.tag.toString() : '';
    return new XAddress(networkByte.toString() + checksumAndExpirationBase58 + SEPARATOR + tagString + this.classicAddress);
  }

  public toJSON(): object {
    return describeAddress(this, this.toXAddress());
  }

  public toString(): string {
    return `${this.classicAddress} ${this.tag} ${this.networkID} ${this.expiration}`;
  }
}

function decodeAccountID(base58: string): Buffer {
  // 1. Decode raw
  const output: Buffer = codec.decode(base58);
  // 2. Check that output length >= 5
  if (output.length < 5) {
    throw new Error(`Invalid input size: ${output.length} must be < 5`);
  }
  // 3. Verify checksum
  const computed = hash(output.slice(0, -4), 'sha256x2').slice(0, 4);
  const checksum = output.slice(-4);
  if (computed.equals(checksum) == false) {
    throw new Error(`Invalid checksum: ${checksum}`);
  }
  // 4. Remove the last 4 bytes and the first byte
  const unchecked = output.slice(1, -4);
  // 5. The first byte is the version (0);
  const version = output.slice(0, 1);
  if (version.equals(Buffer.from('00', 'hex')) == false) {
    throw new Error(`Invalid version: ${version}`);
  }
  if (unchecked.length != 20) {
    throw new Error(`Invalid unchecked length: ${unchecked.length}`);
  }
  // 6. The account ID is the last 20 bytes.
  return unchecked;
}

export {
  XAddress,
  LegacyAddress,
  NetworkID
};

function describeAddress(legacy: LegacyAddress, x: XAddress): object {
  let expirationDate: Date | undefined = undefined;
  let secondsUntilExpiration: number | undefined = undefined;
  let status: 'ACTIVE' | 'EXPIRED' = 'ACTIVE';
  if (legacy.expiration != undefined && Number.isInteger(legacy.expiration)) {
    expirationDate = new Date((legacy.expiration + 0x386D4380) * 1000);
    secondsUntilExpiration = Math.round((expirationDate.getTime() - Date.now()) / 1000);
    if (secondsUntilExpiration < 0) {
      status = 'EXPIRED';
    }
  }

  return {
    "X Address": x.xAddress,
    "Classic Address": legacy.classicAddress,
    "Tag": legacy.tag,
    "Network ID": legacy.networkID,
    "Expiration in seconds since XRP epoch": legacy.expiration,
    "Expiration in ISO 8601": expirationDate === undefined ? undefined : expirationDate.toISOString(),
    "Seconds until expiration": secondsUntilExpiration,
    "Status": status
  };
}
