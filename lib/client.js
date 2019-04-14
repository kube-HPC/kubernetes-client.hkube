
const kubernetesClient = require('kubernetes-client');
const ConfigMaps = require('./config-maps');
const Deployments = require('./deployments');
const Jobs = require('./jobs');
const Logs = require('./logs');
const Nodes = require('./nodes');
const Pods = require('./pods');
const Versions = require('./versions');

class Client {
    constructor(options) {
        const k8sOptions = options || {};
        const version = k8sOptions.version || '1.9';
        const namespace = k8sOptions.namespace || 'default';

        let config;
        if (!k8sOptions.isLocal) {
            config = kubernetesClient.config.fromKubeconfig();
        }
        else {
            config = kubernetesClient.config.getInCluster();
        }
        const client = new kubernetesClient.Client({ config, version });

        this.configMaps = new ConfigMaps(client, namespace);
        this.deployments = new Deployments(client, namespace);
        this.jobs = new Jobs(client, namespace);
        this.logs = new Logs(client, namespace);
        this.nodes = new Nodes(client, namespace);
        this.pods = new Pods(client, namespace);
        this.versions = new Versions(client, namespace);
    }
}

module.exports = Client;
