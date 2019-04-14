const Client = require('./client-base');

class ConfigMaps extends Client {
    async get({ name }) {
        return this._client.api.v1.namespaces(this._namespace).configmaps(name).get();
    }

    extractConfigMap(configMap) {
        const versions = JSON.parse(configMap.body.data['versions.json']);
        const registry = configMap.body.data['registry.json'] && JSON.parse(configMap.body.data['registry.json']);
        const clusterOptions = configMap.body.data['clusterOptions.json'] && JSON.parse(configMap.body.data['clusterOptions.json']);
        return { versions, registry, clusterOptions };
    }
}

module.exports = ConfigMaps;
