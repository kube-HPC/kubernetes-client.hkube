
const Client = require('./client-base');

class Logs extends Client {
    async get({ podName, containerName, tailLines }) {
        return this._client.api.v1.namespaces(this._namespace).pods(podName).log.get({ qs: { container: containerName, tailLines } });
    }
}

module.exports = Logs;
