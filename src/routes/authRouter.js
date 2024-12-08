const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const metrics = require('../metrics/metrics.js');
const logger = require('../logging/logger.js');
const { asyncHandler } = require('../endpointHelper.js');
const { DB, Role } = require('../database/database.js');
const { readAuthToken } = require('./authHelper.js');

const authRouter = express.Router();

authRouter.endpoints = [
  {
    method: 'POST',
    path: '/api/auth',
    description: 'Register a new user',
    example: `curl -X POST localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'`,
    response: { user: { id: 2, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'tttttt' },
  },
  {
    method: 'PUT',
    path: '/api/auth',
    description: 'Login existing user',
    example: `curl -X PUT localhost:3000/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json'`,
    response: { user: { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'tttttt' },
  },
  {
    method: 'PUT',
    path: '/api/auth/:userId',
    requiresAuth: true,
    description: 'Update user',
    example: `curl -X PUT localhost:3000/api/auth/1 -d '{"email":"a@jwt.com", "password":"admin", name: "Admin"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt'`,
    response: { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] },
  },
  {
    method: 'DELETE',
    path: '/api/auth',
    requiresAuth: true,
    description: 'Logout a user',
    example: `curl -X DELETE localhost:3000/api/auth -H 'Authorization: Bearer tttttt'`,
    response: { message: 'logout successful' },
  },
  {
    method: 'PUT',
    path: '/api/auth/chaos/:state',
    requiresAuth: true,
    description: 'Set chaos state of service',
    example: `curl -X PUT localhost:3000/api/auth/chaos/true -H 'Authorization: Bearer tttttt'`,
    response: { chaos: 'true' },
  },
];

async function setAuthUser(req, res, next) {
  const token = readAuthToken(req);
  if (token) {
    try {
      if (await DB.isLoggedIn(token)) {
        // Check the database to make sure the token is valid.
        req.user = jwt.verify(token, config.jwtSecret);
        req.user.isRole = (role) => !!req.user.roles.find((r) => r.role === role);
      }
    } catch {
      req.user = null;
    }
  }
  next();
}

// Authenticate token
authRouter.authenticateToken = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({ message: 'unauthorized' });
  }
  next();
};

let enableChaos = false;

// Enable/disable chaos
authRouter.put(
  '/chaos/:state',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      return res.status(404).send({ message: 'unauthorized' });
    }

    const requestedState = ("" + req.params.state).toLowerCase();
    enableChaos = requestedState === 'true';
    res.json({ chaos: enableChaos });
  })
);

// Fail on Chaos
authRouter.failOnChaos = (_req, res, next) => {
  if (enableChaos) {
    return res.status(401).send({ message: 'chaos!' });
  }
  next();
};

// register
authRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }
    await validateNewEmail(email);

    const user = await DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] });
    const auth = await setAuth(user);
    res.json({ user: user, token: auth });
  })
);

// login
authRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    let user;
    try {
      // NOTE: This would certainly be better done with some middleware monitoring,
      // but I'm not familiar enough with the way it works to instrument it properly.
      user = await DB.getUser(email, password);
      metrics.logAuthAttempt(true);
    } catch (error) {
      metrics.logAuthAttempt(false);
      throw error;
    }
    const auth = await setAuth(user);
    res.json({ user: user, token: auth });
  })
);

// logout
authRouter.delete(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    await clearAuth(req);
    res.json({ message: 'logout successful' });
  })
);

// updateUser
authRouter.put(
  '/:userId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const userId = Number(req.params.userId);
    const user = req.user;
    if (user.id !== userId && !user.isRole(Role.Admin)) {
      return res.status(403).json({ message: 'unauthorized' });
    }

    await validateNewEmail(email);

    const updatedUser = await DB.updateUser(userId, email, password, name);
    res.json(updatedUser);
  })
);

async function setAuth(user) {
  const tokenPayload = {...user, token_salt: Math.random(), timestamp: +new Date};
  const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: "24h" });
  await DB.loginUser(user.id, token);
  return token;
}

async function clearAuth(req) {
  const token = readAuthToken(req);
  if (token) {
    await DB.logoutUser(token);
  }
}

async function validateNewEmail(email) /*: Promise<void|never> */ {
  if (!email) {
    return;
  }

  const usersWithEmail = await DB.getRawUsersByEmail(email);
  if (usersWithEmail.length) {
    logger.log('warn', 'validate-unq-emails', usersWithEmail);
    throw new Error("Validation error."); // Intentionally ambiguous to attempt to protect list of valid emails
  } else {
    logger.log('info', 'validate-unq-emails', usersWithEmail);
    // Validated
  }
}

module.exports = { authRouter, setAuthUser };
