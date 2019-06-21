const crypto = require('crypto');

function sha256(payload: Buffer) {
  return crypto.createHash('sha256').update(payload).digest();
}

export {sha256};
