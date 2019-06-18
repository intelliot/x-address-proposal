"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const x_address_1 = require("./x-address");
exports.LegacyAddress = x_address_1.LegacyAddress;
exports.XAddress = x_address_1.XAddress;
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
            let legacyAddress = new x_address_1.LegacyAddress(address, tag, networkID);
            console.log(legacyAddress.toXAddress().xAddress);
            i = i + 2;
        }
        else if (address.slice(0, 1) === 'X' || address.slice(0, 1) === 'T') { // X address
            const xAddress = new x_address_1.XAddress(address);
            const tag = xAddress.toLegacyAddress().tag !== undefined ? xAddress.toLegacyAddress().tag : 'undefined';
            console.log(`${xAddress.toLegacyAddress().classicAddress} ${tag} ${xAddress.toLegacyAddress().networkID}`);
        }
        else {
            console.log(`Invalid address: ${address}`);
        }
    }
}
