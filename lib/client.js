
const kubernetesClient = require('kubernetes-client');
const ConfigMaps = require('./config-maps');
const Deployments = require('./deployments');
const Ingresses = require('./ingresses');
const Jobs = require('./jobs');
const Logs = require('./logs');
const Nodes = require('./nodes');
const Pods = require('./pods');
const Services = require('./services');
const Versions = require('./versions');
const ResourceQuotas = require('./resourceQuotas');

class Client {
    constructor(options) {
        const k8sOptions = options || {};
        const version = k8sOptions.version || '1.9';
        const namespace = k8sOptions.namespace || 'default';

        let config;
        if (!k8sOptions.isLocal) {
            config = kubernetesClient.config.fromKubeconfig(k8sOptions.kubeconfig);
        }
        else {
            config = kubernetesClient.config.getInCluster();
        }
        this._config = { timeout: k8sOptions.timeout, ...config };
        this._version = version;
        this._namespace = namespace;

        const client = new kubernetesClient.Client({ config: this._config, version });

        this.configMaps = new ConfigMaps(client, namespace);
        this.deployments = new Deployments(client, namespace);
        this.ingresses = new Ingresses(client, namespace);
        this.jobs = new Jobs(client, namespace);
        this.logs = new Logs(client, namespace);
        this.nodes = new Nodes(client, namespace);
        this.pods = new Pods(client, namespace);
        this.services = new Services(client, namespace);
        this.versions = new Versions(client, namespace);
        this.resourcequotas = new ResourceQuotas(client, namespace);
    }
}

module.exports = Client;
