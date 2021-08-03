
class Client {
    constructor(client, namespace, version) {
        this._client = client;
        this._namespace = namespace;
        this._version = version;
        this._prefix = this._getPrefix();
    }

    _getPrefix() {
        return this._client.api.v1;
    }
}

module.exports = Client;
