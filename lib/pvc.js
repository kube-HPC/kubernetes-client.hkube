const Client = require('./client-base');

class PVC extends Client {
    get({ name, labelSelector, useNamespace = true } = {}) {
        const prefix = useNamespace ? this._prefix.namespaces(this._namespace).persistentvolumeclaims(name) : this._client.api.v1.persistentvolumeclaims;
        return prefix.get({ qs: { labelSelector } });
    }

    delete({ name }) {
        return this._prefix
            .namespaces(this._namespace)
            .persistentvolumeclaims(name)
            .delete();
    }

    all(useNamespace = false) {
        return this.get({ useNamespace });
    }
}

module.exports = PVC;
