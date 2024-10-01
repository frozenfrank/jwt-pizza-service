const request = require('supertest');
const app = require('../service');
const { randomName } = require('./test-helper');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  testUser.email = randomName() + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  expectValidJwt(testUserAuthToken);
});

afterAll(async () => {
  expect(testUserAuthToken).toBeTruthy();
  await request(app).delete("/api/auth").set('Authorization', `Bearer ${testUserAuthToken}`)
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expectSuccessfulResponse(loginRes);
  expectValidJwt(loginRes.body.token);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBeTruthy(); // Use the variable to pass the linter
});

test('register', async () => {
  // Response should be successful
  // New user should have a different ID than our original user
  // New user should have required fields
  // New user should have a valid Jwt
});

test('update', async () => {
  // Response should be successful
  // Response should contain the updated information
});

test('delete', async () => {
  // Create new user
  // Delete new user
  // Expect subsequent write to fail
});

function expectSuccessfulResponse(res) {
  expect(res.status).toBe(200);
}
function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}
