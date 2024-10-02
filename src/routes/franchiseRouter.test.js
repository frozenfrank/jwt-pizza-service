const request = require('supertest');
const app = require('../service');
const { createAdminUser, expectSuccessfulResponse, randomName } = require('./test-helper');
const { loginUser, registerNewUser } = require('./authRouter.test');
const { randomInt } = require('crypto');

const API_ROOT = "/api/franchise/";
let ADMIN_USER;
let ADMIN_USER_ID;
let ADMIN_AUTH_TOKEN;
let NON_ADMIN_AUTH_TOKEN;
let firstFranchise;

beforeAll(async () => {
  ADMIN_USER = await createAdminUser();
  const adminUserResult = await loginUser(ADMIN_USER);
  ADMIN_USER_ID = adminUserResult.user.id;
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
  const getFranchiseRes = await asAdmin(r => r.get(API_ROOT+ADMIN_USER_ID)).send();
  expectSuccessfulResponse(getFranchiseRes);

  const franchises = getFranchiseRes.body;
  expect(franchises.length).toBeGreaterThanOrEqual(1);
  expect(franchises.find(f => f.id === firstFranchise.id)).toMatchObject(firstFranchise);
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

test('create store', createStore);

test('delete store', async () => {
  // Create a new store
  const newStore = await createStore();

  // Delete the store
  const franchiseId = firstFranchise.id;
  const deleteStoreRes = await asAdmin(r => r.delete(API_ROOT+franchiseId+"/store/"+newStore.id)).send();
  expectSuccessfulResponse(deleteStoreRes);
  expect(deleteStoreRes.text).toContain("store deleted");

  // Expect the store to be erased
  const getFranchisesRes = await asAdmin(r => r.get(API_ROOT+ADMIN_USER_ID)).send();
  expectSuccessfulResponse(getFranchisesRes);
  expect(getFranchisesRes.body.map(f => f.id)).not.toContain(newStore.id);
})

async function createStore() {
  const newStore = {franchiseId: firstFranchise.id, name: randomName() + " City"};
  const createStoreRes = await asAdmin(r => r.post(API_ROOT+firstFranchise.id+"/store")).send(newStore);
  expectSuccessfulResponse(createStoreRes);

  const createdStore = createStoreRes.body;
  expect(createdStore).toMatchObject(newStore);
  return createdStore;
}

function asAdmin(func, admin=true) {
  let r = request(app);
  r = func(r);
  return r.set('Authorization', `Bearer ${admin ? ADMIN_AUTH_TOKEN : NON_ADMIN_AUTH_TOKEN}`);
}
