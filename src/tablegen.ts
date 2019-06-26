import { LegacyAddress, XAddress, NetworkID } from "./x-address";

// '{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various production 2019-12-31T23:59:59}'
// '{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 276 production 2019-12-31T23:59:59}'
module.exports = function tablegen(pattern: string): string {
  const parts = pattern.split(' ');
  const classicAddress = parts[0].slice(1);
  const tags = parts[1] === 'various' ? [
    undefined, 0, 1, 2, 32, 276, 1000, 5000, 65591, 101010, 16781933, 4294967294, 4294967295
  ] : [Number(parts[1])];
  const network = parts[2];
  const expiration = parts[3].slice(0, -1) === 'undefined' ? undefined : parts[3].slice(0, -1);

  if (tags.length === 1) {
    return new LegacyAddress(classicAddress, tags[0], network as NetworkID, expiration).toXAddress().xAddress;
  }

  let table = `| Tag | Expiration | X Address |\n`;
  table    += `| --- | ---------- | --------- |\n`;

  tags.forEach((tag: number | undefined) => {
    table  += `| ${tag === undefined ? 'None' : tag} | ${expiration === undefined ? 'None' : expiration} | ${(new LegacyAddress(classicAddress, tag, network as NetworkID, expiration).toXAddress().xAddress)} |\n`;
  });

  return table.slice(0, -1);
}
