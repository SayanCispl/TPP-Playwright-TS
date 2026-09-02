const fs = require('node:fs');
const path = require('node:path');

for (const dir of [
  'playwright-report',
  'test-results',
  'reports/html',
  'reports/allure-results',
  'reports/allure-report',
  'reports/screenshots',
  'reports/videos',
  'reports/traces',
  'reports/logs'
]) {
  const target = path.resolve(dir);
  fs.rmSync(target, { recursive: true, force: true });
}
console.log('Test artifacts cleaned.');
