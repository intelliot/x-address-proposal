"use strict";
const fs = require('fs');
const tablegen = require('./tablegen');
let readme = fs.readFileSync('./src/README.md', 'utf8');
const patterns = ['{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various production 2019-12-31T23:59:59}',
    '{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various test 2019-12-31T23:59:59}',
    '{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various production undefined}',
    '{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various test undefined}'];
patterns.forEach(pattern => {
    readme = readme.replace(pattern, tablegen(pattern));
});
fs.writeFileSync('./README.md', readme);
console.log('Generated README.md');
