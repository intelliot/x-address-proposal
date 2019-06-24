"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const x_address_1 = require("./x-address");
exports.LegacyAddress = x_address_1.LegacyAddress;
exports.XAddress = x_address_1.XAddress;
const { PerformanceObserver, performance } = require('perf_hooks');
const heading = `# Performance\n\nConverts 200,000 legacy addresses to X addresses, and back: performing 400,000 hashes in order to compute the checksum and verify it.\n\nGenerate this file by running: \`yarn performance\`\n\n`;
let table = `| Hash(es) | Duration (ms) | Comparison |\n`;
table += `| -------- | ------------- | ---------- |\n`;
const hashes = [
    'sha256x2',
    'sha512x2',
    'sha256',
    'sha512'
];
let baseline = undefined;
const obs = new PerformanceObserver((items) => {
    const item = items.getEntries()[0];
    let comparison;
    if (baseline === undefined) {
        baseline = item;
        comparison = `Baseline`;
    }
    else {
        const percentFaster = ((baseline.duration - item.duration) / baseline.duration) * 100;
        if (percentFaster > 0) {
            comparison = `${Math.round(percentFaster)}% faster`;
        }
        else {
            comparison = `${Math.round(-percentFaster)}% slower`;
        }
    }
    table += `| ${item.name} | ${Math.round(item.duration)} | ${comparison} |\n`;
    performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });
const address = 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf';
const networkID = 'production';
hashes.forEach((hash) => {
    runTest({ address, networkID, hash });
});
function runTest({ address, networkID, hash }) {
    performance.mark(`Begin ${hash}`);
    const xAddresses = [];
    for (let t = 1; t < 200000; t++) {
        const legacyAddress = new x_address_1.LegacyAddress(address, t, networkID, undefined); // TODO: test with expiration
        // TODO: compare fixed expiration with Date.now() + 24 hours
        const xAddress = legacyAddress.toXAddress(hash).xAddress;
        xAddresses.push(xAddress);
    }
    xAddresses.forEach(xAddress => {
        const legacyAddress = (new x_address_1.XAddress(xAddress)).toLegacyAddress(hash);
    });
    performance.mark(`End ${hash}`);
    performance.measure(hash, `Begin ${hash}`, `End ${hash}`);
}
const fs = require('fs');
fs.writeFileSync('./PERFORMANCE.md', heading + table);
console.log('Generated PERFORMANCE.md');
