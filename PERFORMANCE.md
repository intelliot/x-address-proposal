# Performance

Converts 200,000 legacy addresses to X addresses, and back: performing 400,000 hashes in order to compute the checksum and verify it.

| Hash(es) | Duration (ms) | Comparison |
| -------- | ------------- | ---------- |
| sha256x2 | 6955 | Baseline |
| sha512x2 | 7146 | 3% slower |
| sha256 | 5955 | 14% faster |
| sha512 | 5558 | 20% faster |
