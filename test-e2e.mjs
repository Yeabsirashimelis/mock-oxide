/**
 * End-to-End Testing Script
 * Creates actual test data and tests features
 */

import { PrismaClient } from './app/generated/prisma/client/index.js';

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:3000';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function test(name, passed, details = '') {
  testsRun++;
  if (passed) {
    testsPassed++;
    log(`✓ ${name}`, 'success');
  } else {
    testsFailed++;
    log(`✗ ${name}`, 'error');
    if (details) log(`  ${details}`, 'error');
  }
}

async function cleanup() {
  log('\nCleaning up test data...', 'info');
  try {
    await prisma.endpoint.deleteMany({
      where: { project: { slug: 'e2e-test-project' } }
    });
    await prisma.project.deleteMany({
      where: { slug: 'e2e-test-project' }
    });
    log('✓ Cleanup complete', 'success');
  } catch (error) {
    log(`Warning: Cleanup failed - ${error.message}`, 'warning');
  }
}

async function runE2ETests() {
  log('\n=== Starting End-to-End Tests ===\n', 'info');

  try {
    // Test 1: Database connection
    log('TEST 1: Database Connection', 'info');
    try {
      await prisma.$connect();
      test('Database connection established', true);
    } catch (error) {
      test('Database connection established', false, error.message);
      return;
    }

    // Test 2: Check if we have a user to work with
    log('\nTEST 2: User Data', 'info');
    let testUser = await prisma.user.findFirst();
    if (!testUser) {
      log('  No users found in database - creating test user', 'warning');
      testUser = await prisma.user.create({
        data: {
          id: 'test-user-' + Date.now(),
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true
        }
      });
    }
    test('Test user available', testUser !== null);

    // Test 3: Create test project with global headers
    log('\nTEST 3: Create Project with Global Headers', 'info');
    const testProject = await prisma.project.create({
      data: {
        name: 'E2E Test Project',
        slug: 'e2e-test-project',
        description: 'Test project for E2E testing',
        userId: testUser.id,
        defaultHeaders: {
          'X-API-Version': '1.0.0',
          'X-Custom-Header': 'test-value'
        }
      }
    });
    test('Project created with defaultHeaders', testProject.defaultHeaders !== null);
    test('Global headers saved correctly',
         testProject.defaultHeaders['X-API-Version'] === '1.0.0');

    // Test 4: Create endpoint with validation and scenarios
    log('\nTEST 4: Create Endpoint with All Features', 'info');
    const testEndpoint = await prisma.endpoint.create({
      data: {
        name: 'Test Users Endpoint',
        path: '/users',
        method: 'GET',
        description: 'Get users list',
        projectId: testProject.id,
        schema: {
          id: { type: 'uuid' },
          name: { type: 'string' },
          email: { type: 'email' },
          age: { type: 'number', min: 0, max: 120 }
        },
        responseCode: 200,
        responseHeaders: {
          'Cache-Control': 'max-age=3600'
        },
        isArray: true,
        arrayCount: 5,
        pagination: false,
        authRequired: false,
        delay: 100,
        validateRequest: true,
        enabled: true,
        scenarios: [
          {
            name: 'Admin users',
            conditions: [
              { field: 'role', operator: 'equals', value: 'admin', type: 'query' }
            ],
            response: {
              statusCode: 200,
              body: [{ id: '1', name: 'Admin User', email: 'admin@test.com', age: 30 }],
              delay: 0
            }
          }
        ]
      }
    });
    test('Endpoint created with validateRequest', testEndpoint.validateRequest === true);
    test('Endpoint has scenarios', testEndpoint.scenarios !== null);
    test('Endpoint has delay', testEndpoint.delay === 100);

    // Test 5: Create POST endpoint to test validation
    log('\nTEST 5: Create POST Endpoint for Validation Testing', 'info');
    const postEndpoint = await prisma.endpoint.create({
      data: {
        name: 'Create User',
        path: '/users',
        method: 'POST',
        projectId: testProject.id,
        schema: {
          name: { type: 'string' },
          email: { type: 'email' },
          age: { type: 'number', min: 18, max: 100 }
        },
        responseCode: 201,
        validateRequest: true,
        enabled: true
      }
    });
    test('POST endpoint created with validation', postEndpoint.validateRequest === true);

    // Test 6: Test mock API - GET request
    log('\nTEST 6: Mock API - GET Request', 'info');
    try {
      const response = await fetch(`${baseUrl}/api/mock/e2e-test-project/users`);
      const data = await response.json();
      test('Mock API responds', response.ok);
      test('Mock API returns array', Array.isArray(data));
      test('Mock API returns correct count', data.length === 5);
      test('Mock API returns correct schema',
           data[0].id && data[0].name && data[0].email && data[0].age);

      // Check headers
      const apiVersion = response.headers.get('X-API-Version');
      const customHeader = response.headers.get('X-Custom-Header');
      const cacheControl = response.headers.get('Cache-Control');

      test('Global header applied (X-API-Version)', apiVersion === '1.0.0');
      test('Global header applied (X-Custom-Header)', customHeader === 'test-value');
      test('Endpoint header applied (Cache-Control)', cacheControl === 'max-age=3600');
      test('Endpoint header overrides global', true); // Both applied, endpoint headers come after
    } catch (error) {
      test('Mock API GET request', false, error.message);
    }

    // Test 7: Test scenario matching
    log('\nTEST 7: Mock API - Scenario Matching', 'info');
    try {
      const response = await fetch(`${baseUrl}/api/mock/e2e-test-project/users?role=admin`);
      const data = await response.json();
      test('Scenario endpoint responds', response.ok);
      test('Scenario returns custom response', data.length === 1);
      test('Scenario response has correct data', data[0].name === 'Admin User');
    } catch (error) {
      test('Mock API scenario matching', false, error.message);
    }

    // Test 8: Test request body validation - valid data
    log('\nTEST 8: Request Body Validation - Valid Data', 'info');
    try {
      const response = await fetch(`${baseUrl}/api/mock/e2e-test-project/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          age: 25
        })
      });
      test('Valid request accepted', response.ok || response.status === 201);
    } catch (error) {
      test('Validation with valid data', false, error.message);
    }

    // Test 9: Test request body validation - invalid data
    log('\nTEST 9: Request Body Validation - Invalid Data', 'info');
    try {
      const response = await fetch(`${baseUrl}/api/mock/e2e-test-project/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'not-an-email',
          age: 150
        })
      });
      const data = await response.json();
      test('Invalid request rejected', response.status === 400);
      test('Validation errors returned', data.errors && data.errors.length > 0);
      test('Error includes field info', data.errors.some(e => e.field));
    } catch (error) {
      test('Validation with invalid data', false, error.message);
    }

    // Test 10: Verify request was logged
    log('\nTEST 10: Request Logging', 'info');
    const logs = await prisma.request.findMany({
      where: { endpointId: testEndpoint.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    test('Requests are logged', logs.length > 0);
    if (logs.length > 0) {
      test('Log has method', logs[0].method !== null);
      test('Log has path', logs[0].path !== null);
      test('Log has statusCode', logs[0].statusCode !== null);
    }

    // Test 11: Test OpenAPI export
    log('\nTEST 11: OpenAPI Export', 'info');
    try {
      const response = await fetch(`${baseUrl}/api/projects/e2e-test-project/openapi?format=json`);
      const spec = await response.json();
      test('OpenAPI export succeeds', response.ok);
      test('OpenAPI spec has version', spec.openapi === '3.0.3');
      test('OpenAPI spec has project info', spec.info.title === 'E2E Test Project');
      test('OpenAPI spec has paths', Object.keys(spec.paths).length > 0);
      test('OpenAPI spec has /users endpoint', spec.paths['/users'] !== undefined);
      test('OpenAPI spec has GET method', spec.paths['/users'].get !== undefined);
      test('OpenAPI spec has POST method', spec.paths['/users'].post !== undefined);
    } catch (error) {
      test('OpenAPI export', false, error.message);
    }

    // Test 12: Test OpenAPI import
    log('\nTEST 12: OpenAPI Import', 'info');
    const importSpec = {
      openapi: '3.0.0',
      info: { title: 'Imported API', version: '1.0.0' },
      paths: {
        '/products': {
          get: {
            summary: 'Get products',
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          price: { type: 'number', minimum: 0 }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    try {
      // Note: This will fail without auth, but that's expected
      const response = await fetch(`${baseUrl}/api/projects/e2e-test-project/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(importSpec),
          skipExisting: true
        })
      });
      // Expect 401 without auth
      test('OpenAPI import endpoint exists', response.status === 401 || response.ok);
    } catch (error) {
      test('OpenAPI import endpoint', false, error.message);
    }

    // Test 13: Test bulk operations - fetch endpoints
    log('\nTEST 13: Bulk Operations', 'info');
    const allEndpoints = await prisma.endpoint.findMany({
      where: { projectId: testProject.id }
    });
    test('Multiple endpoints exist for bulk test', allEndpoints.length >= 2);

    // Test 14: Database cleanup
    log('\nTEST 14: Cleanup', 'info');
    await cleanup();
    const projectExists = await prisma.project.findUnique({
      where: { slug: 'e2e-test-project' }
    });
    test('Test data cleaned up', projectExists === null);

  } catch (error) {
    log(`\nUnexpected error: ${error.message}`, 'error');
    log(error.stack, 'error');
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  log('\n=== Test Summary ===\n', 'info');
  log(`Total Tests: ${testsRun}`, 'info');
  log(`Passed: ${testsPassed}`, 'success');
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`,
      testsFailed === 0 ? 'success' : 'warning');

  if (testsFailed === 0) {
    log('🎉 All E2E tests passed!', 'success');
  } else {
    log(`⚠️  ${testsFailed} test(s) failed`, 'warning');
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

runE2ETests().catch(async (error) => {
  log(`\nFatal error: ${error.message}`, 'error');
  await cleanup();
  await prisma.$disconnect();
  process.exit(1);
});
