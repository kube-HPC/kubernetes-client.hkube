const { expect } = require('chai');
const clonedeep = require('lodash.clonedeep');
const jobTemplate = require('./stubs/jobTemplate');
const secretMock = require('./stubs/secret.json');
const slimJobTemplate = require('./stubs/slim-job-template');
const utils = require('../lib/utils')


const labelSelector = 'group=hkube';
const deploymentName = 'worker';
const jobName = 'worker';
const podName = 'worker';
const containerName = 'worker';
const secretName = 'worker';
const configMapName = 'hkube-versions';


describe('Utils', () => {
    describe('ingress', () => {
        it('should return correct ingress kind extensions/v1beta1', () => {
            const ret = utils.getIngressApiVersion({ version: '1.13' });
            expect(ret).to.eql('extensions/v1beta1')
        });
        it('should return correct ingress kind networking.k8s.io/v1beta1', () => {
            const ret = utils.getIngressApiVersion({ version: '1.16' });
            expect(ret).to.eql('extensions/v1beta1')
        });
        it('should return correct ingress kind networking.k8s.io/v1', () => {
            const ret = utils.getIngressApiVersion({ version: '1.19' });
            expect(ret).to.eql('extensions/v1beta1')
        });
        it('should return correct ingress kind networking.k8s.io/v1', () => {
            const ret = utils.getIngressApiVersion({ version: '1.21' });
            expect(ret).to.eql('networking.k8s.io/v1')
        }); 
        it('should return correct ingress kind networking.k8s.io/v1', () => {
            const ret = utils.getIngressApiVersion({ version: '1.22' });
            expect(ret).to.eql('networking.k8s.io/v1')
        });
        it('should return correct backend networking.k8s.io/v1 number', () => {
            const serviceName = 'service1';
            const servicePort = 8080;
            const ret = utils.getIngressBackend(serviceName, servicePort, { version: '1.22' });
            expect(ret).to.eql({
                backend: {
                    service: {
                        name: serviceName,
                        port: {
                            number: servicePort
                        }
                    }
                },
                pathType: 'ImplementationSpecific'
            })
        });
        it('should return correct backend networking.k8s.io/v1 number', () => {
            const serviceName = 'service1';
            const servicePort = 8080;
            const ret = utils.getIngressBackend(serviceName, servicePort, { version: '1.21' });
            expect(ret).to.eql({
                backend: {
                    service: {
                        name: serviceName,
                        port: {
                            number: servicePort
                        }
                    }
                },
                pathType: 'ImplementationSpecific'
            })
        });
        it('should return correct backend networking.k8s.io/v1 string', () => {
            const serviceName = 'service1';
            const servicePort = 'http';
            const ret = utils.getIngressBackend(serviceName, servicePort, { version: '1.22' });
            expect(ret).to.eql({
                backend: {
                    service: {
                        name: serviceName,
                        port: {
                            name: servicePort
                        }
                    }
                },
                pathType: 'ImplementationSpecific'
            })
        });
        it('should return correct backend extensions/v1beta1', () => {
            const serviceName = 'service1';
            const servicePort = 8080;
            const ret = utils.getIngressBackend(serviceName, servicePort, { version: '1.16' });
            expect(ret.backend).to.eql({ serviceName, servicePort })
            expect(ret.pathType).to.not.exist;
        });
        it('should return correct backend extensions/v1beta1', () => {
            const serviceName = 'service1';
            const servicePort = 8080;
            const ret = utils.getIngressBackend(serviceName, servicePort, { version: '1.13' });
            expect(ret.backend).to.eql({ serviceName, servicePort })
            expect(ret.pathType).to.not.exist;
        });
    });
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
            expect(res.namespace).to.not.exist;
            expect(res.repository).to.equal('worker');
            expect(res.tag).to.not.exist;
            expect(res.name).to.equal('worker');
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
            expect(res.namespace).to.equal('hkube');
            expect(res.repository).to.equal('worker');
            expect(res.tag).to.equal('v2.1.0');
            expect(res.name).to.equal('hkube/worker:v2.1.0');
            expect(res.fullname).to.equal('hkube/worker:v2.1.0');
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
            expect(res.namespace).to.equal('hkube');
            expect(res.repository).to.equal('worker');
            expect(res.tag).to.equal('v2.1.0');
            expect(res.name).to.equal('cloud.docker.com/hkube/worker:v2.1.0');
            expect(res.fullname).to.equal('cloud.docker.com/hkube/worker:v2.1.0');
        });
        it('should parseImageName with long reg name', async () => {
            const image = 'hostname.com/docker-virtual/foo/foo/algorithm-queue:v1.1.44';
            const res = utils.parseImageName(image);
            expect(res).to.exist;
            expect(res).to.have.property('registry');
            expect(res).to.have.property('namespace');
            expect(res).to.have.property('repository');
            expect(res).to.have.property('tag');
            expect(res).to.have.property('name');
            expect(res).to.have.property('fullname');

            expect(res.registry).to.equal('hostname.com');
            expect(res.namespace).to.equal('docker-virtual/foo/foo');
            expect(res.repository).to.equal('algorithm-queue');
            expect(res.tag).to.equal('v1.1.44');
            expect(res.name).to.equal('hostname.com/docker-virtual/foo/foo/algorithm-queue:v1.1.44');
            expect(res.fullname).to.equal('hostname.com/docker-virtual/foo/foo/algorithm-queue:v1.1.44');
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
        it('should createImage with n tag', async () => {
            const image = 'hkube/worker';
            const res = utils.createImage(image);
            expect(res).to.equal('hkube/worker');
        });
        it('should createImage with tag', async () => {
            const image = 'hkube/worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
            const configMap = client.configMaps.extractConfigMap(configMapRes);
            const res = utils.createImage(image, configMap.versions);
            expect(res).to.equal('hkube/worker:v2.1.0');
        });
        it('should createImage with tag and registry', async () => {
            const image = 'hkube/worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
            const configMap = client.configMaps.extractConfigMap(configMapRes);
            const res = utils.createImage(image, configMap.versions, { registry: configMap.registry });
            expect(res).to.equal('cloud.docker.com/hkube/worker:v2.1.0');
        });
        it('should createImage with registry', async () => {
            const image = 'docker.hub.com/hkube/worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
            const configMap = client.configMaps.extractConfigMap(configMapRes);
            const res = utils.createImage(image, configMap.versions, { registry: configMap.registry });
            expect(res).to.equal(`${image}:v2.1.0`);
        });
        it('should createImage with registry and no config map', async () => {
            const image = 'docker.hub.com/hkube/worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
            const configMap = client.configMaps.extractConfigMap(configMapRes);
            const res = utils.createImage(image, configMap.versions, null);
            expect(res).to.equal(`${image}:v2.1.0`);
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
        it('should createImage with tag 2', async () => {
            const container = 'worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
            const configMap = client.configMaps.extractConfigMap(configMapRes);
            const res = utils.createImageFromContainer(slimJobTemplate, container, configMap.versions);
            expect(res).to.equal('hkube/worker:v2.1.0');
        });
        it('should createImage with image from config map', async () => {
            const container = 'worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
            const configMap = client.configMaps.extractConfigMap(configMapRes);
            configMap.versions.versions.find(v => v.project === container).image = 'foo/worker2'
            const res = utils.createImageFromContainer(slimJobTemplate, container, configMap.versions, { registry: configMap.registry });
            expect(res).to.equal('cloud.docker.com/foo/worker2:v2.1.0');
        });
        it('should createImage with tag 3', async () => {
            const container = 'worker';
            const configMapRes = await client.configMaps.get({ name: configMapName });
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

    describe('applyImagePullSecret', () => {
        it('should return original spec if no secret', () => {
            const res = utils.applyImagePullSecret(slimJobTemplate, '');
            expect(res).to.eql(slimJobTemplate)
        });
        it('should set one secret', () => {
            const res = utils.applyImagePullSecret(slimJobTemplate, 'my-secret');
            expect(res.spec.template.spec.imagePullSecrets).to.exist;
            expect(res.spec.template.spec.imagePullSecrets[0]).to.eql({ name: 'my-secret' });
        });
        it('should add two secrets', () => {
            let res = utils.applyImagePullSecret(slimJobTemplate, 'my-secret');
            res = utils.applyImagePullSecret(res, 'my-secret2');
            expect(res.spec.template.spec.imagePullSecrets).to.exist;
            expect(res.spec.template.spec.imagePullSecrets[0]).to.eql({ name: 'my-secret' });
            expect(res.spec.template.spec.imagePullSecrets[1]).to.eql({ name: 'my-secret2' });
        });
        it('should not duplicate', () => {
            let res = utils.applyImagePullSecret(slimJobTemplate, 'my-secret');
            res = utils.applyImagePullSecret(res, 'my-secret');
            expect(res.spec.template.spec.imagePullSecrets).to.exist;
            expect(res.spec.template.spec.imagePullSecrets).to.have.lengthOf(1);
            expect(res.spec.template.spec.imagePullSecrets[0]).to.eql({ name: 'my-secret' });
        });
    });
    describe('applyAnnotations', () => {
        it('should add to empty metadata', () => {
            const res = utils.applyAnnotation(slimJobTemplate, { ann1: 'value1' });
            expect(res.metadata.annotations).to.exist;
            expect(res.metadata.annotations.ann1).to.eql('value1');
            expect(res.spec.template.metadata.annotations.ann1).to.eql('value1');

        });
        it('should return original spec if empty', () => {
            const res = utils.applyAnnotation(slimJobTemplate, undefined);
            expect(res).to.eql(slimJobTemplate)
        });
        it('should add to not empty metadata', () => {
            const res1 = utils.applyAnnotation(slimJobTemplate, { ann1: 'value1' });
            const res2 = utils.applyAnnotation(res1, { ann2: 'value2' });
            expect(res2.metadata.annotations).to.exist;
            expect(res2.metadata.annotations.ann1).to.eql('value1');
            expect(res2.metadata.annotations.ann2).to.eql('value2');
            expect(res2.spec.template.metadata.annotations.ann2).to.eql('value2');


        });
        it('should add multiple keys', () => {
            const res2 = utils.applyAnnotation(slimJobTemplate, { ann1: 'value1', ann2: 'value2' });
            expect(res2.metadata.annotations).to.exist;
            expect(res2.metadata.annotations.ann1).to.eql('value1');
            expect(res2.metadata.annotations.ann2).to.eql('value2');
            expect(res2.spec.template.metadata.annotations.ann2).to.eql('value2');

        });
        it('should delete annotation', () => {
            const res1 = utils.applyAnnotation(slimJobTemplate, { ann1: 'value1', ann2: 'value2' });
            expect(res1.metadata.annotations.ann1).to.eql('value1');
            const res2 = utils.applyAnnotation(res1, { ann2: null });
            expect(res2.metadata.annotations).to.exist;
            expect(res2.metadata.annotations.ann1).to.eql('value1');
            expect(res2.metadata.annotations.ann2).to.not.exist
            expect(res2.spec.template.metadata.annotations.ann2).to.not.exist

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
    describe('applyPrivileged', () => {
        it('should add privileged flag to container', () => {
            const container = 'worker';
            const res = utils.applyPrivileged(slimJobTemplate, true, container);
            expect(res.spec.template.spec.containers[0].securityContext.privileged).to.be.true;
        });
        it('should not add privileged flag to container', () => {
            const container = 'worker';
            const res = utils.applyPrivileged(slimJobTemplate, false, container);
            expect(res.spec.template.spec.containers[0].securityContext).to.not.exist;
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
            const volLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
            const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
            const res = utils.applyStorage(jobTemplate, storage, container, configMapName);
            expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(volLength + 1);
            expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength + 2);
        });
        it('should add storage env to spec', () => {
            const container = 'worker';
            const storage = 's3';
            const configMapName = null;
            const volLength = jobTemplate.spec.template.spec.containers[0].volumeMounts.length;
            const envLength = jobTemplate.spec.template.spec.containers[0].env.length;
            const res = utils.applyStorage(jobTemplate, storage, container, configMapName);
            expect(res.spec.template.spec.containers[0].volumeMounts).to.have.lengthOf(volLength);
            expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(envLength + 4);
        });
    });
    describe('applySecret', () => {
        it('should add secret to spec', () => {
            const res = utils.applySecret(slimJobTemplate, containerName, secretMock);
            expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(Object.keys(secretMock.data).length);
        });
        it('should add secret to spec with existing env', () => {
            const spec = clonedeep(slimJobTemplate);
            spec.spec.template.spec.containers[0].env = [{ name: 'e1', value: 'v1' }]
            const res = utils.applySecret(spec, containerName, secretMock);
            expect(res.spec.template.spec.containers[0].env).to.have.lengthOf(Object.keys(secretMock.data).length + 1);
        });
    });
});