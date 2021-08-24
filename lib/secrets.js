const Client = require('./client-base');

class Secrets extends Client {
    async get({ secretName }) {
        return this._prefix.namespaces(this._namespace).secrets(secretName).get();
    }
}

module.exports = Secrets;
