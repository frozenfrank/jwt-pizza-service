const request = require('supertest');
const app = require('../service');
const { randomName, expectSuccessfulResponse, expectUnauthorizedResponse } = require('./test-helper');

const API_ROOT = '/api/auth';

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;
let testUserServerResult;

beforeAll(async () => {
  testUserServerResult = await registerNewUser();
  testUserAuthToken = testUserServerResult.token;
});

afterAll(async () => {
  expect(testUserAuthToken).toBeTruthy();
  await request(app).delete("/api/auth").set('Authorization', `Bearer ${testUserAuthToken}`);
  // TODO: Delete the user from the database
});

async function registerNewUser() {
  testUser.email = randomName() + '@test.com';
  const registerRes = await request(app).post(API_ROOT).send(testUser);
  expectSuccessfulResponse(registerRes);
  expectValidJwt(registerRes.body.token);
  return registerRes.body;
}

async function loginTestUser(user=testUser) {
  const loginRes = await request(app).put(API_ROOT).send(user);
  expectSuccessfulResponse(loginRes);
  expectValidJwt(loginRes.body.token);
  return loginRes;
}

test('login', async () => {
  const loginRes = await loginTestUser();
  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
  expect(password).toBeTruthy(); // Use the variable to pass the linter
});

test('register successfully', async () => {
  const newUser = await registerNewUser();
  expect(newUser.user.id).not.toBe(testUserServerResult.user.id);

  expect(newUser).toHaveProperty("user.id");
  expect(newUser).toHaveProperty("user.name");
  expect(newUser).toHaveProperty("user.email");
  expect(newUser).toHaveProperty("user.roles", [{ role: 'diner' }]);
});

test('register without password', async () => {
  const registerRequest = {name: "Test user", email: "missing_pwd@test.com"};
  const registerRes = await request(app).post(API_ROOT).send(registerRequest);
  expect(registerRes.statusCode).toBe(400);
  expect(registerRes.text).toContain("required");
});

test('update successfully', async () => {
  const newUser = await registerNewUser();

  const updatedUser = {email: randomName() + "@test.com", password: "newPassword"};
  const updateRes = await request(app).put(API_ROOT+"/"+newUser.user.id).set('Authorization', `Bearer ${newUser.token}`).send(updatedUser);
  expectSuccessfulResponse(updateRes);
  expect(updateRes.body.email).toBe(updatedUser.email);
})

test('update invalid user', async () => {
  const updatedUser = {email: "bademail@test.com", password: "badpassword" };
  const updateRes = await request(app).put(API_ROOT+"/invalid-user-id").set('Authorization', `Bearer ${testUserAuthToken}`).send(updatedUser);
  expectUnauthorizedResponse(updateRes, 403);
});

test('update invalid token', async () => {
  const proposedUpdate = { email: "validemail@test.com", password: "validpassword" };
  const invalidAuthToken = "NOT_A_REAL_AUTH_TOKEN";
  const updateRes = await request(app).put(API_ROOT+"/invalid-user-id").set('Authorization', `Bearer ${invalidAuthToken}`).send(proposedUpdate);
  expectUnauthorizedResponse(updateRes);
});

test('delete', async () => {
  // Create a new user
  const newUser = await registerNewUser();
  expect(newUser).toBeTruthy();

  // The request should delete the token
  const deleteRes = await request(app).delete(API_ROOT).set('Authorization', `Bearer ${newUser.token}`).send();
  expectSuccessfulResponse(deleteRes);

  // Subsequent writes should fail
  const proposedUpdate = { email: "validemail@test.com", password: "validpassword" };
  const updateRes = await request(app).put(API_ROOT+"/"+newUser.user.id).set('Authorization', `Bearer ${newUser.token}`).send(proposedUpdate);
  expect(updateRes.statusCode).not.toBe(200);
});


test('delete without auth token', async () => {
  const deleteRes = await request(app).delete(API_ROOT).send();
  expectUnauthorizedResponse(deleteRes);
});


function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

exports.loginUser = loginTestUser;
