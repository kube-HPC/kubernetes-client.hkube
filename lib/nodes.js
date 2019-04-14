
const Client = require('./client-base');

class Nodes extends Client {
    async get({ labelSelector }) {
        return this._client.api.v1.nodes.get({ qs: { labelSelector } });
    }
}

module.exports = Nodes;
