#!/usr/bin/env node
"use strict";

const { io } = require("socket.io-client");
const { createClient } = require("redis");
const { pino } = require("pino");

const logger = pino({
  level: "trace",
});

const BASE_URL = "https://stromligning.dk";
const { REDIS_URL } = process.env;

// Instantiate the redis client.
const client = createClient({ url: REDIS_URL });
logger.info(`Connecting to Redis at ${REDIS_URL}`);
const redisPromise = client.connect();
let socketPromise;
let socket = io(BASE_URL, { autoConnect: false });

client.on("ready", (test) => {
  logger.info({ test }, `Connected to Redis`);
  logger.info(`Connecting to API at ${BASE_URL} ..`);

  socketPromise = socket.connect();
});

client.on("error", (err) => {
  logger.error({ err }, "A redis error occurred");

  client.quit();
});

client.on("end", (d) => {
  logger.info({ d }, "Disconnected from Redis");

  socket.disconnect();
});

socket.on("connect", () => {
  logger.info("Connected to API");
});

// Available events:
//
// products
// prices
// transport
// co2emis
// co2emisprog

socket.on("products", async (products) => {
  const num_products = products.length;

  logger.info({ num_products }, `Updated list of products`);

  await client.set("dk.stromligning.products", JSON.stringify(products));
});

socket.on("prices", async (prices) => {
  const num_prices = prices.length;

  logger.info({ num_prices }, `Updated list of prices`);

  await client.set("dk.stromligning.prices", JSON.stringify(prices));
});

socket.on("transport", async (transport) => {
  const num_transports = transport.length;

  logger.info({ num_transports }, `Updated list of transports`);

  await client.set("dk.stromligning.transport", JSON.stringify(transport));
});

socket.on("disconnect", () => {
  logger.info("Disconnected from API");
});

Promise.any([redisPromise, socketPromise]).then(() =>
  logger.info("Lost connection")
);
