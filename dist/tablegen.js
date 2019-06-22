"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const x_address_1 = require("./x-address");
// '{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various production 2019-12-31T23:59:59}'
module.exports = function tablegen(pattern) {
    const parts = pattern.split(' ');
    const classicAddress = parts[0].slice(1);
    const tags = parts[1] === 'various' ? [undefined, 0, 1, 2, 32, 276, 65591, 16781933, 4294967294, 4294967295] : [Number(parts[1])];
    const network = parts[2];
    const expiration = parts[3].slice(0, -1) === 'undefined' ? undefined : parts[3].slice(0, -1);
    let table = `| Tag | Expiration | X Address |\n`;
    table += `| --- | ---------- | --------- |\n`;
    tags.forEach((tag) => {
        table += `| ${tag === undefined ? 'None' : tag} | ${expiration === undefined ? 'None' : expiration} | ${(new x_address_1.LegacyAddress(classicAddress, tag, network, expiration).toXAddress().xAddress)} |\n`;
    });
    return table.slice(0, -1);
};
