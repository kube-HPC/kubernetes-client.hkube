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
const SideCars = require('./sidecars');
const PVC = require('./pvc');
const CRDs = require('./crds');

class Client {
    async init(options) {
        const k8sOptions = options || {};
        const namespace = k8sOptions.namespace || 'default';

        const { client, config } = await clientFactory(options);
        this._namespace = namespace;
        this._config = config;

        this.versions = new Versions(client, namespace);
        this.kubeVersion = await this.versions.getParsedVersion();

        this.configMaps = new ConfigMaps(client, namespace, this.kubeVersion);
        this.containers = new Containers(client, namespace, this.kubeVersion);
        this.deployments = new Deployments(client, namespace, this.kubeVersion);
        this.ingresses = new Ingresses(client, namespace, this.kubeVersion);
        this.jobs = new Jobs(client, namespace, this.kubeVersion);
        this.logs = new Logs(client, namespace, this.kubeVersion);
        this.nodes = new Nodes(client, namespace, this.kubeVersion);
        this.pods = new Pods(client, namespace, this.kubeVersion);
        this.services = new Services(client, namespace, this.kubeVersion);
        this.resourcequotas = new ResourceQuotas(client, namespace, this.kubeVersion);
        this.secrets = new Secrets(client, namespace, this.kubeVersion);
        this.sidecars = new SideCars(client, namespace, this.kubeVersion, this.configMaps);
        this.pvc = new PVC(client, namespace, this.kubeVersion);
        this.crds = new CRDs(client, namespace, this.kubeVersion);
    }
}

module.exports = Client;
