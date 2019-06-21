"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require('crypto');
function sha256(payload) {
    return crypto.createHash('sha256').update(payload).digest();
}
exports.sha256 = sha256;
