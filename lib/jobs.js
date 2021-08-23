const Client = require('./client-base');

class Jobs extends Client {
    _getPrefix() {
        return this._client.apis.batch.v1;
    }

    async get({ labelSelector }) {
        return this._prefix.namespaces(this._namespace).jobs().get({ qs: { labelSelector } });
    }

    async create({ spec }) {
        return this._prefix.namespaces(this._namespace).jobs.post({ body: spec });
    }

    async update({ jobName, spec }) {
        return this._prefix.namespaces(this._namespace).jobs(jobName).patch({ body: spec });
    }

    async delete({ jobName, body }) {
        const deleteOptions = {
            kind: 'DeleteOptions',
            apiVersion: 'batch/v1',
            propagationPolicy: 'Foreground'
        };
        const options = { ...body, ...deleteOptions };
        return this._prefix.namespaces(this._namespace).jobs(jobName).delete({ body: options });
    }
}

module.exports = Jobs;
