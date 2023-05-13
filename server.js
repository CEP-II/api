const http = require("http");
const https = require("https");
const fs = require("fs");
const app = require("./app");

const options = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/analogskilte.dk/privkey.pem",
    "utf8"
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/analogskilte.dk/fullchain.pem",
    "utf8"
  ),
};

// unfortunately neither of us have a domain so we will probably just run this on localhost and
// expose this as a virtual domain through ngrok or something similar.

const port = process.env.port || 443;

// const server = http.createServer(app);
const server = https.createServer(options, app);

server.listen(port);
