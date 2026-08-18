import { createServer } from "http";
import { parse } from "url";
import next from "next";

process.on("unhandledRejection", (reason: any) => {
  if (reason?.code === "ENOENT" || reason?.type === "PageNotFoundError") {
    return;
  }
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error: any) => {
  if (error?.code === "ENOENT" || error?.type === "PageNotFoundError") {
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
        console.error("Request Handler Error for", req.url, err?.message || err);
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




