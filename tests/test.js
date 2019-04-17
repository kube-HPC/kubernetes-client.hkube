const { expect } = require('chai');
const deploymentTemplate = require('./stubs/deploymentTemplate');
const jobTemplate = require('./stubs/jobTemplate');
const slimJobTemplate = require('./stubs/slim-job-template');
const kubernetesServerMock = require('./mocks/kubernetes-server.mock');

const labelSelector = 'group=hkube';
const deploymentName = 'worker';
const jobName = 'worker';
const podName = 'worker';
const containerName = 'worker';
let client, Client, utils;

const configMapRes = {
    body: {
        data: {
            'versions.json': JSON.stringify({ name: 'hkube-versions', versions: [{ project: 'worker', tag: 'v2.1.0' }] }),
            'registry.json': JSON.stringify('cloud.docker.com'),
            'clusterOptions.json': JSON.stringify({ useNodeSelector: true }),
        }
    }
}

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
        const index = require('../index');
        Client = index.Client;
        utils = index.utils;
        client = new Client({ isLocal: false, kubeconfig });
        await kubernetesServerMock.start({ port: 9001 });
    });
    describe('Client', () => {
        describe('Client', () => {
            it('should create new Client with isLocal:false', async () => {
                const clientK8s = new Client({ isLocal: false, kubeconfig });
                expect(clientK8s).to.have.property('configMaps');
                expect(clientK8s).to.have.property('deployments');
                expect(clientK8s).to.have.property('jobs');
                expect(clientK8s).to.have.property('logs');
                expect(clientK8s).to.have.property('nodes');
                expect(clientK8s).to.have.property('pods');
                expect(clientK8s).to.have.property('versions');
            });
        });
        describe('ConfigMaps', () => {
            it('should get configMaps', async () => {
                const res = await client.configMaps.get({ name: 'hkube-versions' });
            });
            it('should extractConfigMap', async () => {
                const configMap = client.configMaps.extractConfigMap(configMapRes);
                expect(configMap).to.have.property('versions');
                expect(configMap).to.have.property('registry');
                expect(configMap).to.have.property('clusterOptions');
            });
        });
        describe('Deployments', () => {
            it('should get', async () => {
                const res = await client.deployments.get({ labelSelector });
            });
            it('should create', async () => {
                const res = await client.deployments.create({ spec: deploymentTemplate });
            });
            it('should update', async () => {
                const res = await client.deployments.update({ deploymentName, spec: deploymentTemplate });
            });
            it('should delete', async () => {
                const res = await client.deployments.delete({ deploymentName });
            });
        });
        describe('Ingresses', () => {
            it('should get', async () => {
                const res = await client.ingresses.get({ labelSelector });
            });
            it('should create', async () => {
                const res = await client.ingresses.create({ spec: deploymentTemplate });
            });
            it('should update', async () => {
                const res = await client.ingresses.update({ deploymentName, spec: deploymentTemplate });
            });
            it('should delete', async () => {
                const res = await client.ingresses.delete({ deploymentName });
            });
        });
        describe('Jobs', () => {
            it('should get', async () => {
                const res = await client.jobs.get({ labelSelector });
            });
            it('should create', async () => {
                const res = await client.jobs.create({ spec: jobTemplate });
            });
            it('should update', async () => {
                const res = await client.jobs.update({ jobName, spec: jobTemplate });
            });
            it('should delete', async () => {
                const res = await client.jobs.delete({ jobName });
            });
        });
        describe('Logs', () => {
            it('should get', async () => {
                const res = await client.logs.get({ podName, containerName });
            });
        });
        describe('Nodes', () => {
            it('should get', async () => {
                const res = await client.nodes.get({ labelSelector });
            });
            it('should get all', async () => {
                const res = await client.nodes.all();
            });
        });
        describe('Pods', () => {
            it('should get', async () => {
                const res = await client.pods.get({ podName, labelSelector });
            });
            it('should get all', async () => {
                const res = await client.pods.all();
            });
        });
        describe('Services', () => {
            it('should get', async () => {
                const res = await client.services.get({ labelSelector });
            });
            it('should create', async () => {
                const res = await client.services.create({ spec: deploymentTemplate });
            });
            it('should update', async () => {
                const res = await client.services.update({ deploymentName, spec: deploymentTemplate });
            });
            it('should delete', async () => {
                const res = await client.services.delete({ deploymentName });
            });
        });
        describe('Versions', () => {
            it('should get', async () => {
                const res = await client.versions.get();
            });
        });
    });
    describe('Utils', () => {
        describe('findContainer', () => {
            it('should throw unable to find container', async () => {
                const container = 'no_such';
                expect(() => utils.findContainer(jobTemplate, container)).to.throw(`unable to find container ${container}`);
            });
            it('should find container', async () => {
                const container = 'worker';
                const res = utils.findContainer(jobTemplate, container);
                expect(res).to.have.property('name');
                expect(res).to.have.property('image');
            });
        });
        describe('parseImageName', () => {
            it('should parseImageName with null', async () => {
                const image = '';
                const res = utils.parseImageName(image);
                expect(res).to.be.null;
            });
            it('should parseImageName with library', async () => {
                const image = 'worker';
                const res = utils.parseImageName(image);
                expect(res).to.have.property('registry');
                expect(res).to.have.property('namespace');
                expect(res).to.have.property('repository');
                expect(res).to.have.property('tag');
                expect(res).to.have.property('name');
                expect(res).to.have.property('fullname');
                expect(res.fullname).to.equal('library/worker:latest');
            });
            it('should parseImageName with tag', async () => {
                const image = 'hkube/worker:v2.1.0';
                const res = utils.parseImageName(image);
                expect(res).to.have.property('registry');
                expect(res).to.have.property('namespace');
                expect(res).to.have.property('repository');
                expect(res).to.have.property('tag');
                expect(res).to.have.property('name');
                expect(res).to.have.property('fullname');
                expect(res.tag).to.equal('v2.1.0');
            });
            it('should parseImageName with tag', async () => {
                const image = 'cloud.docker.com/hkube/worker:v2.1.0';
                const res = utils.parseImageName(image);
                expect(res).to.have.property('registry');
                expect(res).to.have.property('namespace');
                expect(res).to.have.property('repository');
                expect(res).to.have.property('tag');
                expect(res).to.have.property('name');
                expect(res).to.have.property('fullname');
                expect(res.registry).to.equal('cloud.docker.com');
            });
        });
        describe('createImage', () => {
            it('should createImage with null', async () => {
                const image = null;
                const res = utils.createImage(image);
                expect(res).to.be.null;
            });
            it('should createImage with empty string', async () => {
                const image = '';
                const res = utils.createImage(image);
                expect(res).to.be.null;
            });
            it('should createImage with tag', async () => {
                const image = 'hkube/worker';
                const res = utils.createImage(image);
                expect(res).to.equal('hkube/worker');
            });
            it('should createImage with tag', async () => {
                const image = 'hkube/worker';
                const configMap = client.configMaps.extractConfigMap(configMapRes);
                const res = utils.createImage(image, configMap.versions);
                expect(res).to.equal('hkube/worker:v2.1.0');
            });
            it('should createImage with tag', async () => {
                const image = 'hkube/worker';
                const configMap = client.configMaps.extractConfigMap(configMapRes);
                const res = utils.createImage(image, configMap.versions, { registry: configMap.registry });
                expect(res).to.equal('cloud.docker.com/hkube/worker:v2.1.0');
            });
        });
        describe('createImageFromContainer', () => {
            it('should createImage with no tag', async () => {
                const container = 'worker';
                const res = utils.createImageFromContainer(slimJobTemplate, container);
                expect(res).to.equal('hkube/worker');
            });
            it('should createImage with tag', async () => {
                const container = 'worker';
                const res = utils.createImageFromContainer(jobTemplate, container);
                expect(res).to.equal('hkube/worker:latest');
            });
            it('should createImage with tag', async () => {
                const container = 'worker';
                const configMap = client.configMaps.extractConfigMap(configMapRes);
                const res = utils.createImageFromContainer(slimJobTemplate, container, configMap.versions);
                expect(res).to.equal('hkube/worker:v2.1.0');
            });
            it('should createImage with tag', async () => {
                const container = 'worker';
                const configMap = client.configMaps.extractConfigMap(configMapRes);
                const res = utils.createImageFromContainer(slimJobTemplate, container, configMap.versions, { registry: configMap.registry });
                expect(res).to.equal('cloud.docker.com/hkube/worker:v2.1.0');
            });
        });
        describe('applyImage', () => {
            it('should applyImage', async () => {
                const image = null;
                const container = 'worker';
                const res = utils.applyImage(jobTemplate, image, container);
                expect(res.spec.template.spec.containers[0].image).to.equal('hkube/worker:latest');
            });
            it('should init without error', async () => {
                const image = 'hkube/worker';
                const container = 'worker';
                const res = utils.applyImage(jobTemplate, image, container);
                expect(res).to.nested.include({ 'spec.template.spec.containers[0].image': image });
            });
        });
        describe('applyResourceRequests', () => {
            it('should init without error', async () => {
                const container = 'worker';
                const resources = null;
                const res = utils.applyResourceRequests(jobTemplate, resources, container);
                expect(res.spec.template.spec.containers[0]).to.not.have.property('resources');
            });
            it('should init without error', async () => {
                const container = 'worker';
                const resources = {
                    requests: {
                        cpu: '200m',
                        memory: '100M'
                    },
                    limits: {
                        cpu: '500m',
                        memory: '200M'
                    }
                };
                const res = utils.applyResourceRequests(jobTemplate, resources, container);
                expect(res.spec.template.spec.containers[0].resources).to.eql(resources);
            });
        });
        describe('applyEnvToContainer', () => {
            it('should add env to spec', () => {
                const container = 'worker';
                const res = utils.applyEnvToContainer(slimJobTemplate, container, { env1: 'value1' });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(1);
            });
            it('should add env to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = utils.applyEnvToContainer(jobTemplate, container, null);
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength);
            });
            it('should add env to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = utils.applyEnvToContainer(jobTemplate, container, { env1: 'value1' });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].env).to.deep.include({ name: 'env1', value: 'value1' });
            });
            it('should replace env in spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = utils.applyEnvToContainer(jobTemplate, container, { NODE_ENV: 'newEnv' });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength);
                expect(res.spec.template.spec.containers[0].env).to.deep.include({ name: 'NODE_ENV', value: 'newEnv' });
            });
            it('should remove env in spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = utils.applyEnvToContainer(jobTemplate, container, { NODE_ENV: null });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength - 1);
                expect(res.spec.template.spec.containers[0].env).to.not.deep.include({ name: 'NODE_ENV', value: 'kube' });
            });
            it('combine', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = utils.applyEnvToContainer(jobTemplate, container, { NODE_ENV: null, OTHER_ENV: 'new', newEnv: 3 });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].env).to.not.deep.include({ name: 'NODE_ENV', value: 'kube' });
                expect(res.spec.template.spec.containers[0].env).to.deep.include({ name: 'OTHER_ENV', value: 'new' });
            });
        });
        describe('nodeSelectorToNodeAffinity', () => {
            it('should init without error', async () => {
                const res = utils.nodeSelectorToNodeAffinity();
                expect(res).to.be.null;
            });
            it('should init without error', async () => {
                const nodeSelector = {
                    disktype: 'ssd-1',
                    gpu: 'gpu-1'
                };
                const nodeAffinity = {
                    nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: 'disktype',
                            operator: 'In',
                            values: ['ssd-1']
                        },
                        {
                            key: 'gpu',
                            operator: 'In',
                            values: ['gpu-1']
                        }]
                    }]
                };
                const res = utils.nodeSelectorToNodeAffinity(nodeSelector);
                expect(res).to.eql(nodeAffinity);
            });
        });
        describe('applyNodeAffinity', () => {
            it('should not create node affinity with null param', () => {
                const res = utils.applyNodeAffinity(jobTemplate, null);
                expect(res.spec.template.spec.affinity).to.be.undefined;
            });
            it('should not create node affinity with empty array', () => {
                const res = utils.applyNodeAffinity(jobTemplate, []);
                expect(res.spec.template.spec.affinity).to.be.undefined;
            });
            it('should create node affinity with multiple matchExpressions', () => {
                const nodeAffinity = {
                    nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: 'disktype',
                            operator: 'In',
                            values: ['ssd-1', 'ssd-2']
                        },
                        {
                            key: 'gpu',
                            operator: 'In',
                            values: ['gpu-1', 'gpu-2']
                        }]
                    }]
                };
                const res = utils.applyNodeAffinity(jobTemplate, nodeAffinity);
                const terms = res.spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms;
                expect(terms).to.have.lengthOf(1);
                expect(terms[0].matchExpressions).to.have.lengthOf(2);
            });
            it('should create node affinity with multiple terms', () => {
                const nodeAffinity = {
                    nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: 'disktype',
                            operator: 'In',
                            values: ['ssd-1', 'ssd-2']
                        }]
                    },
                    {
                        matchExpressions: [{
                            key: 'gpu',
                            operator: 'In',
                            values: ['gpu-1', 'gpu-2']
                        }]
                    }]
                };
                const res = utils.applyNodeAffinity(jobTemplate, nodeAffinity);
                const terms = res.spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms;
                expect(terms).to.have.lengthOf(2);
                expect(terms[0].matchExpressions).to.have.lengthOf(1);
                expect(terms[1].matchExpressions).to.have.lengthOf(1);
            });
            it('should convert nodeSelector To NodeAffinity', () => {
                const nodeSelector = {
                    disktype: 'ssd-1',
                    gpu: 'gpu-1'
                };
                const nodeAffinity = {
                    nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: 'disktype',
                            operator: 'In',
                            values: ['ssd-1']
                        },
                        {
                            key: 'gpu',
                            operator: 'In',
                            values: ['gpu-1']
                        }]
                    }]
                };
                const res = utils.nodeSelectorToNodeAffinity(nodeSelector);
                expect(res).to.eql(nodeAffinity);
            });
            it('should convert nodeSelector To k8s like NodeAffinity', () => {
                const nodeSelector = {
                    disktype: 'ssd-1',
                    gpu: 'gpu-1'
                };
                const res = utils.applyNodeSelector(jobTemplate, nodeSelector);
                const terms = res.spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms;
                expect(terms).to.have.lengthOf(1);
                expect(terms[0].matchExpressions).to.have.lengthOf(Object.keys(nodeSelector).length);
            });
        });
        describe('applyNodeSelector', () => {
            it('should not remove node selector in spec', () => {
                const nodeSelector = {
                    disktype: 'ssd-1',
                    gpu: 'gpu-1'
                };
                const nodeAffinity = {
                    nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: 'disktype',
                            operator: 'In',
                            values: ['ssd-1']
                        },
                        {
                            key: 'gpu',
                            operator: 'In',
                            values: ['gpu-1']
                        }]
                    }]
                };
                const res = utils.applyNodeSelector(jobTemplate, nodeSelector);
                const selector = res.spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution;
                expect(selector).to.eql(nodeAffinity);
            });
        });
        describe('applyVolumes', () => {
            it('should add volume to spec', () => {
                const newVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc' } };
                const res = utils.applyVolumes(slimJobTemplate, newVolume);
                expect(res.spec.template.spec.volumes).to.have.lengthOf(1);
            });
            it('should add volume to spec', () => {
                const envLength = jobTemplate.spec.template.spec.volumes.length;
                const res = utils.applyVolumes(jobTemplate, null);
                expect(res.spec.template.spec.volumes).to.have.lengthOf(envLength);
            });
            it('should add volume to spec', () => {
                const envLength = jobTemplate.spec.template.spec.volumes.length;
                const newVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc' } };
                const res = utils.applyVolumes(jobTemplate, newVolume);
                expect(res.spec.template.spec.volumes).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.volumes).to.deep.include(newVolume);
            });
            it('should replace volume in spec', () => {
                const volume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc1' } };
                const newVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc2' } };
                const res = utils.applyVolumes(jobTemplate, volume);
                const envLength = res.spec.template.spec.volumes.length;
                const resNew = utils.applyVolumes(res, newVolume);
                expect(resNew.spec.template.spec.volumes).to.have.lengthOf(envLength);
                expect(resNew.spec.template.spec.volumes).to.deep.include(newVolume);
                expect(resNew.spec.template.spec.volumes).to.not.deep.include(volume);
            });
            it('combine', () => {
                const volume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc1' } };
                const updateVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc2' } };
                const newVolume = { name: 'test', persistentVolumeClaim: { claimName: 'hkube-storage-pvc3' } };
                const res = utils.applyVolumes(jobTemplate, volume);
                const updateRes = utils.applyVolumes(res, updateVolume);
                const resNew = utils.applyVolumes(updateRes, newVolume);
                expect(resNew.spec.template.spec.volumes).to.deep.include(newVolume);
                expect(resNew.spec.template.spec.volumes).to.deep.include(updateVolume);
                expect(resNew.spec.template.spec.volumes).to.not.deep.include(volume);
            });
        });
        describe('applyVolumeMounts', () => {
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata' };
                const res = utils.applyVolumeMounts(slimJobTemplate, container, newVolumeMounts);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(1);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
            });
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const res = utils.applyVolumeMounts(jobTemplate, container, null);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength);
            });
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata' };
                const res = utils.applyVolumeMounts(jobTemplate, container, newVolumeMounts);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
            });
            it('should replace volumeMount in spec', () => {
                const container = 'worker';
                const volumeMounts = { name: 'storage-volume', mountPath: '/hkubedata1' };
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata2' };
                const res = utils.applyVolumeMounts(jobTemplate, container, volumeMounts);
                const envLength = res.spec.template.spec.containers[0].volumeMounts.length;
                const resNew = utils.applyVolumeMounts(res, container, newVolumeMounts);
                expect(resNew.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength);
                expect(resNew.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
                expect(resNew.spec.template.spec.containers[0].volumeMounts).to.not.deep.include(volumeMounts);
            });
        });
        describe('applyStorage', () => {
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const storage = 'fs';
                const configMapName = 'my-configMap';
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata' };
                const res = utils.applyStorage(slimJobTemplate, storage, container, configMapName);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(1);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
            });
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const storage = 'fs';
                const configMapName = 'my-configMap';
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata' };
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const res = utils.applyStorage(jobTemplate, storage, container, configMapName);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
            });
            it('should not add volumeMount to spec', () => {
                const container = 'worker';
                const storage = 's3';
                const configMapName = 'my-configMap';
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const res = utils.applyStorage(jobTemplate, storage, container, configMapName);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength);
            });
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const storage = null;
                const configMapName = 'my-configMap';
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const res = utils.applyStorage(jobTemplate, storage, container, configMapName);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength);
            });
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const storage = 'fs';
                const configMapName = null;
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const res = utils.applyStorage(jobTemplate, storage, container, configMapName);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength + 1);
            });
        });
    });
});
