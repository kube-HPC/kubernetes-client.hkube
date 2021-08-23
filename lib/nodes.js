const Client = require('./client-base');

class Nodes extends Client {
    async get({ labelSelector }) {
        return this._prefix.nodes.get({ qs: { labelSelector } });
    }

    async all() {
        return this._prefix.nodes.get();
    }
}

module.exports = Nodes;
