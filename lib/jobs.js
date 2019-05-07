
const Client = require('./client-base');

class Jobs extends Client {
    async get({ labelSelector }) {
        return this._client.apis.batch.v1.namespaces(this._namespace).jobs().get({ qs: { labelSelector } });
    }

    async create({ spec }) {
        return this._client.apis.batch.v1.namespaces(this._namespace).jobs.post({ body: spec });
    }

    async update({ jobName, spec }) {
        return this._client.apis.batch.v1.namespaces(this._namespace).jobs(jobName).patch({ body: spec });
    }

    async delete({ jobName, body }) {
        return this._client.apis.batch.v1.namespaces(this._namespace).jobs(jobName).delete({ body });
    }
}

module.exports = Jobs;
