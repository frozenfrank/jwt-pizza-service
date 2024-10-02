const request = require('supertest');
const app = require('../service');
const { createAdminUser, expectSuccessfulResponse, randomName } = require('./test-helper');
const { loginUser, registerNewUser } = require('./authRouter.test');

const API_ROOT = "/api/franchise/";
let ADMIN_USER;
let ADMIN_AUTH_TOKEN;
let NON_ADMIN_AUTH_TOKEN;
let firstFranchise;

beforeAll(async () => {
  ADMIN_USER = await createAdminUser();
  const adminUserResult = await loginUser(ADMIN_USER);
  ADMIN_AUTH_TOKEN = adminUserResult.token;
  firstFranchise = await createFranchise();

  const nonAdminUserResult = await registerNewUser();
  NON_ADMIN_AUTH_TOKEN = nonAdminUserResult.token;
})

// const firstFranchise

async function createFranchise() {
  const createFranchiseRequest = {name: `Test Franchise (${randomName()})`, admins: [{email: ADMIN_USER.email}]};
  const createFranchiseRes = await asAdmin(r => r.post(API_ROOT)).send(createFranchiseRequest);
  expectSuccessfulResponse(createFranchiseRes);

  const createdFranchise = createFranchiseRes.body;
  expect(createdFranchise.name).toBe(createFranchiseRequest.name);
  expect(createdFranchise.admins.map(a => a.email)).toContain(ADMIN_USER.email);
  return createdFranchise
}

test('list', async () => {
  const getFranchisesRes = await request(app).get(API_ROOT).send();
  expectSuccessfulResponse(getFranchisesRes);

  const franchises = getFranchisesRes.body;
  expect(franchises.length).toBeGreaterThanOrEqual(1); // We have at least one franchise
  expect(franchises.map(f => f.name)).toContain(firstFranchise.name);
});

test('get my franchises', async () => {
  const getFranchiseRes = await asAdmin(r => r.get(API_ROOT+ADMIN_USER.id)).send();
  expectSuccessfulResponse(getFranchiseRes);

  const franchises = getFranchiseRes.body;
  expect(franchises.length).toBeGreaterThanOrEqual(1);
  expect(franchises.admins.map(a => a.email)).toContain(ADMIN_USER.email);
});

test('delete unauthorized', async () => {
  const deleteRes = await asAdmin(r => r.delete(API_ROOT+firstFranchise.id), false).send();
  expect(deleteRes.statusCode).toBe(403);
});

test('delete successful', async () => {
  const newFranchise = await createFranchise();

  const deleteRes = await asAdmin(r => r.delete(API_ROOT+newFranchise.id)).send();
  expectSuccessfulResponse(deleteRes);
})

test('create successful', createFranchise);

test('create unauthorized', async () => {
  const createFranchiseRequest = {name: `Test Franchise (${randomName()})`, admins: [{email: ADMIN_USER.email}]};
  const createFranchiseRes = await asAdmin((r => r.post(API_ROOT)), false).send(createFranchiseRequest);
  expect(createFranchiseRes.statusCode).toBe(403);
});

function asAdmin(func, admin=true) {
  let r = request(app);
  r = func(r);
  return r.set('Authorization', `Bearer ${admin ? ADMIN_AUTH_TOKEN : NON_ADMIN_AUTH_TOKEN}`);
}
