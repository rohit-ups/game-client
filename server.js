// server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

const server = http.createServer((req, res) => {
  // CORS headers (unchanged)
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Login proxy
  if (req.url === "/api/auth/login" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body);
        if (!username || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Username and password are required" }));
        }

        // Forward request
        const authUrl = new URL(`${BACKEND_URL}/api/auth/login`);
        const opts = {
          hostname: authUrl.hostname,
          port: authUrl.port || 80,
          path: authUrl.pathname,
          method: "POST",
          headers: { "Content-Type": "application/json" },
        };

        const backendReq = http.request(opts, backendRes => {
          let data = "";
          backendRes.on("data", chunk => data += chunk);
          backendRes.on("end", () => {
            res.writeHead(backendRes.statusCode, { "Content-Type": "application/json" });
            res.end(data);
          });
        });
        backendReq.on("error", err => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });

        backendReq.write(JSON.stringify({ username, password }));
        backendReq.end();
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve index.html
  if ((req.url === "/" || req.url === "/index.html") && req.method === "GET") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end("Error loading index.html");
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }

  // Fallback 404
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
});
