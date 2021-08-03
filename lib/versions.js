
const Client = require('./client-base');
const formatters = require('./formatters');

class Versions extends Client {
    constructor(client, namespace) {
        super(client, namespace);
        this._kubeVersion = null;
    }

    async get() {
        return this._client.version.get();
    }

    async getParsedVersion() {
        if (!this._kubeVersion) {
            const kubeVersionRaw = await this.get();
            this._kubeVersion = {
                ...kubeVersionRaw.body,
                major: formatters.parseInt(kubeVersionRaw.body.major, 1),
                minor: formatters.parseInt(kubeVersionRaw.body.minor, 9)
            };
            this._kubeVersion.version = `${this._kubeVersion.major}.${this._kubeVersion.minor}`;
        }
        return this._kubeVersion;
    }
}

module.exports = Versions;
