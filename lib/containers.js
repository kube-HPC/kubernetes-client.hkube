
const Client = require('./client-base');

class Containers extends Client {
    async getStatus({ podName, containerName, labelSelector, useNamespace = true } = {}) {
        const namespace = useNamespace ? this._namespace : undefined;
        const pod = await this._prefix.namespaces(namespace).pods(podName).get({ qs: { labelSelector } });
        const containers = pod.body.status.containerStatuses.filter(r => r.name === containerName);
        if (containers.length === 0) {
            throw new Error(`unable to find container ${containerName}`);
        }
        const [status, data] = Object.entries(containers[0].state)[0];
        return {
            status,
            ...data
        };
    }
}

module.exports = Containers;
