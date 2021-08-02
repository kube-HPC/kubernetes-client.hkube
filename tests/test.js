const { expect } = require('chai');
const deploymentTemplate = require('./stubs/deploymentTemplate');
const jobTemplate = require('./stubs/jobTemplate');
const kubernetesServerMock = require('./mocks/kubernetes-server.mock');

const labelSelector = 'group=hkube';
const deploymentName = 'worker';
const jobName = 'worker';
const podName = 'worker';
const containerName = 'worker';
const secretName = 'worker';
const configMapName = 'hkube-versions';

let client, Client, utils;
const response = { statusCode: 200, body: { status: 'ok' } };

const kubeconfig = {
    apiVersion: 'v1',
    kind: 'Config',
    'current-context': 'dev',
    clusters: [{
        name: 'dev',
        cluster: {
            server: "http://127.0.0.1:9001/api/kube"
        }
    }],
    contexts: [{
        name: 'dev',
        context: {
            cluster: 'dev',
            user: 'dev-admin'
        }
    }],
    users: [{
        name: 'default-admin',
        user: {}
    }]
}

describe('KubernetesClient', () => {
    before(async () => {
        Client = global.testParams.Client;
        utils = global.testParams.utils;
        client = global.testParams.client;
    });
    describe('Client', () => {
        describe('Client', () => {
            it('should create new Client with isLocal:false', async () => {
                const clientK8s = new Client({ isLocal: false, kubeconfig });
                expect(clientK8s).to.have.property('configMaps');
                expect(clientK8s).to.have.property('containers');
                expect(clientK8s).to.have.property('deployments');
                expect(clientK8s).to.have.property('ingresses');
                expect(clientK8s).to.have.property('jobs');
                expect(clientK8s).to.have.property('logs');
                expect(clientK8s).to.have.property('nodes');
                expect(clientK8s).to.have.property('pods');
                expect(clientK8s).to.have.property('services');
                expect(clientK8s).to.have.property('versions');
                expect(clientK8s).to.have.property('resourcequotas');
                expect(clientK8s).to.have.property('secrets');
            });
        });
        describe('ConfigMaps', () => {
            it('should get configMaps', async () => {
                const configMapRes = await client.configMaps.get({ name: configMapName });
                expect(configMapRes).to.have.property('body');
                expect(configMapRes).to.have.property('statusCode');
            });
            it('should extractConfigMap', async () => {
                const configMapRes = await client.configMaps.get({ name: configMapName });
                const configMap = client.configMaps.extractConfigMap(configMapRes);
                expect(configMap).to.have.property('versions');
                expect(configMap).to.have.property('registry');
                expect(configMap).to.have.property('clusterOptions');
            });
        });
        describe('Containers', () => {
            it('should get status', async () => {
                const containerStatus = await client.containers.getStatus({ podName, containerName });
                expect(containerStatus).to.have.property('status');
            });
        });
        describe('Deployments', () => {
            it('should get', async () => {
                const res = await client.deployments.get({ labelSelector });
                expect(res).to.eql(response);
            });
            it('should create', async () => {
                const res = await client.deployments.create({ spec: deploymentTemplate });
                expect(res).to.eql(response);
            });
            it('should update', async () => {
                const res = await client.deployments.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.eql(response);
            });
            it('should delete', async () => {
                const res = await client.deployments.delete({ deploymentName });
                expect(res).to.eql(response);
            });
        });
        describe('Ingresses', () => {
            it('should get', async () => {
                const res = await client.ingresses.get({ labelSelector });
                expect(res).to.eql(response);
            });
            it('should create', async () => {
                const res = await client.ingresses.create({ spec: deploymentTemplate });
                expect(res).to.eql(response);
            });
            it('should update', async () => {
                const res = await client.ingresses.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.eql(response);
            });
            it('should delete', async () => {
                const res = await client.ingresses.delete({ deploymentName });
                expect(res).to.eql(response);
            });
        });
        describe('Jobs', () => {
            it('should get', async () => {
                const res = await client.jobs.get({ labelSelector });
                expect(res).to.eql(response);
            });
            it('should create', async () => {
                const res = await client.jobs.create({ spec: jobTemplate });
                expect(res).to.eql(response);
            });
            it('should update', async () => {
                const res = await client.jobs.update({ jobName, spec: jobTemplate });
                expect(res).to.eql(response);
            });
            it('should delete', async () => {
                const res = await client.jobs.delete({ jobName });
                expect(res).to.eql(response);
            });
        });
        describe('Logs', () => {
            it('should get', async () => {
                const res = await client.logs.get({ podName, containerName });
                expect(res).to.eql(response);
            });
        });
        describe('Nodes', () => {
            it('should get', async () => {
                const res = await client.nodes.get({ labelSelector });
                expect(res).to.eql(response);
            });
            it('should get all', async () => {
                const res = await client.nodes.all();
                expect(res).to.eql(response);
            });
        });
        describe('Pods', () => {
            before(() => {
                kubernetesServerMock.addPath=true;
            });
            after(() => {
                kubernetesServerMock.addPath=false;
            });
            it('should get', async () => {
                const res = await client.pods.get({ podName, labelSelector });
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/pods/worker')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');                
            });
            it('should get all', async () => {
                const res = await client.pods.get({ useNamespace: false });
                expect(res.body.path).to.eql('/api/kube/api/v1/pods')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all in namespace', async () => {
                const res = await client.pods.get();
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/pods/')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all backward compatibility', async () => {
                const res = await client.pods.all();
                expect(res.body.path).to.eql('/api/kube/api/v1/pods')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all in namespace backward compatibility', async () => {
                const res = await client.pods.all(true);
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/pods/')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should delete', async () => {
                const res = await client.pods.delete({ podName });
                expect(res.statusCode).to.eql(200);
            });
        });
        describe('ResourceQuotas', () => {
            before(() => {
                kubernetesServerMock.addPath=true;
            });
            after(() => {
                kubernetesServerMock.addPath=false;
            });
            it('should get', async () => {
                const res = await client.resourcequotas.get({ name: 'foo', labelSelector });
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/resourcequotas/foo')
            });
            it('should get all', async () => {
                const res = await client.resourcequotas.get({ useNamespace: false });
                expect(res.body.path).to.eql('/api/kube/api/v1/resourcequotas')
            });
            it('should get all in namespace', async () => {
                const res = await client.resourcequotas.get({});
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/resourcequotas/')
            });
            it('should get all in namespace no args', async () => {
                const res = await client.resourcequotas.get();
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/resourcequotas/')
            });
        });
        describe('Services', () => {
            it('should get', async () => {
                const res = await client.services.get({ labelSelector });
                expect(res).to.eql(response);
            });
            it('should create', async () => {
                const res = await client.services.create({ spec: deploymentTemplate });
                expect(res).to.eql(response);
            });
            it('should update', async () => {
                const res = await client.services.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.eql(response);
            });
            it('should delete', async () => {
                const res = await client.services.delete({ deploymentName });
                expect(res).to.eql(response);
            });
        });
        describe('Secrets', () => {
            it('should get', async () => {
                const res = await client.secrets.get({ secretName });
                expect(res).to.eql(response);
            });
        });
        describe('Versions', () => {
            it('should get', async () => {
                const res = await client.versions.get();
                expect(res.body.gitVersion).to.eql('v1.19.7');
            });
            it('should get parsed version', async () => {
                const res = await client.versions.getParsedVersion();
                expect(res.gitVersion).to.eql('v1.19.7');
                expect(res.version).to.eql('1.19');
                expect(res.minor).to.eql(19);
                expect(res.major).to.eql(1);
                const resCached = await client.versions.getParsedVersion();
                expect(res).to.eql(resCached);
            });
        });
    });
});
