const http = require('http');
const fileSystem = require('fs');
const path = require('path');
const url = require('url');

const requestListener = function (request, response) {
    let filename = url.parse(request.url,true).pathname.slice(1);

    if (!filename) filename = 'index.html';
    if (filename === 'favicon.ico') return;

    let filePath = path.join(__dirname, filename);

    var readStream = fileSystem.createReadStream(filePath);
    readStream.pipe(response);
}

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 8080);