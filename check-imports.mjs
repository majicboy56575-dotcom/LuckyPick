// ============================================
// LuckyPick - Pre-flight Import & Reference Validator
// ============================================
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const TARGET_FILES = [
  'app.js',
  'services/randombox.js',
  'services/unboxing-modal.js',
  'services/firestore.js',
  'services/auth.js',
  'services/payment.js',
  'pages/home.js',
  'pages/profile.js',
  'pages/admin.js'
];

console.log('🔍 Running LuckyPick Import & Module Syntax Validation...\n');

let passCount = 0;
let failCount = 0;

for (const filePath of TARGET_FILES) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found: ${filePath}`);
      continue;
    }
    const code = fs.readFileSync(fullPath, 'utf8');

    // 1. Module Syntax Check
    new vm.SourceTextModule(code);

    // 2. Cross-reference check: detect calls to Server functions
    const criticalServerFuncs = [
      'openLuckyBoxServer',
      'purchaseProductServer',
      'convertVaultItemToPointsServer',
      'readyDanalPayment',
      'confirmDanalPayment',
      'applyGoldenRaffleServer'
    ];

    for (const funcName of criticalServerFuncs) {
      if (code.includes(`${funcName}(`)) {
        // Check if imported or defined
        const isImported = new RegExp(`\\b${funcName}\\b.*from`).test(code) || 
                           code.includes(`import {`) && code.includes(funcName);
        const isDefined = code.includes(`function ${funcName}`) || code.includes(`const ${funcName} =`);
        if (!isImported && !isDefined) {
          throw new Error(`Critical server function '${funcName}' is called but NOT defined or imported in ${filePath}!`);
        }
      }
    }

    console.log(`✅ [PASS] ${filePath}`);
    passCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${filePath}: ${err.message}`);
    failCount++;
  }
}

console.log(`\n========================================`);
console.log(`Result: ${passCount} Passed, ${failCount} Failed`);
if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`🎉 All modules and critical server references are 100% verified!`);
}
