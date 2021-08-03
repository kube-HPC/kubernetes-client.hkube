const compareVersions = require('compare-versions');

const Client = require('./client-base');

class Ingresses extends Client {
    _getPrefix() {
        if (compareVersions.compare(this._version.version, '1.21', '<')) {
            return this._client.apis.extensions.v1beta1;
        }
        return this._client.apis['networking.k8s.io'].v1;
    }

    async get({ labelSelector }) {
        return this._prefix.namespaces(this._namespace).ingresses().get({ qs: { labelSelector } });
    }

    async create({ spec }) {
        return this._prefix.namespaces(this._namespace).ingresses.post({ body: spec });
    }

    async update({ ingressName, spec }) {
        return this._prefix.namespaces(this._namespace).ingresses(ingressName).patch({ body: spec });
    }

    async delete({ ingressName }) {
        return this._prefix.namespaces(this._namespace).ingresses(ingressName).delete();
    }
}

module.exports = Ingresses;
