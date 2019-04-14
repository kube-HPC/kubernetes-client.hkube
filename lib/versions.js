
const Client = require('./client-base');

class Versions extends Client {
    async get() {
        return this._client.version.get();
    }
}

module.exports = Versions;
