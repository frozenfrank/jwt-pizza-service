const { Role, DB } = require('../database/database.js');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  console.log("Automatically increasing JEST timeout for debugging purposes");
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 *
 * Credit: https://stackoverflow.com/a/1527820/2844859
 */
function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function expectSuccessfulResponse(res) {
  expect(res.statusCode).toBe(200);
}

function expectUnauthorizedResponse(res, errorStatusCode=401, errorMessage="unauthorized") {
  expect(res.statusCode).toBe(errorStatusCode);
  if (errorMessage) expect(res.text).toContain(errorMessage);
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
module.exports.randomInt = randomInt;
module.exports.createAdminUser = createAdminUser;
module.exports.expectSuccessfulResponse = expectSuccessfulResponse;
module.exports.expectUnauthorizedResponse = expectUnauthorizedResponse;
