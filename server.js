"use strict";

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = "https://tradexprize.ai.studio";

app.disable("x-powered-by");
app.set("trust proxy", 1);

// Health check for Render
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TradeX Prize"
  });
});

// Proxy requests to the original website
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
          } catch (error) {
            console.error("Redirect handling error:", error.message);
          }
        }

        proxyRes.headers["cache-control"] = "no-store";
      },

      error(error, req, res) {
        console.error("Proxy error:", error.message);

        if (!res.headersSent) {
          res.status(502).send(
            "TradeX Prize is temporarily unavailable. Please try again later."
          );
        }
      }
    }
  })
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TradeX Prize server running on port ${PORT}`);
});
