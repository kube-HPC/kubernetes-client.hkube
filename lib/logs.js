const Client = require('./client-base');

class Logs extends Client {
    async get({ podName, containerName, tailLines, timestamps = false }) {
        return this._prefix.namespaces(this._namespace).pods(podName).log.get({ qs: { container: containerName, tailLines, timestamps } });
    }
}

module.exports = Logs;
