const Client = require('./client-base');
const formatters = require('./formatters');

class Versions extends Client {
    constructor(client, namespace) {
        super(client, namespace);
        this._version = null;
    }

    _getPrefix() {
        // not used here
    }

    async get() {
        return this._client.version.get();
    }

    async getParsedVersion() {
        if (!this._version) {
            const kubeVersionRaw = await this.get();
            this._version = {
                ...kubeVersionRaw.body,
                major: formatters.parseInt(kubeVersionRaw.body.major, 1),
                minor: formatters.parseInt(kubeVersionRaw.body.minor, 9)
            };
            this._version.version = `${this._version.major}.${this._version.minor}`;
        }
        return this._version;
    }
}

module.exports = Versions;
