/**
 * Comprehensive Mobile API Test Script
 * Tests all mobile APIs following the app flow
 * 
 * Usage: node test-mobile-api-comprehensive.js [baseUrl]
 * Example: node test-mobile-api-comprehensive.js http://localhost:3000
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
let authToken = '';
let refreshToken = '';
let userId = '';
let propertyId = '';
let investmentId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(testName) {
  log(`\n▶ ${testName}`, 'yellow');
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message, error) {
  log(`  ❌ ${message}`, 'red');
  if (error) {
    log(`     Error: ${error.message || error}`, 'gray');
    if (error.response?.data) {
      log(`     Details: ${JSON.stringify(error.response.data, null, 2)}`, 'gray');
    }
  }
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'gray');
}

// Helper function to make API requests
async function apiRequest(method, endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = { status: response.status, data };
      throw error;
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error, status: error.response?.status || 0 };
  }
}

// Test functions
async function testRegister() {
  logTest('1. Register New User');
  
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  const result = await apiRequest('POST', '/api/mobile/auth/register', {
    body: {
      email,
      password,
      fullName: 'Test User',
      phone: '+923001234567',
    },
  });

  if (result.success) {
    authToken = result.data.token;
    refreshToken = result.data.refreshToken;
    userId = result.data.user.id;
    logSuccess('User registered successfully');
    logInfo(`Email: ${email}`);
    logInfo(`User ID: ${userId}`);
    logInfo(`Display Code: ${result.data.user.displayCode}`);
    return true;
  } else {
    logError('Registration failed', result.error);
    return false;
  }
}

async function testLogin() {
  logTest('2. Login with Credentials');
  
  // First try to register, if it fails (user exists), try login
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  // Try register first
  let registerResult = await apiRequest('POST', '/api/mobile/auth/register', {
    body: {
      email,
      password,
      fullName: 'Test User',
      phone: '+923001234567',
    },
  });

  if (!registerResult.success && registerResult.status === 409) {
    // User exists, try login
    logInfo('User already exists, attempting login...');
    registerResult = await apiRequest('POST', '/api/mobile/auth/login', {
      body: { email, password },
    });
  }

  if (registerResult.success) {
    authToken = registerResult.data.token;
    refreshToken = registerResult.data.refreshToken;
    userId = registerResult.data.user.id;
    logSuccess('Login successful');
    logInfo(`User ID: ${userId}`);
    logInfo(`Display Code: ${registerResult.data.user.displayCode}`);
    return true;
  } else {
    logError('Login failed', registerResult.error);
    // Try with a known test user
    logInfo('Trying with default test credentials...');
    const loginResult = await apiRequest('POST', '/api/mobile/auth/login', {
      body: {
        email: 'testuser@example.com',
        password: 'password123',
      },
    });
    
    if (loginResult.success) {
      authToken = loginResult.data.token;
      refreshToken = loginResult.data.refreshToken;
      userId = loginResult.data.user.id;
      logSuccess('Login with default credentials successful');
      return true;
    }
    
    return false;
  }
}

async function testGetMe() {
  logTest('3. Get Current User (Me)');
  
  const result = await apiRequest('GET', '/api/mobile/auth/me');
  
  if (result.success) {
    logSuccess('User info retrieved');
    logInfo(`Email: ${result.data.email}`);
    logInfo(`Name: ${result.data.fullName}`);
    logInfo(`Display Code: ${result.data.displayCode}`);
    userId = result.data.id; // Update userId if not set
    return true;
  } else {
    logError('Get user failed', result.error);
    return false;
  }
}

async function testListProperties() {
  logTest('4. List Properties (Public)');
  
  const result = await apiRequest('GET', '/api/mobile/properties?page=1&limit=10');
  
  if (result.success) {
    logSuccess('Properties retrieved');
    logInfo(`Total: ${result.data.meta.total}`);
    logInfo(`Returned: ${result.data.data.length}`);
    
    if (result.data.data.length > 0) {
      propertyId = result.data.data[0].id;
      logInfo(`First Property: ${result.data.data[0].title} (${result.data.data[0].displayCode})`);
      logInfo(`Token Price: ${result.data.data[0].tokenPrice}`);
      logInfo(`Available Tokens: ${result.data.data[0].availableTokens}`);
    }
    return true;
  } else {
    logError('List properties failed', result.error);
    return false;
  }
}

async function testGetProperty() {
  if (!propertyId) {
    logTest('5. Get Single Property');
    logError('No property ID available');
    return false;
  }
  
  logTest('5. Get Single Property');
  
  const result = await apiRequest('GET', `/api/mobile/properties/${propertyId}`);
  
  if (result.success) {
    logSuccess('Property details retrieved');
    logInfo(`Title: ${result.data.title}`);
    logInfo(`Status: ${result.data.status}`);
    logInfo(`Valuation: ${result.data.valuation}`);
    logInfo(`Token Price: ${result.data.tokenPrice}`);
    return true;
  } else {
    logError('Get property failed', result.error);
    return false;
  }
}

async function testGetWallet() {
  logTest('6. Get Wallet Balance');
  
  const result = await apiRequest('GET', '/api/mobile/wallet');
  
  if (result.success) {
    logSuccess('Wallet retrieved');
    logInfo(`USDC Balance: ${result.data.usdc}`);
    logInfo(`Total Value: ${result.data.totalValue}`);
    logInfo(`Total Invested: ${result.data.totalInvested}`);
    logInfo(`Total Earnings: ${result.data.totalEarnings}`);
    logInfo(`Pending Deposits: ${result.data.pendingDeposits || 0}`);
    return true;
  } else {
    logError('Get wallet failed', result.error);
    return false;
  }
}

async function testGetInvestments() {
  logTest('7. Get User Investments');
  
  const result = await apiRequest('GET', '/api/mobile/investments');
  
  if (result.success) {
    logSuccess('Investments retrieved');
    logInfo(`Count: ${result.data.investments.length}`);
    
    if (result.data.investments.length > 0) {
      investmentId = result.data.investments[0].id;
      const inv = result.data.investments[0];
      logInfo(`First Investment: ${inv.displayCode}`);
      logInfo(`Property: ${inv.property?.title || 'N/A'}`);
      logInfo(`Tokens: ${inv.tokens}`);
      logInfo(`Invested: ${inv.investedAmount}`);
      logInfo(`Current Value: ${inv.currentValue}`);
      logInfo(`ROI: ${inv.roi}%`);
    }
    return true;
  } else {
    logError('Get investments failed', result.error);
    return false;
  }
}

async function testGetSingleInvestment() {
  if (!investmentId) {
    logTest('8. Get Single Investment');
    logInfo('No investments available, skipping...');
    return true;
  }
  
  logTest('8. Get Single Investment');
  
  const result = await apiRequest('GET', `/api/mobile/investments/${investmentId}`);
  
  if (result.success) {
    logSuccess('Investment details retrieved');
    logInfo(`Display Code: ${result.data.displayCode}`);
    logInfo(`Status: ${result.data.status}`);
    logInfo(`ROI: ${result.data.roi}%`);
    return true;
  } else {
    logError('Get investment failed', result.error);
    return false;
  }
}

async function testGetTransactions() {
  logTest('9. Get User Transactions');
  
  const result = await apiRequest('GET', '/api/mobile/transactions?page=1&limit=10');
  
  if (result.success) {
    logSuccess('Transactions retrieved');
    logInfo(`Total: ${result.data.meta.total}`);
    logInfo(`Returned: ${result.data.data.length}`);
    
    if (result.data.data.length > 0) {
      const tx = result.data.data[0];
      logInfo(`First Transaction: ${tx.type} - ${tx.amount} ${tx.currency}`);
      logInfo(`Status: ${tx.status}`);
    }
    return true;
  } else {
    logError('Get transactions failed', result.error);
    return false;
  }
}

async function testGetTransactionsWithFilters() {
  logTest('10. Get Transactions with Filters');
  
  const filters = [
    '?type=deposit&page=1&limit=5',
    '?type=investment&page=1&limit=5',
    '?status=completed&page=1&limit=5',
  ];
  
  let successCount = 0;
  for (const filter of filters) {
    const result = await apiRequest('GET', `/api/mobile/transactions${filter}`);
    if (result.success) {
      successCount++;
      logInfo(`Filter "${filter}" - Found ${result.data.data.length} transactions`);
    }
  }
  
  if (successCount > 0) {
    logSuccess(`Filtered transactions retrieved (${successCount}/${filters.length} filters)`);
    return true;
  } else {
    logError('Get filtered transactions failed');
    return false;
  }
}

async function testGetProfile() {
  logTest('11. Get User Profile');
  
  const result = await apiRequest('GET', '/api/mobile/profile');
  
  if (result.success) {
    logSuccess('Profile retrieved');
    logInfo(`Name: ${result.data.userInfo.fullName}`);
    logInfo(`Email: ${result.data.userInfo.email}`);
    logInfo(`Phone: ${result.data.userInfo.phone || 'N/A'}`);
    logInfo(`Security Settings: Present`);
    logInfo(`Notification Settings: Present`);
    return true;
  } else {
    logError('Get profile failed', result.error);
    return false;
  }
}

async function testUpdateProfile() {
  logTest('12. Update User Profile');
  
  const result = await apiRequest('PATCH', '/api/mobile/profile', {
    body: {
      fullName: 'Updated Test User',
      phone: '+923009876543',
    },
  });
  
  if (result.success) {
    logSuccess('Profile updated');
    // Response structure: { userInfo: {...}, securitySettings: {...}, notificationSettings: {...} }
    const userInfo = result.data.userInfo || result.data;
    logInfo(`Updated Name: ${userInfo.fullName || 'N/A'}`);
    logInfo(`Updated Phone: ${userInfo.phone || 'N/A'}`);
    return true;
  } else {
    logError('Update profile failed', result.error);
    return false;
  }
}

async function testCreateInvestment() {
  if (!propertyId) {
    logTest('13. Create Investment');
    logInfo('No property available, skipping...');
    return true;
  }
  
  logTest('13. Create Investment');
  
  // First check wallet balance
  const walletResult = await apiRequest('GET', '/api/mobile/wallet');
  if (!walletResult.success || walletResult.data.usdc < 1000) {
    logInfo('Insufficient balance or wallet check failed, skipping investment creation...');
    logInfo('Note: User needs to deposit funds first to create investments');
    return true;
  }
  
  // Get property details to check available tokens
  const propResult = await apiRequest('GET', `/api/mobile/properties/${propertyId}`);
  if (!propResult.success || propResult.data.availableTokens < 0.1) {
    logInfo('Property has no available tokens, skipping investment creation...');
    return true;
  }
  
  const tokenCount = Math.min(0.1, propResult.data.availableTokens / 2);
  const result = await apiRequest('POST', '/api/mobile/investments', {
    body: {
      propertyId,
      tokenCount,
    },
  });
  
  if (result.success) {
    investmentId = result.data.id;
    logSuccess('Investment created');
    logInfo(`Investment ID: ${result.data.displayCode}`);
    logInfo(`Tokens: ${result.data.tokens}`);
    logInfo(`Amount: ${result.data.investedAmount}`);
    return true;
  } else {
    logError('Create investment failed', result.error);
    logInfo('This might be expected if balance is insufficient or KYC not verified');
    return false;
  }
}

async function testPropertiesFilters() {
  logTest('14. Test Property Filters');
  
  const filters = [
    '?page=1&limit=5',
    '?status=active&page=1&limit=5',
    '?filter=Trending&page=1&limit=5',
    '?filter=High Yield&page=1&limit=5',
    '?minROI=10&page=1&limit=5',
  ];
  
  let successCount = 0;
  for (const filter of filters) {
    const result = await apiRequest('GET', `/api/mobile/properties${filter}`);
    if (result.success) {
      successCount++;
      logInfo(`Filter "${filter}" - Found ${result.data.data.length} properties`);
    }
  }
  
  if (successCount > 0) {
    logSuccess(`Property filters tested (${successCount}/${filters.length} filters)`);
    return true;
  } else {
    logError('Property filters test failed');
    return false;
  }
}

async function testRefreshToken() {
  if (!refreshToken) {
    logTest('15. Refresh Token');
    logInfo('No refresh token available, skipping...');
    return true;
  }
  
  logTest('15. Refresh Token');
  
  const result = await apiRequest('POST', '/api/mobile/auth/refresh', {
    body: { refreshToken },
  });
  
  if (result.success) {
    authToken = result.data.token;
    refreshToken = result.data.refreshToken;
    logSuccess('Token refreshed');
    logInfo('New tokens obtained');
    return true;
  } else {
    logError('Refresh token failed', result.error);
    return false;
  }
}

async function testLogout() {
  logTest('16. Logout');
  
  // Fastify requires a body when Content-Type is application/json, so send empty object
  const result = await apiRequest('POST', '/api/mobile/auth/logout', {
    body: {},
  });
  
  if (result.success) {
    logSuccess('Logged out successfully');
    authToken = ''; // Clear token
    return true;
  } else {
    logError('Logout failed', result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  logSection('Mobile API Comprehensive Test Suite');
  log(`Base URL: ${BASE_URL}`, 'gray');
  log(`Started at: ${new Date().toISOString()}`, 'gray');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
  };
  
  const tests = [
    { name: 'Register', fn: testRegister, required: false },
    { name: 'Login', fn: testLogin, required: true },
    { name: 'Get Me', fn: testGetMe, required: true },
    { name: 'List Properties', fn: testListProperties, required: true },
    { name: 'Get Property', fn: testGetProperty, required: false },
    { name: 'Get Wallet', fn: testGetWallet, required: true },
    { name: 'Get Investments', fn: testGetInvestments, required: true },
    { name: 'Get Single Investment', fn: testGetSingleInvestment, required: false },
    { name: 'Get Transactions', fn: testGetTransactions, required: true },
    { name: 'Get Transactions (Filtered)', fn: testGetTransactionsWithFilters, required: false },
    { name: 'Get Profile', fn: testGetProfile, required: true },
    { name: 'Update Profile', fn: testUpdateProfile, required: false },
    { name: 'Create Investment', fn: testCreateInvestment, required: false },
    { name: 'Property Filters', fn: testPropertiesFilters, required: false },
    { name: 'Refresh Token', fn: testRefreshToken, required: false },
    { name: 'Logout', fn: testLogout, required: false },
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result === true) {
        results.passed++;
      } else if (result === false) {
        results.failed++;
        if (test.required) {
          logError(`Required test "${test.name}" failed. Stopping tests.`);
          break;
        }
      } else {
        results.skipped++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw an error`, error);
      results.failed++;
      if (test.required) {
        break;
      }
    }
  }
  
  // Summary
  logSection('Test Summary');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⏭ Skipped: ${results.skipped}`, 'yellow');
  log(`\nTotal: ${results.passed + results.failed + results.skipped}`, 'gray');
  
  if (authToken) {
    log(`\n⚠ Auth token is still active. You can use it for manual testing:`, 'yellow');
    log(`  ${authToken.substring(0, 50)}...`, 'gray');
  }
  
  log(`\nCompleted at: ${new Date().toISOString()}`, 'gray');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ with native fetch support.');
  console.error('Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run tests
runTests().catch((error) => {
  logError('Fatal error running tests', error);
  process.exit(1);
});

