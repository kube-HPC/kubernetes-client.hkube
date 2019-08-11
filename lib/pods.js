const Client = require('./client-base');

class Pods extends Client {
	get({ podName, labelSelector, useNamespace = true } = {}) {
		const namespace = useNamespace ? this._namespace : undefined;
		return this._client.api.v1
			.namespaces(namespace)
			.pods(podName)
			.get({ qs: { labelSelector } });
	}
	delete({ podName, useNamespace = true }) {
		const namespace = useNamespace ? this._namespace : undefined;
		return this._client.api.v1
			.namespaces(namespace)
			.pods(podName)
			.delete();
	}
	all(useNamespace = false) {
		return this.get({ useNamespace });
	}
}

module.exports = Pods;
