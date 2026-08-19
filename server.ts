import { createServer } from "http";
import { parse } from "url";
import fs from "fs";
import path from "path";
import next from "next";

function isIgnorableError(err: any): boolean {
  if (!err) return false;
  const msg = err.message || String(err);
  return (
    err.code === "ENOENT" ||
    err.type === "PageNotFoundError" ||
    err.name === "PageNotFoundError" ||
    msg.includes("Cannot find module for page") ||
    msg.includes("/_document") ||
    msg.includes("/_error")
  );
}

process.on("unhandledRejection", (reason: any) => {
  if (isIgnorableError(reason)) {
    return;
  }
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error: any) => {
  if (isIgnorableError(error)) {
    return;
  }
  console.error("Uncaught Exception:", error);
});

const port = 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "/", true);
      await handle(req, res, parsedUrl);
    } catch (err: any) {
      if (err?.code !== "ERR_HTTP_HEADERS_SENT" && !res.headersSent) {
        if (!isIgnorableError(err)) {
          console.error("Request Handler Error for", req.url, err?.message || err);
        }
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  });

  server.listen(port, () => {
    console.log(`> Server ready on http://localhost:${port}`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err);
  });
}).catch((err) => {
  console.error("App prepare error:", err);
});




