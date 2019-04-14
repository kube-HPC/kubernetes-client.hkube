const { expect } = require('chai');
const sinon = require('sinon');
const { Client, utils } = require('../index');
const { findContainer, applyImage, applyResourceRequests, applyEnvToContainer, nodeSelectorToNodeAffinity, applyNodeAffinity, applyNodeSelector, applyVolumes, applyVolumeMounts } = utils;
const deploymentTemplate = require('./mocks/deploymentTemplate');
const jobTemplate = require('./mocks/jobTemplate');

const labelSelector = 'type=worker';
const deploymentName = 'worker';
const jobName = 'worker';
const podName = 'worker';
const containerName = 'worker';
let client;

describe('bootstrap', () => {
    before(async () => {
        client = new Client();
    });
    after(() => {

    });
    describe('Client', () => {
        describe('Client', () => {
            it('should init without error', async () => {
                const config = {
                    isLocal: false,
                    namespace: 'default'
                };
                const clientK8s = new Client(config);
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
            it('should init without error', async () => {
                const res = await client.configMaps.get({ name: 'hkube-versions' });

            });
            it('should init without error', async () => {
                const res = await client.configMaps.get({ name: 'hkube-versions' });
                const configMap = client.configMaps.extractConfigMap(res);
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
        });
        describe('Pods', () => {
            it('should get', async () => {
                const res = await client.pods.get({ podName, labelSelector });

            });
        });
        describe('Versions', () => {
            it('should get', async () => {
                const res = await client.versions.get();
                expect(client).to.have.property('configMaps');
            });
        });
    });
    describe('utils', () => {
        describe('findContainer', () => {
            it('should throw unable to find container', async () => {
                const container = 'no_such';
                expect(() => findContainer(jobTemplate, container)).to.throw(`unable to find container ${container}`);
            });
            it('should find container', async () => {
                const container = 'worker';
                const res = findContainer(jobTemplate, container);
                expect(res).to.have.property('name');
                expect(res).to.have.property('image');
            });
        });
        describe('applyImage', () => {
            it('should init without error', async () => {
                const image = null;
                const container = 'worker';
                const res = applyImage(jobTemplate, image, container);
                expect(res.spec.template.spec.containers[0].image).to.equal('hkube/worker:latest');
            });
            it('should init without error', async () => {
                const image = 'hkube/worker';
                const container = 'worker';
                const res = applyImage(jobTemplate, image, container);
                expect(res).to.nested.include({ 'spec.template.spec.containers[0].image': image });
            });
        });
        describe('applyResourceRequests', () => {
            it('should init without error', async () => {
                const container = 'worker';
                const resources = null;
                const res = applyResourceRequests(jobTemplate, resources, container);
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
                const res = applyResourceRequests(jobTemplate, resources, container);
                expect(res.spec.template.spec.containers[0].resources).to.eql(resources);
            });
        });
        describe('applyEnvToContainer', () => {
            it('should add env to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = applyEnvToContainer(jobTemplate, container, null);
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength);
            });
            it('should add env to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = applyEnvToContainer(jobTemplate, container, { env1: 'value1' });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].env).to.deep.include({ name: 'env1', value: 'value1' });
            });
            it('should replace env in spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = applyEnvToContainer(jobTemplate, container, { NODE_ENV: 'newEnv' });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength);
                expect(res.spec.template.spec.containers[0].env).to.deep.include({ name: 'NODE_ENV', value: 'newEnv' });
            });
            it('should remove env in spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = applyEnvToContainer(jobTemplate, container, { NODE_ENV: null });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength - 1);
                expect(res.spec.template.spec.containers[0].env).to.not.deep.include({ name: 'NODE_ENV', value: 'kube' });
            });
            it('combine', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
                const res = applyEnvToContainer(jobTemplate, container, { NODE_ENV: null, OTHER_ENV: 'new', newEnv: 3 });
                expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].env).to.not.deep.include({ name: 'NODE_ENV', value: 'kube' });
                expect(res.spec.template.spec.containers[0].env).to.deep.include({ name: 'OTHER_ENV', value: 'new' });
            });
        });
        describe('nodeSelectorToNodeAffinity', () => {
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
                const res = nodeSelectorToNodeAffinity(nodeSelector);
                expect(res).to.eql(nodeAffinity);
            });
        });
        describe('applyNodeAffinity', () => {
            it('should not create node affinity with null param', () => {
                const res = applyNodeAffinity(jobTemplate, null);
                expect(res.spec.template.spec.affinity).to.be.undefined;
            });
            it('should not create node affinity with empty array', () => {
                const res = applyNodeAffinity(jobTemplate, []);
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
                const res = applyNodeAffinity(jobTemplate, nodeAffinity);
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
                const res = applyNodeAffinity(jobTemplate, nodeAffinity);
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
                const res = nodeSelectorToNodeAffinity(nodeSelector);
                expect(res).to.eql(nodeAffinity);
            });
            it('should convert nodeSelector To k8s like NodeAffinity', () => {
                const nodeSelector = {
                    disktype: 'ssd-1',
                    gpu: 'gpu-1'
                };
                const res = applyNodeSelector(jobTemplate, nodeSelector);
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
                const res = applyNodeSelector(jobTemplate, nodeSelector);
                const selector = res.spec.template.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution;
                expect(selector).to.eql(nodeAffinity);
            });
        });
        describe('applyVolumes', () => {
            it('should add volume to spec', () => {
                const envLength = jobTemplate.spec.template.spec.volumes.length;
                const res = applyVolumes(jobTemplate, null);
                expect(res.spec.template.spec.volumes).to.have.lengthOf(envLength);
            });
            it('should add volume to spec', () => {
                const envLength = jobTemplate.spec.template.spec.volumes.length;
                const newVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc' } };
                const res = applyVolumes(jobTemplate, newVolume);
                expect(res.spec.template.spec.volumes).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.volumes).to.deep.include(newVolume);
            });
            it('should replace volume in spec', () => {
                const volume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc1' } };
                const newVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc2' } };
                const res = applyVolumes(jobTemplate, volume);
                const envLength = res.spec.template.spec.volumes.length;
                const resNew = applyVolumes(res, newVolume);
                expect(resNew.spec.template.spec.volumes).to.have.lengthOf(envLength);
                expect(resNew.spec.template.spec.volumes).to.deep.include(newVolume);
                expect(resNew.spec.template.spec.volumes).to.not.deep.include(volume);
            });
            it('combine', () => {
                const volume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc1' } };
                const updateVolume = { name: 'storage-volume', persistentVolumeClaim: { claimName: 'hkube-storage-pvc2' } };
                const newVolume = { name: 'test', persistentVolumeClaim: { claimName: 'hkube-storage-pvc3' } };
                const res = applyVolumes(jobTemplate, volume);
                const updateRes = applyVolumes(res, updateVolume);
                const resNew = applyVolumes(updateRes, newVolume);
                expect(resNew.spec.template.spec.volumes).to.deep.include(newVolume);
                expect(resNew.spec.template.spec.volumes).to.deep.include(updateVolume);
                expect(resNew.spec.template.spec.volumes).to.not.deep.include(volume);
            });
        });
        describe('applyVolumeMounts', () => {
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const res = applyVolumeMounts(jobTemplate, container, null);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength);
            });
            it('should add volumeMount to spec', () => {
                const container = 'worker';
                const envLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata' };
                const res = applyVolumeMounts(jobTemplate, container, newVolumeMounts);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength + 1);
                expect(res.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
            });
            it('should replace volumeMount in spec', () => {
                const container = 'worker';
                const volumeMounts = { name: 'storage-volume', mountPath: '/hkubedata1' };
                const newVolumeMounts = { name: 'storage-volume', mountPath: '/hkubedata2' };
                const res = applyVolumeMounts(jobTemplate, container, volumeMounts);
                const envLength = res.spec.template.spec.containers[0].volumeMounts.length;
                const resNew = applyVolumeMounts(res, container, newVolumeMounts);
                expect(resNew.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(envLength);
                expect(resNew.spec.template.spec.containers[0].volumeMounts).to.deep.include(newVolumeMounts);
                expect(resNew.spec.template.spec.containers[0].volumeMounts).to.not.deep.include(volumeMounts);
            });
        });
    });
});
