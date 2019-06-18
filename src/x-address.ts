const crypto = require('crypto');
const baseCodec = require('./base-x');
const codec = baseCodec('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');

function sha256(payload: Buffer) {
  return crypto.createHash('sha256').update(payload).digest();
}

// Colloquially, the new format is called an X Address because it
// starts when 'X' when the address is meant for use on the the
// production XRP Ledger network. The address starts with 'T'
// when used on the test network (aka Test Net or altnet).

class XAddress {
  public xAddress: string;

  public constructor(xAddress: string) {
    this.xAddress = xAddress;
  }

  public toLegacyAddress(): LegacyAddress {
    // 1. Encode first character, which must be X or T
    const first = this.xAddress.slice(0, 1);
    if (first != 'X' && first != 'T') {
      throw new Error(`Invalid first character: ${first}`);
    }
    const networkByte = Buffer.from(first);

    // 2. Take everything between that character and the first '0', as the checksum
    const delimiterPosition = this.xAddress.indexOf('0');
    if (delimiterPosition === -1) {
      throw new Error(`Missing delimiter: ${this.xAddress}`);
    }
    const checksum = this.xAddress.slice(1, delimiterPosition);

    // 3. Take everything between that '0' and the next 'r', as the tag
    const classicAddressPosition = this.xAddress.indexOf('r', delimiterPosition + 1);
    if (classicAddressPosition === -1) {
      throw new Error(`Missing classic address: ${this.xAddress}`);
    }
    const tagString = this.xAddress.slice(delimiterPosition + 1, classicAddressPosition);
    const tag: number | undefined = tagString === '' ? undefined : Number(tagString);
    if (tag !== undefined && isNaN(tag)) {
      throw new Error(`Invalid tag: ${tagString}`);
    }

    // 4. The rest is the classic address
    const classicAddress = this.xAddress.slice(classicAddressPosition);
    const accountID = decodeAccountID(classicAddress);

    // 5. Convert tag to Buffer (UInt32LE)
    let myTagBuffer: Buffer;
    if (tag) {
      if (Number.isInteger(tag) === false) {
        throw new Error(`Invalid tag: ${tag}`);
      }
      myTagBuffer = Buffer.alloc(8); // 8 bytes = 32 bits
      myTagBuffer.writeUInt32LE(tag, 0);
    } else {
      myTagBuffer = Buffer.alloc(0);
    }
    const tagBuffer: Buffer = myTagBuffer;

    // 6. Concat accountID, tagBuffer, and networkByte to create payload
    const payload = Buffer.concat([accountID, tagBuffer, networkByte]);

    // 7. SHA256 x 2 and take first 4 bytes as checksum
    const computedChecksum = sha256(sha256(payload)).slice(0, 4);

    // 8. Encode the checksum in base58
    const computedChecksum_base58 = codec.encode(computedChecksum);

    // 9. Ensure checksums match
    if (computedChecksum_base58 !== checksum) {
      throw new Error(`Invalid checksum: ${checksum}`);
    }

    // 10. Set networkID based on first character
    let networkID: NetworkID;
    if (first === 'X') {
      networkID = 'production';
    } else if (first === 'T') {
      networkID = 'test';
    } else {
      throw new Error(`Invalid first character: ${first}`); // Cannot happen; just to double-check (invariant)
    }
    
    return new LegacyAddress(classicAddress, tag, networkID);
  }
}

type NetworkID = 'production' | 'test';

class LegacyAddress {
  public classicAddress: string;
  public tag: number | undefined;
  public networkID: NetworkID;

  public constructor(classicAddress: string, tag: number | undefined, networkID: NetworkID) {
    this.classicAddress = classicAddress;
    this.tag = tag;
    this.networkID = networkID;
  }

  public toXAddress(): XAddress {
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
    //    To support a 64-bit tag, alloc 16 bytes and fill it appropriately.
    //    It's a little tricky since the JS 'number' type cannot support it,
    //    but it's doable with a BigNumber library.
    let myTagBuffer: Buffer;
    if (this.tag) {
      if (Number.isInteger(this.tag) === false) {
        throw new Error(`Invalid tag: ${this.tag}`);
      }
      myTagBuffer = Buffer.alloc(8); // 8 bytes = 32 bits
      myTagBuffer.writeUInt32LE(this.tag, 0);
    } else {
      myTagBuffer = Buffer.alloc(0);
    }
    const tagBuffer: Buffer = myTagBuffer;

    // 4. Concat accountID, tagBuffer, and networkByte to create payload
    const payload = Buffer.concat([accountID, tagBuffer, networkByte]);

    // 5. SHA256 x 2 and take first 4 bytes as checksum
    const checksum = sha256(sha256(payload)).slice(0, 4);

    // 6. Encode the checksum in base58
    const checksum_base58 = codec.encode(checksum);

    // 7. Decide to use '0' as our delimiter. It must be a character that
    //    does not appear in our base58 alphabet, so it can only be '0' or 'l'
    const DELIMITER = '0';

    // 8. Form the "X Address" and return it:
    //    - Start with 'X' or 'T' to make the address format obvious;
    //    - Lead with the checksum so that any (valid) change to the
    //      address/tag/network changes the first several characters of
    //      the resulting address;
    //    - Append the tag next for easy parsing.
    //      To get the tag, take everything between DELIMITER and 'r'
    //      (since a classic address will always start with 'r').
    //      Notice that if we had put the tag after the address, we would
    //      need to add a second delimiter to avoid ambiguity: the numbers
    //      1-9 are all valid base58 characters in our alphabet.
    //      An added benefit of this approach is that the tag, in the middle
    //      of the string, (correctly) appears to be opaque and not user-editable.
    //    - Finish with the classic address.
    const tagString = this.tag ? this.tag.toString() : '';
    return new XAddress(networkByte.toString() + checksum_base58 + DELIMITER + tagString + this.classicAddress);
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
  const computed = sha256(sha256(output.slice(0, -4))).slice(0, 4);
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
