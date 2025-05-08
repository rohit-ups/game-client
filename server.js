const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle API requests
  if (req.url === "/api/user/login" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { username, password } = data;

        if (!username || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Username and password are required",
            }),
          );
          return;
        }

        // Forward the login request to the backend
        const options = {
          hostname: "localhost",
          port: 5001,
          path: "/api/users/login",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        };

        const backendReq = http.request(options, (backendRes) => {
          let backendData = "";

          backendRes.on("data", (chunk) => {
            backendData += chunk;
          });

          backendRes.on("end", () => {
            // Forward the backend response to the client
            res.writeHead(backendRes.statusCode, {
              "Content-Type": "application/json",
            });
            res.end(backendData);
          });
        });

        backendReq.on("error", (error) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: `Backend connection error: ${error.message}`,
            }),
          );
        });

        backendReq.write(JSON.stringify({ username, password }));
        backendReq.end();
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });

    return;
  }

  if (req.url === "/api/save-token" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { token, username } = data;

        if (!token) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({ success: false, error: "Token is required" }),
          );
          return;
        }

        // Save token to file
        const tokenFilePath = path.join(__dirname, "token.txt");
        fs.writeFileSync(tokenFilePath, token);

        // Save username to file if provided
        if (username) {
          const usernameFilePath = path.join(__dirname, "username.txt");
          fs.writeFileSync(usernameFilePath, username);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            message: "Token saved successfully",
          }),
        );
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });

    return;
  }

  // Handle token loading request
  if (req.url === "/api/load-token" && req.method === "GET") {
    try {
      const tokenFilePath = path.join(__dirname, "token.txt");

      if (fs.existsSync(tokenFilePath)) {
        const token = fs.readFileSync(tokenFilePath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, token }));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, error: "Token file not found" }),
        );
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }

    return;
  }

  // Handle username loading request
  if (req.url === "/api/load-username" && req.method === "GET") {
    try {
      const usernameFilePath = path.join(__dirname, "username.txt");

      if (fs.existsSync(usernameFilePath)) {
        const username = fs.readFileSync(usernameFilePath, "utf8");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, username }));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ success: false, error: "Username file not found" }),
        );
      }
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: error.message }));
    }

    return;
  }

  // Serve index.html for the root path
  if (req.url === "/" || req.url === "/index.html") {
    fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading index.html: ${err.message}`);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else {
    // Handle 404
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log("Open this URL in your browser to debug socket connections");
});
