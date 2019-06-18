import { LegacyAddress, XAddress, NetworkID } from "./x-address";

export { LegacyAddress, XAddress, NetworkID };

if (require.main === module) {
  // Pass 'undefined' (string) to indicate that the address does not have a tag!

  const address = process.argv[2] || '';
  if (address.slice(0, 1) === 'r') { // Legacy address
    // 1. Tag
    const tag = process.argv[3] === 'undefined' ? undefined : Number(process.argv[3]);

    // 2. NetworkID
    const networkID = process.argv[4];

    let legacyAddress: LegacyAddress;
    if (tag && networkID) {
      legacyAddress = new LegacyAddress(address, tag, networkID as NetworkID);
    } else if (tag) {
      legacyAddress = new LegacyAddress(address, tag, 'production');
    } else {
      legacyAddress = new LegacyAddress(address, undefined, 'production');
    }

    console.log(legacyAddress.toXAddress().xAddress);
  } else if (address.slice(0, 1) === 'X' || address.slice(0, 1) === 'T') { // X address
    const xAddress = new XAddress(address);
    const tag = xAddress.toLegacyAddress().tag ? xAddress.toLegacyAddress().tag : 'undefined';
    console.log(`${xAddress.toLegacyAddress().classicAddress} ${tag} ${xAddress.toLegacyAddress().networkID}`);
  } else {
    console.log(`Usage: x-address ADDRESS [TAG] [NETWORK ID]`);
  }
}
