import { LegacyAddress, XAddress, NetworkID } from "./x-address";

export { LegacyAddress, XAddress, NetworkID };

if (require.main === module) {
  if (!process.argv[2]) {
    console.log(`Usage: x-address ADDRESS [TAG] [NETWORK ID]`);
    console.log();
    console.log(`  For classic addresses, the TAG and NETWORK ID are required.`);
    process.exit(0);
  }

  // Pass 'undefined' (string) to indicate that the address does not have a tag!

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
  
      let legacyAddress: LegacyAddress = new LegacyAddress(address, tag, networkID as NetworkID);

      console.log(legacyAddress.toXAddress().xAddress);

      i = i + 2;
    } else if (address.slice(0, 1) === 'X' || address.slice(0, 1) === 'T') { // X address
      const legacyAddress = (new XAddress(address)).toLegacyAddress();
      const tag = legacyAddress.tag !== undefined ? legacyAddress.tag : 'undefined';
      console.log(`${legacyAddress.classicAddress} ${tag} ${legacyAddress.networkID}`);
    } else {
      console.log(`Invalid address: ${address}`);
    }
  }
}
