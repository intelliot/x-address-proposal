const {sha256} = require('./sha256');
const baseCodec = require('./base-x');
const codec = baseCodec('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');

// 0x00 = 00
// 0xFF = 255

const BYTE_COUNT = 3;

const minBytesBuffer = Buffer.from('00'.repeat(BYTE_COUNT), 'hex');
const maxBytesBuffer = Buffer.from('FF'.repeat(BYTE_COUNT), 'hex');

console.log(`PRE | INITIAL | LENGTH | INI0x01 | LE0x01`);
console.log(`===========================================`);

for (let i = 0; i < 256; i++) {
  const {initial, length} = calculateWithInputs(i, minBytesBuffer, maxBytesBuffer);
  const {initial: initial0x01, length: length0x01} = calculateWithInputs(i, Buffer.concat([minBytesBuffer, Buffer.from([0x01])]), Buffer.concat([maxBytesBuffer, Buffer.from([0x01])]));
  
  const pre = Buffer.from([i]).toString('hex').toUpperCase().padStart(3, ' ');
  console.log(`${pre} | ${initial.padEnd(7, ' ')} | ${length.padEnd(6, ' ')} | ${initial0x01.padEnd(7, ' ')} | ${length0x01.padEnd(6, ' ')} | `);
}

// NB: no checksum
function calculateWithInputs(i: number, minBuffer: Buffer, maxBuffer: Buffer) {
  const prefix = Buffer.from([i]);
  const payloadMin = Buffer.concat([prefix, minBuffer]);
  // const checksumMin = sha256(sha256(payloadMin)).slice(0, 4);
  const encodedMin = codec.encode(payloadMin);
  const initialMin = encodedMin.slice(0, 1);

  const payloadMax = Buffer.concat([prefix, maxBuffer]);
  // const checksumMax = sha256(sha256(payloadMax)).slice(0, 4);
  const encodedMax = codec.encode(payloadMax);
  const initialMax = encodedMax.slice(0, 1);

  let iniString: string;
  if (initialMin === initialMax) {
    iniString = initialMin;
  } else {
    iniString = `${initialMin}-${initialMax}`;
  }

  let lengthString: string;
  if (encodedMin.length === encodedMax.length) {
    lengthString = `${encodedMin.length}`;
  } else {
    lengthString = `${encodedMin.length}-${encodedMax.length}`;
  }

  return {initial: iniString, length: lengthString};
}

export {};
