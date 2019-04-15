
const Client = require('./client-base');

class Ingresses extends Client {
    async get({ labelSelector }) {
        return this._client.apis.extensions.v1beta1.namespaces(this._namespace).ingresses().get({ qs: { labelSelector } });
    }

    async create({ spec }) {
        return this._client.apis.extensions.v1beta1.namespaces(this._namespace).ingresses.post({ body: spec });
    }

    async update({ ingressName, spec }) {
        return this._client.apis.extensions.v1beta1.namespaces(this._namespace).ingresses(ingressName).patch({ body: spec });
    }

    async delete({ ingressName }) {
        return this._client.apis.extensions.v1beta1.namespaces(this._namespace).ingresses(ingressName).delete();
    }
}

module.exports = Ingresses;
