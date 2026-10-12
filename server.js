server.js

"use strict";

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = "https://tradexprize.ai.studio";

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TradeX Prize"
  });
});

app.use(
  "/",
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    followRedirects: false,
    ws: true,
    proxyTimeout: 30000,
    timeout: 30000,

    on: {
      proxyReq(proxyReq) {
        proxyReq.setHeader("Host", new URL(TARGET).host);
      },

      proxyRes(proxyRes) {
        const location = proxyRes.headers.location;

        if (location) {
          try {
            const redirectURL = new URL(location, TARGET);

            if (redirectURL.hostname === new URL(TARGET).hostname) {
              proxyRes.headers.location =
                redirectURL.pathname +
                redirectURL.search +
                redirectURL.hash;
            }
          } catch (_) {}
        }

        proxyRes.headers["cache-control"] = "no-store";
      },

      error(err, req, res) {
        console.error("Upstream error:", err.message);

        if (!res.headersSent) {
          res.status(502).send(
            "TradeX Prize is temporarily unavailable. Please try again."
          );
        }
      }
    }
  })
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TradeX Prize server listening on port ${PORT}`);
});

package.json

{
  "name": "tradexprize-proxy",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "express": "^5.1.0",
    "http-proxy-middleware": "^3.0.5"
  }
}
