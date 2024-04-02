#!/usr/bin/env node
"use strict";

const { io } = require("socket.io-client");
const { pino } = require("pino");
const express = require("express");
const compression = require("compression");
const app = express();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const BASE_URL = "https://stromligning.dk";

let server;
let socket = io(BASE_URL, { autoConnect: false });
let data = {};

app.use(compression());

app.get("/v1/all", (_req, res) => {
  res.json(data);
});

app.get("/v1/:data", (req, res) => {
  let v = data[req.params.data];

  if (v) {
    res.json(v);
  } else {
    res.status(404).end();
  }
});

// `/livez` returns 200 if we're connected to the api.
app.get("/livez", (_req, res) => {
  if (socket.connected) {
    res.status(200).send("ok");
  } else {
    res.status(503);
  }
});

// `/readyz` returns 200 if we're connected to the api and we've cached at least 4
// values.
app.get("/readyz", (_req, res) => {
  if (socket.connected && Object.keys(data).length > 4) {
    res.status(200).send("ok");
  } else {
    res.status(503);
  }
});

socket.on("connect", () => {
  logger.info("Connected to API");
});

socket.onAny((event, ...args) => {
  if (args.length > 1) {
    logger.warn({ args }, "unexpected arg length");
    return;
  }

  const value = args[0];
  logger.trace({ event }, "received socket event");
  data[event] = value;
});

socket.on("disconnect", () => {
  logger.info("Lost connection to API, stopping web server");
  server.close();
});

server = app.listen(3000, () => {
  logger.debug("Connecting to API");
  socket.connect();
});
