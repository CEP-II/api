const http = require('http') 
const app = require('./app')


const port = process.env.port || 3000;

// listener: function execute whenver we get new request, returns the response
const server = http.createServer(app);

server.listen(port);