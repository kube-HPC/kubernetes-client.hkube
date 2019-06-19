
const Client = require('./client-base');

class ResourceQuotas extends Client {
    async get({ name, labelSelector, useNamespace = true } = {}) {
        const namespace = useNamespace ? this._namespace : undefined;
        return this._client.api.v1.namespaces(namespace).resourcequotas(name).get({ qs: { labelSelector } });
    }
}

module.exports = ResourceQuotas;
