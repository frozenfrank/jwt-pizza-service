const express = require('express');
const config = require('../config.js');
const { Role, DB } = require('../database/database.js');
const { authRouter } = require('./authRouter.js');
const metrics = require('../metrics/metrics.js');
const logger = require('../logging/logger.js');
const { asyncHandler, StatusCodeError } = require('../endpointHelper.js');

const orderRouter = express.Router();

orderRouter.endpoints = [
  {
    method: 'GET',
    path: '/api/order/menu',
    description: 'Get the pizza menu',
    example: `curl localhost:3000/api/order/menu`,
    response: [{ id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' }],
  },
  {
    method: 'PUT',
    path: '/api/order/menu',
    requiresAuth: true,
    description: 'Add an item to the menu',
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [{ id: 1, title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 }],
  },
  {
    method: 'GET',
    path: '/api/order',
    requiresAuth: true,
    description: 'Get the orders for the authenticated user',
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 },
  },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Create a order for the authenticated user',
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: { order: { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }], id: 1 }, jwt: '1111111111' },
  },
];

// getMenu
orderRouter.get(
  '/menu',
  authRouter.failOnChaos,
  asyncHandler(async (req, res) => {
    res.send(await DB.getMenu());
  })
);

// addMenuItem
orderRouter.put(
  '/menu',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    if (!req.user.isRole(Role.Admin)) {
      throw new StatusCodeError('unable to add menu item', 403);
    }

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);
    res.send(await DB.getMenu());
  })
);

// getOrders
orderRouter.get(
  '/',
  authRouter.authenticateToken,
  authRouter.failOnChaos,
  asyncHandler(async (req, res) => {
    res.json(await DB.getOrders(req.user, req.query.page));
  })
);

// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    // Always log the order so we have records
    const orderReq = req.body;
    const order = await DB.addDinerOrder(req.user, orderReq);

    // Validate the order
    await validateOrder(orderReq);
    const orderTotal = getOrderTotal(order);

    // Send the order to the factory
    const orderInfo = {
      orderTotal,
      itemsCount: order.items.length,
      diner: { id: req.user.id, name: req.user.name, email: req.user.email },
      order,
    };
    logger.factoryLogger(orderInfo);
    const r = await metrics.trackPizzaCreationLatency(
      () => fetch(`${config.factory.url}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${config.factory.apiKey}` },
        body: JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order }),
      }));
    const j = await r.json();
    logFactoryResponse(orderInfo, j);

    if (r.ok) {
      metrics.logSaleSuccessful(orderTotal);
      res.send({ order, jwt: j.jwt, reportUrl: j.reportUrl });
    } else {
      metrics.logSaleFailure();
      res.status(500).send({ message: 'Failed to fulfill order at factory', reportUrl: j.reportUrl });
    }
  })
);

async function validateOrder(order) /* : Promise<void|never> */ {
  // Only meaningful orders policy
  if (!order) {
    throw new Error("Empty or falsy order object.");
  }
  if (!order.items?.length) {
    throw new Error("No items requested in order.");
  }

  // No refund policy
  if (order.items.some(i => i.price < 0)) {
    throw new Error("No refund policy for JWT Pizzas.");
  }

  // No discount policy
  const menuPrices = await getMenuItemPrices();
  if (order.items.some(i => menuPrices[i.menuId] === undefined || menuPrices[i.menuId] !== i.price)) {
    throw new Error("Price validation error.");
  }
}

/** Returns all valid prices for an menu item by ID. Each item can have at most one price. */
async function getMenuItemPrices() /* : Promise<Record<number, number>> */ {
  const menu = await DB.getMenu();
  const prices = {};

  for (const item of menu) {
    prices[item.id] = item.price;
  }

  return prices;
}

function logFactoryResponse(orderInfo, j) {
  const noJWT = {...j, jwt: "*****"};
  const log = {
    orderId: orderInfo.order.id,
    factory_rsp: noJWT,
  };
  logger.log("info", "factory-resp", log);
}

function getOrderTotal(order) {
  return order?.items.reduce((total, item) => total + (item.price || 0), 0) || 0;
}

module.exports = orderRouter;
