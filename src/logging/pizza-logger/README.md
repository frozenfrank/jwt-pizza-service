# Pizza Logger

A package for all your pizza store's logging needs.

## Setup

1. Install with `npm i pizza-logger`
1. Import with `const Logger = require('pizza-logger')`
1. Create a logger object with `const logger = new Logger(config)`

## Functions

| Function               | Usage                              |
| ---------------------- | ---------------------------------- |
| `httpLogger`           | `app.use(logger.httpLogger);`      |
| `dbLogger`             | `Logger.dbLogger(sqlQuery)`        |
| `factoryLogger`        | `Logger.factoryLogger(orderInfo)`  |
| `unhandledErrorLogger` | `Logger.unhandledErrorLogger(err)` |

## Usage examples

Database Logger

```js
async query(connection, sql, params) {
    logger.dbLogger(sql);
    const [results] = await connection.execute(sql, params);
    return results;
}
```

Factory logger

```js
// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const orderReq = req.body;
    const order = await DB.addDinerOrder(req.user, orderReq);
    const orderInfo = { diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order };
    logger.factoryLogger(orderInfo);
```

Unhandled Error Logger

```js
class StatusCodeError extends Error {
  constructor(message, statusCode) {
    super(message);
    logger.unhandledErrorLogger(this);
    this.statusCode = statusCode;
  }
}
```
