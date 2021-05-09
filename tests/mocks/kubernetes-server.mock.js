const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const pod = require('../stubs/pod.json');
const configmaps = require('../stubs/configmaps.json');

const map = {
    '/api/kube/api/v1/namespaces/default/pods/worker': pod,
    '/api/kube/api/v1/namespaces/default/configmaps/hkube-versions': configmaps,
    '/api/kube/api/v1/namespaces/default/resourcequotas/foo': {body: {name: 'foo'}}
}

class MockClient {
    start(options) {
        return new Promise((resolve, reject) => {
            this._server = http.createServer(app);

            app.use(bodyParser.json());
            app.use('/', (req, res) => {
                const p = map[req.path];
                const reply = (p && p.body) || ({ status: 'ok' });
                if (this.addPath) {
                    reply.path = req.path;
                }
                res.json(reply);
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

