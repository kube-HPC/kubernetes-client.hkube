
const clientFactory = require('./client-factory');
const ConfigMaps = require('./config-maps');
const Containers = require('./containers');
const Deployments = require('./deployments');
const Ingresses = require('./ingresses');
const Jobs = require('./jobs');
const Logs = require('./logs');
const Nodes = require('./nodes');
const Pods = require('./pods');
const Services = require('./services');
const Versions = require('./versions');
const ResourceQuotas = require('./resourceQuotas');
const Secrets = require('./secrets');

class Client {
    async init(options) {
        const k8sOptions = options || {};
        const namespace = k8sOptions.namespace || 'default';

        const { client, config } = await clientFactory(options);
        this._namespace = namespace;
        this._config = config;

        // const client = new kubernetesClient.Client({ config: this._config, version });

        this.configMaps = new ConfigMaps(client, namespace);
        this.containers = new Containers(client, namespace);
        this.deployments = new Deployments(client, namespace);
        this.ingresses = new Ingresses(client, namespace);
        this.jobs = new Jobs(client, namespace);
        this.logs = new Logs(client, namespace);
        this.nodes = new Nodes(client, namespace);
        this.pods = new Pods(client, namespace);
        this.services = new Services(client, namespace);
        this.versions = new Versions(client, namespace);
        this.resourcequotas = new ResourceQuotas(client, namespace);
        this.secrets = new Secrets(client, namespace);
    }
}

module.exports = Client;
