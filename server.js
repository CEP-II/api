const http = require("http");
const app = require("./app");

// unfortunately neither of us have a domain so we will probably just run this on localhost and
// expose this as a virtual domain through ngrok or something similar.

const port = process.env.port || 80;

// listener: function execute whenver we get new request, returns the response
const server = http.createServer(app);

server.listen(port);
