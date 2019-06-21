import { LegacyAddress, XAddress, NetworkID } from "./x-address";

const classicAddress = 'rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf';
const tags = [undefined, 0, 1, 2, 32, 276, 65591, 16781933, 4294967294, 4294967295];

console.log(`| Tag | Address |`);
console.log(`| --- | ------- |`);

tags.forEach(tag => {
  console.log(`| ${tag === undefined ? 'None' : tag} | ${(new LegacyAddress(classicAddress, tag, 'production').toXAddress().xAddress)} |`);
});

console.log();
console.log('In the following table, we present tagged address encodings for the same classic address (`rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf`) but with a network ID of \'test\' to show the example of tagged addresses intended for use on the XRP Ledger Test Net.');
console.log();

console.log(`| Tag | Address |`);
console.log(`| --- | ------- |`);

tags.forEach(tag => {
  console.log(`| ${tag === undefined ? 'None' : tag} | ${(new LegacyAddress(classicAddress, tag, 'test').toXAddress().xAddress)} |`);
});
