
const Client = require('./client-base');

class Services extends Client {
    async get({ labelSelector }) {
        return this._client.apis.v1.namespaces(this._namespace).services().get({ qs: { labelSelector } });
    }

    async create({ spec }) {
        return this._client.apis.v1.namespaces(this._namespace).services.post({ body: spec });
    }

    async update({ serviceName, spec }) {
        return this._client.apis.v1.namespaces(this._namespace).services(serviceName).patch({ body: spec });
    }

    async delete({ serviceName }) {
        return this._client.apis.v1.namespaces(this._namespace).services(serviceName).delete();
    }
}

module.exports = Services;
