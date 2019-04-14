
const Client = require('./client-base');

class Pods extends Client {
    async get({ podName, labelSelector }) {
        return this._client.api.v1.namespaces(this._namespace).pods(podName).get({ qs: { labelSelector } });
    }
}

module.exports = Pods;
