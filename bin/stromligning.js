#!/usr/bin/env node
"use strict";

const { io } = require("socket.io-client");
const { pino } = require("pino");
const express = require("express");
const compression = require("compression");
const app = express();
const logger = pino({
  level: "trace",
});

const BASE_URL = "https://stromligning.dk";

let server;
let socket = io(BASE_URL, { autoConnect: false });
let data = {};

app.use(compression());

app.get("/v1/all", (req, res) => {
  res.json(data);
});

app.get("/v1/:data", (req, res) => {
  let v = data[req.params.data];

  if (v) {
    res.json(v);
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
  logger.info({ event }, "received socket event");
  data[event] = value;
});

socket.on("disconnect", () => {
  logger.info("Disconnected from API, stopping web server");
  server.close();
});

server = app.listen(3000, () => {
  logger.debug("Connecting to API");
  socket.connect();
});
