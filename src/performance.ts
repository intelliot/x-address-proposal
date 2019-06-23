import { LegacyAddress, XAddress, NetworkID } from "./x-address";
import { HashType } from "./hash";

export { LegacyAddress, XAddress, NetworkID };

const { PerformanceObserver, performance } = require('perf_hooks');

const heading = `# Performance\n\nConverts 200,000 legacy addresses to X addresses, and back: performing 400,000 hashes in order to compute the checksum and verify it.\n\nGenerate this file by running: \`yarn performance\`\n\n`;

let table = `| Hash(es) | Duration (ms) | Comparison |\n`;
table    += `| -------- | ------------- | ---------- |\n`;

const hashes: HashType[] = [
  'sha256x2', // baseline
  'sha512x2',
  'sha256',
  'sha512'
]

let baseline: PerformanceEntry | undefined = undefined;

const obs = new PerformanceObserver((items: PerformanceObserverEntryList) => {
  const item = items.getEntries()[0];
  let comparison;
  if (baseline === undefined) {
    baseline = item;
    comparison = `Baseline`;
  } else {
    const percentFaster = ((baseline.duration - item.duration) / baseline.duration) * 100;
    if (percentFaster > 0) {
      comparison = `${Math.round(percentFaster)}% faster`;
    } else {
      comparison = `${Math.round(-percentFaster)}% slower`;
    }
  }
  table    += `| ${item.name} | ${Math.round(item.duration)} | ${comparison} |\n`;
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

const address = 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf';
const networkID = 'production';

hashes.forEach((hash: HashType) => {
  runTest({address, networkID, hash});
});

function runTest({address, networkID, hash}: {address: string, networkID: NetworkID, hash: HashType}) {
  performance.mark(`Begin ${hash}`);

  const xAddresses = [];
  for (let t = 1; t < 200000; t++) {
    const legacyAddress: LegacyAddress = new LegacyAddress(address, t, networkID as NetworkID, undefined); // TODO: test with expiration
    // TODO: compare fixed expiration with Date.now() + 24 hours
  
    const xAddress = legacyAddress.toXAddress(hash).xAddress;
    xAddresses.push(xAddress);
  }

  xAddresses.forEach(xAddress => {
    const legacyAddress = (new XAddress(xAddress)).toLegacyAddress(hash);
  });
  
  performance.mark(`End ${hash}`);
  performance.measure(hash, `Begin ${hash}`, `End ${hash}`);
}

const fs = require('fs');
fs.writeFileSync('./PERFORMANCE.md', heading + table);

console.log('Generated PERFORMANCE.md');
