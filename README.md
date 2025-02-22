# 🍕 jwt-pizza-service

![Coverage badge](coverageBadge.svg)

Backend service for making JWT pizzas. This service tracks users and franchises and orders pizzas. All order requests are passed to the JWT Pizza Factory where the pizzas are made.

JWTs are used for authentication objects.

## Observability

A Grafana dashboard is set up monitor this system. The internal dashboard leverages _Ad Hoc Queries_ to show just results from either the DEV or PRODUCTION environment at a time.
 - [Internal Dashboard](https://frozenfrank.grafana.net/d/fe59vb10qlmo0c/pizza-dashboard?)

## Deployment

In order for the server to work correctly it must be configured by providing a `config.js` file.

```js
export default {
  jwtSecret: 'your-cryptographically-generated-secret-here',
  db: {
    connection: {
      host: 'localhost',
      user: 'root',
      password: 'your-secure-database-password-here',
      database: 'pizza',
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: 'https://pizza-factory.cs329.click',
    apiKey: 'your-factory-issued-api-key-here',
  },
};
```

## Endpoints

You can get the documentation for all endpoints by making the following request.

```sh
curl localhost:3000/api/docs
```

## Development notes

Install the required packages.

```sh
npm install express jsonwebtoken mysql2 bcrypt
```

Nodemon is assumed to be installed globally so that you can have hot reloading when debugging.

```sh
npm -g install nodemon
```

## Chaos Testing

A chaos state is embedded, and some endpoints are set up to fail whenever [chaos](https://github.com/devops329/devops/blob/main/instruction/chaosTesting/chaosTesting.md) is enabled.

Use the following to enable or disable chaos for a testing or production server:

```shell
npm run chaos:local ADMIN_USER ADMIN_PASS TRUE/FALSE
npm run chaos:remote ADMIN_USER ADMIN_PASS TRUE/FALSE
```
