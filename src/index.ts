import { LegacyAddress, XAddress, NetworkID } from "./x-address";

export { LegacyAddress, XAddress, NetworkID };

if (require.main === module) {
  if (!process.argv[2]) {
    console.log(`Usage: x-address ADDRESS [TAG] [NETWORK ID] [EXPIRATION]`);

    // TODO: add json output feature
    // console.log(`Usage: x-address [json] ADDRESS [TAG] [NETWORK ID] [EXPIRATION]`);

    console.log();
    console.log(`  For classic addresses, the TAG, NETWORK ID, and EXPIRATION are required.`);
    console.log(`  If the address does not have a tag and/or expiration, pass undefined for`);
    console.log(`  those values, respectively.`);
    process.exit(0);
  }

  // Pass 'undefined' (string) to indicate that the address does not have a tag;
  // Pass 'undefined' (string) to indicate that the address does not expire.

  for (let i = 2; i < 1000; i++) { // Limit 1000 addresses!
    const address = process.argv[i] || '';
    if (address === '') {
      process.exit(0);
    }
    if (address.slice(0, 1) === 'r') { // Legacy address
      // 1. Tag
      const tag = process.argv[i + 1] === 'undefined' ? undefined : Number(process.argv[i + 1]);
  
      // 2. NetworkID
      const networkID = process.argv[i + 2] || 'production';

      // 3. Expiration
      let expiration: string | number | undefined;
      if (process.argv[i + 3] === 'undefined') {
        expiration = undefined;
      } else {
        const expirationAsNumber = Number(process.argv[i + 3]);
        if (Number.isInteger(expirationAsNumber)) {
          expiration = expirationAsNumber;
        } else {
          expiration = process.argv[i + 3]; // string
        }
      }
  
      let legacyAddress: LegacyAddress = new LegacyAddress(address, tag, networkID as NetworkID, expiration);

      console.log(legacyAddress.toXAddress().xAddress);

      // hop over Tag, NetworkID, Expiration; in order to process next address
      i = i + 3;
    } else if (address.slice(0, 1) === 'X' || address.slice(0, 1) === 'T') { // X address
      const legacyAddress = (new XAddress(address)).toLegacyAddress();
      const tag = legacyAddress.tag !== undefined ? legacyAddress.tag : 'undefined';
      console.log(`${legacyAddress.classicAddress} ${tag} ${legacyAddress.networkID}`);
    } else {
      console.log(`Invalid address: ${address}`);
    }
  }
}
