const Client = require('./client-base');

class Pods extends Client {
    get({ podName, labelSelector, useNamespace = true } = {}) {
        const prefix = useNamespace ? this._prefix.namespaces(this._namespace).pods(podName) : this._client.api.v1.pods;
        return prefix.get({ qs: { labelSelector } });
    }

    delete({ podName }) {
        return this._prefix
            .namespaces(this._namespace)
            .pods(podName)
            .delete();
    }

    all(useNamespace = false) {
        return this.get({ useNamespace });
    }
}

module.exports = Pods;
