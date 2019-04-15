const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

class MockClient {
    start(options) {
        return new Promise((resolve, reject) => {
            this._server = http.createServer(app);

            app.use(bodyParser.json());
            app.use('/', (req, res) => {
                res.json({ status: 'ok' });
            });

            this._server.listen(options.port, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }
}

module.exports = new MockClient();

