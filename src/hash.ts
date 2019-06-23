const crypto = require('crypto');

function sha256(payload: Buffer) {
  return crypto.createHash('sha256').update(payload).digest();
}

function sha256x2(payload: Buffer) {
  return sha256(sha256(payload));
}

function hash(payload: Buffer, hashFuncName: HashType): Buffer {
  if (hashFuncName === 'sha256x2') {
    return hash(hash(payload, 'sha256'), 'sha256');
  } else if (hashFuncName === 'sha512x2') {
    return hash(hash(payload, 'sha512'), 'sha512');
  }
  return crypto.createHash(hashFuncName).update(payload).digest();
}

type HashType = 'sha512x2' | 'sha256x2' | 'sha512' | 'sha256';

export {
  hash,
  HashType
};
