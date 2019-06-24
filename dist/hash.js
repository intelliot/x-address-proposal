"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require('crypto');
function sha256(payload) {
    return crypto.createHash('sha256').update(payload).digest();
}
function sha256x2(payload) {
    return sha256(sha256(payload));
}
function hash(payload, hashFuncName) {
    if (hashFuncName === 'sha256x2') {
        return hash(hash(payload, 'sha256'), 'sha256');
    }
    else if (hashFuncName === 'sha512x2') {
        return hash(hash(payload, 'sha512'), 'sha512');
    }
    return crypto.createHash(hashFuncName).update(payload).digest();
}
exports.hash = hash;
