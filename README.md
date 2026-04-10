# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
This project was bootstrapped with Fastify-CLI.

## Route Prefix

The app supports an optional global route prefix through `FASTIFY_ROUTE_PREFIX`.

- Unset it to keep the current local routes, for example `/ping` and `/auth/login`.
- Set `FASTIFY_ROUTE_PREFIX=/auth-serv` to expose the same public paths as production, for example `/auth-serv/ping` and `/auth-serv/auth/login`.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
