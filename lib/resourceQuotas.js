
const Client = require('./client-base');

class ResourceQuotas extends Client {
    async get({ name, labelSelector, useNamespace = true } = {}) {
        const prefix = useNamespace ? this._prefix.namespaces(this._namespace).resourcequotas(name) : this._prefix.resourcequotas;
        return prefix.get({ qs: { labelSelector } });
    }
}

module.exports = ResourceQuotas;
