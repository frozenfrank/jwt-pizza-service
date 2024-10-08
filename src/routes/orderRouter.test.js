const request = require('supertest');
const app = require('../service');
const { expectSuccessfulResponse, randomName, createAdminUser, expectUnauthorizedResponse } = require('./test-helper');
const { registerNewUser, loginUser } = require('./authRouter.test');
const { randomInt } = require('crypto');

const API_ROOT = "/api/order/";

let TEST_USER_AUTH;
let ADMIN_USER_AUTH;

beforeAll(async () => {
  const adminUser = await createAdminUser();
  const loggedInAdminUser = await loginUser(adminUser);
  ADMIN_USER_AUTH = loggedInAdminUser.token;

  const testUser = await registerNewUser();
  TEST_USER_AUTH = testUser.token;
});

test('get menu', async () => {
  const items = await Promise.all([
    addMenuItem(),
    addMenuItem(),
  ]);

  // Get menu
  const menuRes = await sendRequest(r => r.get(API_ROOT+"menu", false)).send();
  expectSuccessfulResponse(menuRes);

  // Assert all added items
  const menuItemIds = menuRes.body.map(i => i.id);
  for (const item of items) {
    expect(menuItemIds).toContain(item.id);
  }
});

test('add menu item', addMenuItem);

test('add menu item non-admin', async () => {
  const newItem = {title: randomName(), description: "Lame item description", image: randomName() + ".png", price: randomInt(1, 10000)/100};
  const addMenuRes = await sendRequest(r => r.put(API_ROOT+"menu"), true, false).send(newItem);
  expectUnauthorizedResponse(addMenuRes, 403, null);
});

async function addMenuItem() {
  const newItem = {title: randomName(), description: "Lame item description", image: randomName() + ".png", price: randomInt(1, 10000)/100};
  const addMenuRes = await sendRequest(r => r.put(API_ROOT+"menu"), true, true).send(newItem);
  expectSuccessfulResponse(addMenuRes);

  const addedItem = addMenuRes.body.find(i => i.title === newItem.title);
  expect(addedItem).toMatchObject(newItem);
  return addedItem
}

function sendRequest(func, loggedIn = true, admin = false) {
  let r = request(app);
  r = func(r);
  if (loggedIn) r = r.set('Authorization', `Bearer ${admin ? ADMIN_USER_AUTH : TEST_USER_AUTH}`);
  return r;
}
