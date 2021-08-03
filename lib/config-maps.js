const Client = require('./client-base');

class ConfigMaps extends Client {
    async get({ name }) {
        return this._prefix.namespaces(this._namespace).configmaps(name).get();
    }

    extractConfigMap(configMap) {
        const versions = this._parse(configMap, 'versions.json');
        const registry = this._parse(configMap, 'registry.json');
        const clusterOptions = this._parse(configMap, 'clusterOptions.json');
        return { versions, registry, clusterOptions };
    }

    _parse(configMap, key) {
        return configMap.body.data[key] && JSON.parse(configMap.body.data[key]);
    }
}

module.exports = ConfigMaps;
