const jsyaml = require('js-yaml');
const Client = require('./client-base');

const cmPostfix = '-container-spec';
const containerKey = 'container.yaml';
const volumesKey = 'volumes.yaml';
const volumeMountsKey = 'volumeMounts.yaml';

class SideCars extends Client {
    constructor(client, namespace, version, configmaps) {
        super(client, namespace, version);
        this._configmaps = configmaps;
    }

    async get({ name }) {
        const configMapName = `${name}${cmPostfix}`;
        const configMapData = await this._prefix.namespaces(this._namespace).configmaps(configMapName).get();
        const container = this._parse(configMapData, containerKey);
        if (container.length === 0) {
            return null;
        }
        const volumes = this._parse(configMapData, volumesKey);
        const volumeMounts = this._parse(configMapData, volumeMountsKey);

        return { name, container, volumes, volumeMounts };
    }

    _parse(configMap, key) {
        return configMap?.body?.data?.[key] ? jsyaml.load(configMap.body.data[key]) : [];
    }
}

module.exports = SideCars;
