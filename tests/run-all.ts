import { execSync } from 'child_process';

console.log('🚀 ===============================================');
console.log('🎬 CINEBOOK COMPREHENSIVE QA TEST SUITE RUNNER');
console.log('===============================================\n');

const suites = [
  { name: '1. Concurrency & Race-Condition Double-Booking Prevention', cmd: 'npm run test:concurrency' },
  { name: '2. Complete Booking Lifecycle, Pricing & Idempotency', cmd: 'npm run test:lifecycle' },
  { name: '3. Expired Seat Holds & Cron Idempotent Cleanup', cmd: 'npm run test:cron' },
  { name: '4. Security, JWT Tamper Protection & IDOR Isolation', cmd: 'npm run test:security' },
];

let allPassed = true;

for (const suite of suites) {
  console.log(`\n▶️  Running: ${suite.name}...`);
  try {
    const output = execSync(suite.cmd, { stdio: 'inherit', env: process.env });
    console.log(`✅  Passed: ${suite.name}`);
  } catch (err) {
    console.error(`❌  Failed: ${suite.name}`);
    allPassed = false;
    break;
  }
}

console.log('\n===============================================');
if (allPassed) {
  console.log('🌟 ALL 4 QA AGENT TEST SUITES PASSED FLAWLESSLY!');
  console.log('===============================================\n');
  process.exit(0);
} else {
  console.error('💥 ONE OR MORE TEST SUITES FAILED!');
  console.log('===============================================\n');
  process.exit(1);
}
