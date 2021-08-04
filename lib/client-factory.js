const kubernetesClient = require('kubernetes-client');
const compareVersions = require('compare-versions');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const Versions = require('./versions');

const createClient = async (options) => {
    const k8sOptions = options || {};
    const initialVersion = k8sOptions.version || '1.9';
    let config;
    if (!k8sOptions.isLocal) {
        config = kubernetesClient.config.fromKubeconfig(k8sOptions.kubeconfig);
    }
    else {
        config = kubernetesClient.config.getInCluster();
    }
    let client = new kubernetesClient.Client({ config: { timeout: k8sOptions.timeout, ...config }, version: initialVersion });
    const versions = new Versions(client);
    const kubeVersion = await versions.getParsedVersion();
    if (compareVersions.compare(kubeVersion.version, '1.21', '<')) {
        return { client, config };
    }
    // version is newer than 1.21. need to use latest swagger
    const spec = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'spec', './swagger-1.22.json.gz'))));
    client = new kubernetesClient.Client({ config: { timeout: k8sOptions.timeout, ...config }, spec });
    return { client, config };
};

module.exports = createClient;
