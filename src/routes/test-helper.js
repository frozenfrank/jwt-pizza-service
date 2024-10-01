const { Role, DB } = require('../database/database.js');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  console.log("Automatically increasing JEST timeout for debugging purposes");
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

function expectSuccessfulResponse(res) {
  expect(res.statusCode).toBe(200);
}

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  await DB.addUser(user);

  user.password = 'toomanysecrets';
  return user;
}

module.exports.randomName = randomName;
module.exports.createAdminUser = createAdminUser;
module.exports.expectSuccessfulResponse = expectSuccessfulResponse;
