// Small, one-off QL-04 performance probe; only run with compose.test.yaml.
// Uses Node built-ins: no new package, service, or user data.
import { randomBytes, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const origin = 'http://web';
const sampleCount = 12;
const bytes = Buffer.alloc(1_048_576, 0x61); // 1 MiB of harmless text
const identifier = randomUUID();
const filename = `perf-${identifier}.txt`;

async function checked(label, path, options, expectedStatus) {
  let response;
  try {
    response = await fetch(origin + path, {
      ...options,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error(`${label}: request failed (check the isolated stack)`);
  }
  if (response.status !== expectedStatus) {
    throw new Error(`${label}: expected HTTP ${expectedStatus}, got ${response.status}`);
  }
  return response;
}

const credentials = {
  email: `perf-${identifier}@example.test`,
  password: randomBytes(24).toString('base64url'),
};
const jsonHeaders = { 'Content-Type': 'application/json' };

await checked('Register', '/api/auth/register', {
  method: 'POST', headers: jsonHeaders, body: JSON.stringify(credentials),
}, 201);

const login = await checked('Login', '/api/auth/login', {
  method: 'POST', headers: jsonHeaders, body: JSON.stringify(credentials),
}, 200);
const { access_token: token } = await login.json();
if (typeof token !== 'string' || !token) {
  throw new Error('Login did not return an access token');
}

const form = new FormData();
form.append('files[]', new Blob([bytes], { type: 'text/plain' }), filename);
form.append('expires_in_days', '1');
const upload = await checked('Upload', '/api/transfers', {
  method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
}, 201);
const { transfer } = await upload.json();
const share = /^\/share\/([a-f0-9]{64})$/.exec(transfer?.share_url ?? '');
const fileId = transfer?.files?.[0]?.id;
if (!share || !/^[a-f0-9-]{36}$/.test(fileId ?? '')) {
  throw new Error('Upload did not return a valid public share and file identifier');
}
const downloadPath = `/api/shares/${share[1]}/files/${fileId}`;

async function receive() {
  const response = await checked('Public download', downloadPath, {
    method: 'GET', headers: { 'Cache-Control': 'no-cache' },
  }, 200);
  const received = Buffer.from(await response.arrayBuffer());
  if (!received.equals(bytes)) throw new Error('Public download bytes do not match');
}

// Warm-up is intentionally excluded from the timing.
await receive();
const durations = [];
for (let i = 0; i < sampleCount; i++) {
  const start = performance.now();
  await receive();
  durations.push(performance.now() - start);
}
const sorted = [...durations].sort((a, b) => a - b);
const percentile = (p) => sorted[Math.ceil(sampleCount * p) - 1];
const sum = durations.reduce((a, b) => a + b, 0);

console.log('DataShare QL-04 — public download (isolated Docker network)');
console.log('Date (UTC):', new Date().toISOString());
console.log('Fixture: 1,048,576 bytes (1 MiB), synthetic TXT');
console.log('Requests: 1 warm-up +', sampleCount, 'sequential HTTP 200, 0 errors');
console.log('Download p50:', percentile(0.5).toFixed(1), 'ms');
console.log('Download p95:', percentile(0.95).toFixed(1), 'ms');
console.log('Mean:', (sum / sampleCount).toFixed(1), 'ms');
console.log('Effective sequential throughput:', ((bytes.length * sampleCount / 1e6) / (sum / 1000)).toFixed(2), 'MB/s');
console.log('Scope: in-container HTTP timing + response bytes; not a production load test');
