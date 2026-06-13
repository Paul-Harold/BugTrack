/**
 * Seed script: wipes the database and loads demo users, projects,
 * suites, test cases, test runs and bugs (with backdated timestamps
 * so the dashboard trend charts have data).
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const TestSuite = require('./models/TestSuite');
const TestCase = require('./models/TestCase');
const TestRun = require('./models/TestRun');
const Bug = require('./models/Bug');

const daysAgo = (n, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Project.deleteMany(),
    TestSuite.deleteMany(),
    TestCase.deleteMany(),
    TestRun.deleteMany(),
    Bug.deleteMany(),
  ]);

  // ---------- Users ----------
  const [manager, qa1, qa2, dev1, dev2] = await User.create([
    { name: 'Maria Santos', email: 'manager@bugtrack.dev', password: 'password123', role: 'manager' },
    { name: 'Paul Batiles', email: 'qa@bugtrack.dev', password: 'password123', role: 'qa' },
    { name: 'Quinn Reyes', email: 'qa2@bugtrack.dev', password: 'password123', role: 'qa' },
    { name: 'Devon Cruz', email: 'dev@bugtrack.dev', password: 'password123', role: 'developer' },
    { name: 'Dana Lim', email: 'dev2@bugtrack.dev', password: 'password123', role: 'developer' },
  ]);
  console.log('Users created');

  // ---------- Projects ----------
  const shop = await Project.create({
    name: 'E-Commerce Platform',
    key: 'SHOP',
    description: 'Customer-facing web shop: catalog, cart, checkout and payments.',
    createdBy: manager._id,
    members: [manager._id, qa1._id, qa2._id, dev1._id, dev2._id],
  });
  const bank = await Project.create({
    name: 'Mobile Banking App',
    key: 'BANK',
    description: 'iOS/Android banking app: accounts, transfers, bill payments.',
    createdBy: manager._id,
    members: [manager._id, qa1._id, dev1._id],
  });
  console.log('Projects created');

  // ---------- Suites ----------
  const [authSuite, cartSuite, checkoutSuite, searchSuite] = await TestSuite.create([
    { project: shop._id, name: 'Authentication', description: 'Login, registration, password reset', createdBy: qa1._id },
    { project: shop._id, name: 'Shopping Cart', description: 'Add/remove items, quantities, totals', createdBy: qa1._id },
    { project: shop._id, name: 'Checkout & Payments', description: 'Address, shipping, card payments', createdBy: qa2._id },
    { project: shop._id, name: 'Search & Catalog', description: 'Product search, filters, sorting', createdBy: qa2._id },
  ]);
  const [bankAuthSuite, transferSuite] = await TestSuite.create([
    { project: bank._id, name: 'Login & Security', description: 'PIN, biometrics, session handling', createdBy: qa1._id },
    { project: bank._id, name: 'Fund Transfers', description: 'Internal and external transfers', createdBy: qa1._id },
  ]);
  console.log('Suites created');

  // ---------- Test cases ----------
  const shopCaseDefs = [
    [authSuite, 'User can log in with valid credentials', 'critical', [
      { action: 'Navigate to /login', expected: 'Login form is displayed' },
      { action: 'Enter valid email and password, click Sign In', expected: 'User is redirected to the dashboard' },
    ]],
    [authSuite, 'Login fails with wrong password', 'high', [
      { action: 'Enter valid email with an incorrect password', expected: 'Error message "Invalid email or password" is shown' },
    ]],
    [authSuite, 'User can register a new account', 'high', [
      { action: 'Open /register and fill all required fields', expected: 'Validation passes' },
      { action: 'Submit the form', expected: 'Account is created and user is logged in' },
    ]],
    [authSuite, 'Password reset email is sent', 'medium', [
      { action: 'Click "Forgot password" and enter a registered email', expected: 'Confirmation message shown and email delivered' },
    ]],
    [cartSuite, 'Add product to cart from product page', 'critical', [
      { action: 'Open any product detail page', expected: 'Add to Cart button is visible' },
      { action: 'Click Add to Cart', expected: 'Cart badge count increases by 1' },
    ]],
    [cartSuite, 'Update quantity recalculates totals', 'high', [
      { action: 'In the cart, change quantity from 1 to 3', expected: 'Line total and cart subtotal update correctly' },
    ]],
    [cartSuite, 'Remove item from cart', 'medium', [
      { action: 'Click the remove icon on a cart line', expected: 'Item disappears and totals update' },
    ]],
    [checkoutSuite, 'Complete checkout with valid card', 'critical', [
      { action: 'Proceed to checkout with items in cart', expected: 'Address step is shown' },
      { action: 'Fill address, select shipping, enter test card 4242...', expected: 'Payment succeeds' },
      { action: 'Confirm order', expected: 'Order confirmation page with order number' },
    ]],
    [checkoutSuite, 'Declined card shows friendly error', 'high', [
      { action: 'Pay with test card 4000-0000-0000-0002', expected: 'Decline message shown, order not created' },
    ]],
    [checkoutSuite, 'Shipping cost updates by region', 'medium', [
      { action: 'Switch shipping address country', expected: 'Shipping options and prices refresh' },
    ]],
    [searchSuite, 'Search returns relevant products', 'high', [
      { action: 'Search for "laptop"', expected: 'Results contain laptop products, ranked by relevance' },
    ]],
    [searchSuite, 'Filters narrow results', 'medium', [
      { action: 'Apply brand and price-range filters', expected: 'Only matching products remain' },
    ]],
    [null, 'Footer links navigate correctly', 'low', [
      { action: 'Click each footer link', expected: 'Correct page opens without 404' },
    ]],
  ];
  const bankCaseDefs = [
    [bankAuthSuite, 'Login with correct PIN', 'critical', [
      { action: 'Enter registered 6-digit PIN', expected: 'Home screen with account balances loads' },
    ]],
    [bankAuthSuite, 'Account locks after 5 failed attempts', 'critical', [
      { action: 'Enter a wrong PIN five times', expected: 'Account is temporarily locked with recovery instructions' },
    ]],
    [bankAuthSuite, 'Session expires after 5 minutes idle', 'high', [
      { action: 'Leave the app idle for 5 minutes', expected: 'User is logged out and returned to PIN screen' },
    ]],
    [transferSuite, 'Transfer between own accounts', 'critical', [
      { action: 'Create a transfer from savings to checking', expected: 'Balances update instantly on both accounts' },
    ]],
    [transferSuite, 'Transfer fails with insufficient funds', 'high', [
      { action: 'Attempt a transfer larger than the balance', expected: 'Validation error, no transaction created' },
    ]],
  ];

  const shopCases = [];
  let seq = 0;
  for (const [suite, title, priority, steps] of shopCaseDefs) {
    seq += 1;
    shopCases.push(
      await TestCase.create({
        project: shop._id,
        suite: suite ? suite._id : null,
        seq,
        code: `SHOP-TC${seq}`,
        title,
        priority,
        steps,
        status: 'active',
        createdBy: seq % 2 === 0 ? qa2._id : qa1._id,
      })
    );
  }
  const bankCases = [];
  seq = 0;
  for (const [suite, title, priority, steps] of bankCaseDefs) {
    seq += 1;
    bankCases.push(
      await TestCase.create({
        project: bank._id,
        suite: suite._id,
        seq,
        code: `BANK-TC${seq}`,
        title,
        priority,
        steps,
        status: 'active',
        createdBy: qa1._id,
      })
    );
  }
  await Project.updateOne({ _id: shop._id }, { 'counters.testCase': shopCases.length });
  await Project.updateOne({ _id: bank._id }, { 'counters.testCase': bankCases.length });
  console.log('Test cases created');

  // ---------- Test runs ----------
  const exec = (tc, status, by, day, notes = '') => ({
    testCase: tc._id,
    status,
    notes,
    executedBy: status === 'untested' ? null : by._id,
    executedAt: status === 'untested' ? null : daysAgo(day, 14),
  });

  await TestRun.create({
    project: shop._id,
    name: 'Sprint 23 Regression',
    description: 'Full regression before the v2.3 release.',
    status: 'completed',
    createdBy: qa1._id,
    executions: [
      exec(shopCases[0], 'passed', qa1, 12),
      exec(shopCases[1], 'passed', qa1, 12),
      exec(shopCases[2], 'passed', qa2, 12),
      exec(shopCases[3], 'failed', qa2, 11, 'No email received after 15 minutes — see SHOP-BUG3'),
      exec(shopCases[4], 'passed', qa1, 11),
      exec(shopCases[5], 'failed', qa1, 11, 'Subtotal does not refresh until page reload'),
      exec(shopCases[6], 'passed', qa2, 11),
      exec(shopCases[7], 'passed', qa2, 10),
      exec(shopCases[8], 'passed', qa1, 10),
      exec(shopCases[9], 'blocked', qa1, 10, 'Shipping rates API sandbox is down'),
      exec(shopCases[10], 'passed', qa2, 10),
      exec(shopCases[11], 'passed', qa2, 10),
      exec(shopCases[12], 'skipped', qa2, 10, 'Low priority — deferred'),
    ],
  });
  await TestRun.create({
    project: shop._id,
    name: 'Sprint 24 Smoke Test',
    description: 'Smoke test on the release candidate build.',
    status: 'in_progress',
    createdBy: qa2._id,
    executions: [
      exec(shopCases[0], 'passed', qa1, 2),
      exec(shopCases[4], 'passed', qa1, 2),
      exec(shopCases[7], 'failed', qa2, 1, 'Payment spinner hangs on slow 3G — see SHOP-BUG8'),
      exec(shopCases[8], 'passed', qa2, 1),
      exec(shopCases[10], 'untested', qa1, 0),
      exec(shopCases[5], 'untested', qa1, 0),
    ],
  });
  await TestRun.create({
    project: bank._id,
    name: 'Security Review Run',
    description: 'Auth and session handling checks for the audit.',
    status: 'completed',
    createdBy: qa1._id,
    executions: [
      exec(bankCases[0], 'passed', qa1, 6),
      exec(bankCases[1], 'passed', qa1, 6),
      exec(bankCases[2], 'failed', qa1, 5, 'Session stayed alive for 9 minutes — see BANK-BUG2'),
      exec(bankCases[3], 'passed', qa1, 5),
      exec(bankCases[4], 'passed', qa1, 5),
    ],
  });
  console.log('Test runs created');

  // ---------- Bugs ----------
  // [project, title, severity, priority, status, reporter, assignee, createdDaysAgo, resolvedDaysAgo|null, testCase]
  const bugDefs = [
    [shop, 'Password reset email never arrives', 'major', 'high', 'in_progress', qa2, dev1, 28, null, shopCases[3]],
    [shop, 'Cart subtotal not updating after quantity change', 'major', 'high', 'resolved', qa1, dev1, 26, 22, shopCases[5]],
    [shop, 'XSS vulnerability in product review form', 'blocker', 'urgent', 'closed', qa1, dev2, 25, 20, null],
    [shop, 'Checkout button overlaps footer on mobile', 'minor', 'low', 'closed', qa2, dev2, 24, 21, null],
    [shop, 'Order confirmation shows wrong currency symbol', 'major', 'medium', 'resolved', qa2, dev1, 20, 15, null],
    [shop, 'Search results page crashes on empty query', 'critical', 'urgent', 'closed', qa1, dev1, 18, 14, shopCases[10]],
    [shop, 'Discount code applied twice when double-clicking', 'critical', 'high', 'in_progress', qa1, dev2, 12, null, null],
    [shop, 'Payment spinner hangs forever on slow connections', 'critical', 'urgent', 'open', qa2, dev1, 8, null, shopCases[7]],
    [shop, 'Product images load slowly on category pages', 'minor', 'medium', 'open', qa2, null, 6, null, null],
    [shop, 'Wishlist icon misaligned in Safari', 'minor', 'low', 'open', qa1, null, 4, null, null],
    [shop, 'Inventory count goes negative on concurrent orders', 'blocker', 'urgent', 'in_progress', manager, dev1, 3, null, null],
    [shop, 'Footer newsletter signup returns 500', 'major', 'medium', 'open', qa2, dev2, 1, null, null],
    [bank, 'Fingerprint login fails on Android 15', 'critical', 'urgent', 'resolved', qa1, dev1, 21, 16, bankCases[0]],
    [bank, 'Idle session not expiring after 5 minutes', 'blocker', 'urgent', 'in_progress', qa1, dev1, 14, null, bankCases[2]],
    [bank, 'Transfer history shows duplicate entries', 'major', 'high', 'resolved', qa1, dev1, 10, 5, null],
    [bank, 'Currency rounding error on large transfers', 'critical', 'high', 'open', qa1, dev1, 7, null, bankCases[3]],
    [bank, 'Dark mode renders balance text invisible', 'minor', 'medium', 'reopened', qa1, dev1, 16, null, null],
    [bank, 'App crashes when rotating device on transfer screen', 'major', 'medium', 'open', qa1, null, 2, null, null],
  ];

  const counters = {};
  const backdates = [];
  for (const [project, title, severity, priority, status, reporter, assignee, created, resolved, testCase] of bugDefs) {
    const key = project.key;
    counters[key] = (counters[key] || 0) + 1;
    const bug = await Bug.create({
      project: project._id,
      seq: counters[key],
      code: `${key}-BUG${counters[key]}`,
      title,
      description: `${title}. Observed on the latest build; reproducible consistently.`,
      stepsToReproduce: '1. See linked test case / title.\n2. Follow the normal user flow.\n3. Observe the incorrect behavior.',
      severity,
      priority,
      status,
      reportedBy: reporter._id,
      assignedTo: assignee ? assignee._id : null,
      testCase: testCase ? testCase._id : null,
      resolvedAt: resolved !== null ? daysAgo(resolved, 16) : null,
      comments:
        status !== 'open'
          ? [{ author: (assignee || reporter)._id, text: 'Looking into this — can reproduce locally.' }]
          : [],
    });
    backdates.push({
      updateOne: {
        filter: { _id: bug._id },
        update: { $set: { createdAt: daysAgo(created, 9) } },
      },
    });
  }
  // bypass mongoose so timestamps aren't overwritten
  await Bug.collection.bulkWrite(backdates);
  await Project.updateOne({ _id: shop._id }, { 'counters.bug': counters.SHOP });
  await Project.updateOne({ _id: bank._id }, { 'counters.bug': counters.BANK });
  console.log('Bugs created');

  console.log('\nSeed complete. Demo accounts (password: password123):');
  console.log('  manager@bugtrack.dev  (Manager)');
  console.log('  qa@bugtrack.dev       (QA)');
  console.log('  dev@bugtrack.dev      (Developer)');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
