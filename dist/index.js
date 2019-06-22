"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const x_address_1 = require("./x-address");
exports.LegacyAddress = x_address_1.LegacyAddress;
exports.XAddress = x_address_1.XAddress;
if (require.main === module) {
    if (!process.argv[2]) {
        console.log(`Usage: x-address [json] ADDRESS [TAG] [NETWORK ID] [EXPIRATION]`);
        console.log();
        console.log(`  For classic addresses, the TAG, NETWORK ID, and EXPIRATION are required.`);
        console.log(`  If the address does not have a tag and/or expiration, pass undefined for`);
        console.log(`  those values, respectively.`);
        process.exit(0);
    }
    // Pass 'undefined' (string) to indicate that the address does not have a tag;
    // Pass 'undefined' (string) to indicate that the address does not expire.
    const json = process.argv[2] === 'json' ? true : false;
    let i = json ? 3 : 2;
    const converted = [];
    for (; i < 1000; i++) { // Limit 1000 addresses!
        const address = process.argv[i] || '';
        if (address === '') {
            break;
        }
        if (address.slice(0, 1) === 'r') { // Legacy address
            // 1. Tag
            const tag = process.argv[i + 1] === 'undefined' ? undefined : Number(process.argv[i + 1]);
            // 2. NetworkID
            const networkID = process.argv[i + 2] || 'production';
            // 3. Expiration
            let expiration;
            if (process.argv[i + 3] === 'undefined') {
                expiration = undefined;
            }
            else {
                const expirationAsNumber = Number(process.argv[i + 3]);
                if (Number.isInteger(expirationAsNumber)) {
                    expiration = expirationAsNumber;
                }
                else {
                    expiration = process.argv[i + 3]; // string
                }
            }
            let legacyAddress = new x_address_1.LegacyAddress(address, tag, networkID, expiration);
            const xAddress = legacyAddress.toXAddress();
            if (json) {
                converted.push(xAddress);
            }
            else {
                console.log(xAddress.toString());
            }
            // hop over Tag, NetworkID, Expiration; in order to process next address
            i = i + 3;
        }
        else if (address.slice(0, 1) === 'X' || address.slice(0, 1) === 'T') { // X address
            const legacyAddress = (new x_address_1.XAddress(address)).toLegacyAddress();
            if (json) {
                converted.push(legacyAddress);
            }
            else {
                console.log(legacyAddress.toString());
            }
        }
        else {
            console.log(`Invalid address: ${address}`);
        }
    }
    if (json) {
        console.log(JSON.stringify(converted, null, 2));
    }
}
