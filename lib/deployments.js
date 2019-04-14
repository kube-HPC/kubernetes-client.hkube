const Client = require('./client-base');

class Deployments extends Client {
    async get({ labelSelector }) {
        return this._client.apis.apps.v1.namespaces(this._namespace).deployments().get({ qs: { labelSelector } });
    }

    async create({ spec }) {
        return this._client.apis.apps.v1.namespaces(this._namespace).deployments.post({ body: spec });
    }

    async update({ deploymentName, spec }) {
        return this._client.apis.apps.v1.namespaces(this._namespace).deployments(deploymentName).patch({ body: spec });
    }

    async delete({ deploymentName }) {
        return this._client.apis.apps.v1.namespaces(this._namespace).deployment(deploymentName).delete();
    }
}

module.exports = Deployments;
