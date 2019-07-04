
const Client = require('./client-base');

class Secrets extends Client {
    async get({ secretName }) {
        return this._client.api.v1.namespaces(this._namespace).secrets(secretName).get();
    }
}

module.exports = Secrets;
