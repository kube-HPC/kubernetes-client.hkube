
const Client = require('./client-base');

class ResourceQuotas extends Client {
    async get({ name, labelSelector, useNamespace = true } = {}) {
        const prefix = useNamespace ? this._client.api.v1.namespaces(this._namespace).resourcequotas(name) : this._client.api.v1.resourcequotas;
        return prefix.get({ qs: { labelSelector } });
    }
}

module.exports = ResourceQuotas;
