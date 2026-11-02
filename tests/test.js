const { expect } = require('chai');
const sinon = require('sinon');

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
const sidecarName = 'my-sidecar'

let client, Client, utils;
let client_v1_22;
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
        describe('Client v1.9', () => {
            it('should create new Client with isLocal:false', async () => {
                const clientK8s = new Client();
                await clientK8s.init({ isLocal: false, kubeconfig });
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
                const version = clientK8s.kubeVersion;
                expect(version.version).to.eql('1.19')
                expect(clientK8s.versions._version.version).to.eql('1.19')
                expect(clientK8s.ingresses._version.version).to.eql('1.19')
            });
        });
        describe('Client v1.22', () => {
            before(() => {
                global.testParams.kubernetesServerMock.setVersion({ major: '1', minor: '22' })
            })
            after(() => {
                global.testParams.kubernetesServerMock.setVersion({ major: '1', minor: '19' })
            })
            it('should create new Client with isLocal:false', async () => {
                const clientK8s = new Client();
                await clientK8s.init({ isLocal: false, kubeconfig });
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
                const version = clientK8s.kubeVersion;
                expect(version.version).to.eql('1.22')
                expect(clientK8s.versions._version.version).to.eql('1.22')
                expect(clientK8s.ingresses._version.version).to.eql('1.22')
            });
        });
        describe('ConfigMaps', () => {
            it('should get configMaps', async () => {
                const configMapRes = await client.configMaps.get({ name: configMapName });
                expect(configMapRes).to.have.property('body');
                expect(configMapRes).to.have.property('statusCode');
                expect(configMapRes.body.path).to.include('api/v1');
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
            it('should throw if containerName not found', async () => {
                await expect(client.containers.getStatus({ podName, containerName: 'no-container' })).to.be.rejectedWith('unable to find container no-container');
            });
        });
        describe('Deployments', () => {
            it('should get', async () => {
                const res = await client.deployments.get({ labelSelector });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.include('apis/apps/v1');
            });
            it('should create', async () => {
                const res = await client.deployments.create({ spec: deploymentTemplate });
                expect(res).to.containSubset(response);
            });
            it('should update', async () => {
                const res = await client.deployments.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.containSubset(response);
            });
            it('should delete', async () => {
                const res = await client.deployments.delete({ deploymentName });
                expect(res).to.containSubset(response);
            });
        });
        describe('Ingresses', () => {
            it('should get', async () => {
                const res = await client.ingresses.get({ labelSelector });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/extensions/v1beta1/namespaces/default/ingresses/');
            });
            it('should create', async () => {
                const res = await client.ingresses.create({ spec: deploymentTemplate });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/extensions/v1beta1/namespaces/default/ingresses');
            });
            it('should update', async () => {
                const res = await client.ingresses.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/extensions/v1beta1/namespaces/default/ingresses/');
            });
            it('should delete', async () => {
                const res = await client.ingresses.delete({ deploymentName });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/extensions/v1beta1/namespaces/default/ingresses/');
            });
        });

        describe('Ingresses v1.22', () => {
            before(async () => {
                global.testParams.kubernetesServerMock.setVersion({ major: '1', minor: '22' })
                client_v1_22 = new Client();
                await client_v1_22.init({ isLocal: false, kubeconfig });
            });
            after(() => {
                global.testParams.kubernetesServerMock.setVersion({ major: '1', minor: '19' })
            });
            it('should get', async () => {
                const res = await client_v1_22.ingresses.get({ labelSelector });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/networking.k8s.io/v1/namespaces/default/ingresses/');
            });
            it('should create', async () => {
                const res = await client_v1_22.ingresses.create({ spec: deploymentTemplate });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/networking.k8s.io/v1/namespaces/default/ingresses');
            });
            it('should update', async () => {
                const res = await client_v1_22.ingresses.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/networking.k8s.io/v1/namespaces/default/ingresses/');
            });
            it('should delete', async () => {
                const res = await client_v1_22.ingresses.delete({ deploymentName });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.eql('/api/kube/apis/networking.k8s.io/v1/namespaces/default/ingresses/');
            });
        });
        describe('Jobs', () => {
            it('should get', async () => {
                const res = await client.jobs.get({ labelSelector });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.include('apis/batch/v1');
            });
            it('should create', async () => {
                const res = await client.jobs.create({ spec: jobTemplate });
                expect(res).to.containSubset(response);
            });
            it('should update', async () => {
                const res = await client.jobs.update({ jobName, spec: jobTemplate });
                expect(res).to.containSubset(response);
            });
            it('should delete', async () => {
                const res = await client.jobs.delete({ jobName });
                expect(res).to.containSubset(response);
            });
        });
        describe('Logs', () => {
            it('should get', async () => {
                const res = await client.logs.get({ podName, containerName });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.include('api/v1/');
            });
        });
        describe('Nodes', () => {
            it('should get', async () => {
                const res = await client.nodes.get({ labelSelector });
                expect(res).to.containSubset(response);
            });
            it('should get all', async () => {
                const res = await client.nodes.all();
                expect(res).to.containSubset(response);
            });
        });
        describe('Pods', () => {
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
        describe('PVC', () => {
            it('should get', async () => {
                const res = await client.pvc.get({ name: 'mypvc', labelSelector });
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/persistentvolumeclaims/mypvc')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all', async () => {
                const res = await client.pvc.get({ useNamespace: false });
                expect(res.body.path).to.eql('/api/kube/api/v1/persistentvolumeclaims')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all in namespace', async () => {
                const res = await client.pvc.get();
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/persistentvolumeclaims/')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all backward compatibility', async () => {
                const res = await client.pvc.all();
                expect(res.body.path).to.eql('/api/kube/api/v1/persistentvolumeclaims')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should get all in namespace backward compatibility', async () => {
                const res = await client.pvc.all(true);
                expect(res.body.path).to.eql('/api/kube/api/v1/namespaces/default/persistentvolumeclaims/')
                expect(res).to.have.property('statusCode');
                expect(res).to.have.property('body');
            });
            it('should delete', async () => {
                const res = await client.pvc.delete({ name: 'mypvc' });
                expect(res.statusCode).to.eql(200);
            });
        });
        describe('ResourceQuotas', () => {
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
                expect(res).to.containSubset(response);
                expect(res.body.path).to.include('api/v1');
            });
            it('should create', async () => {
                const res = await client.services.create({ spec: deploymentTemplate });
                expect(res).to.containSubset(response);
            });
            it('should update', async () => {
                const res = await client.services.update({ deploymentName, spec: deploymentTemplate });
                expect(res).to.containSubset(response);
            });
            it('should delete', async () => {
                const res = await client.services.delete({ deploymentName });
                expect(res).to.containSubset(response);
            });
        });
        describe('Secrets', () => {
            it('should get', async () => {
                const res = await client.secrets.get({ secretName });
                expect(res).to.containSubset(response);
                expect(res.body.path).to.include('api/v1');
            });
        });
        describe('Sidecars', () => {
            it('should get', async () => {
                const res = await client.sidecars.get({ name: sidecarName });
                expect(res.container).to.have.lengthOf(1);
                expect(res.container[0]).to.deep.include({name: 'my-sidecar-container'});
                expect(res.volumes).to.have.lengthOf(2);
                expect(res.volumeMounts).to.have.lengthOf(1);

            });
            it('should return null if not found', async () => {
                const res = await client.sidecars.get({ name: 'no-such' });
                expect(res).to.not.exist;
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
    describe('withResilience', () => {
        const httpError = (statusCode) => {
            const error = new Error(`status ${statusCode}`);
            error.code = statusCode;
            error.statusCode = statusCode;
            return error;
        };
        const networkError = (code) => {
            const error = new Error(code);
            error.code = code;
            return error;
        };
        const spyTimeoutTimers = (timeoutMs) => {
            const spy = sinon.spy(global, 'setTimeout');
            return {
                timers: () => spy.getCalls().filter(call => call.args[1] === timeoutMs).map(call => call.returnValue),
                restore: () => spy.restore()
            };
        };

        it('should passthrough and return value when no resilience configured', async () => {
            const c = new Client();
            const res = await c.withResilience(async () => 'ok', 'test');
            expect(res).to.eql('ok');
        });
        it('should reject with timeout when fn exceeds timeoutMs', async () => {
            const c = new Client();
            c._resilience = { timeoutMs: 20 };
            await expect(c.withResilience(() => new Promise(() => { }), 'slow'))
                .to.be.rejectedWith('slow timeout after 20ms');
        });
        it('should clear the timeout timer when the call resolves', async () => {
            const c = new Client();
            c._resilience = { timeoutMs: 60000 };
            const spy = spyTimeoutTimers(60000);
            const res = await c.withResilience(async () => 'ok', 'fast');
            spy.restore();
            expect(res).to.eql('ok');
            expect(spy.timers()).to.have.lengthOf(1);
            expect(spy.timers()[0]._destroyed).to.eql(true);
        });
        it('should clear the timeout timer when the call rejects', async () => {
            const c = new Client();
            c._resilience = { timeoutMs: 60000 };
            const spy = spyTimeoutTimers(60000);
            await expect(c.withResilience(async () => { throw httpError(404); }, 'fail')).to.be.rejectedWith('status 404');
            spy.restore();
            expect(spy.timers()).to.have.lengthOf(1);
            expect(spy.timers()[0]._destroyed).to.eql(true);
        });
        it('should retry on transient error and resolve, invoking onRetry', async () => {
            const c = new Client();
            const retries = [];
            c._resilience = { retryLimit: 3, retryDelayMs: 1, onRetry: (info) => retries.push(info) };
            let calls = 0;
            const res = await c.withResilience(async () => {
                calls += 1;
                if (calls < 2) {
                    throw httpError(503);
                }
                return 'recovered';
            }, 'flaky');
            expect(res).to.eql('recovered');
            expect(calls).to.eql(2);
            expect(retries).to.have.lengthOf(1);
            expect(retries[0]).to.containSubset({ label: 'flaky', attempt: 1 });
        });
        it('should throw last error after exhausting retries, invoking onError', async () => {
            const c = new Client();
            let errorInfo;
            c._resilience = { retryLimit: 2, retryDelayMs: 1, onError: (info) => { errorInfo = info; } };
            let calls = 0;
            await expect(c.withResilience(async () => {
                calls += 1;
                throw networkError('ECONNRESET');
            }, 'broken')).to.be.rejectedWith('ECONNRESET');
            expect(calls).to.eql(2);
            expect(errorInfo).to.containSubset({ label: 'broken', attempts: 2 });
        });
        [429, 500, 503].forEach((statusCode) => {
            it(`should retry on http ${statusCode}`, async () => {
                const c = new Client();
                c._resilience = { retryLimit: 2, retryDelayMs: 1 };
                let calls = 0;
                await expect(c.withResilience(async () => {
                    calls += 1;
                    throw httpError(statusCode);
                }, 'http')).to.be.rejected;
                expect(calls).to.eql(2);
            });
        });
        [400, 401, 403, 404, 409, 422].forEach((statusCode) => {
            it(`should not retry on http ${statusCode}`, async () => {
                const c = new Client();
                let errorInfo;
                c._resilience = { retryLimit: 3, retryDelayMs: 1, onError: (info) => { errorInfo = info; } };
                let calls = 0;
                await expect(c.withResilience(async () => {
                    calls += 1;
                    throw httpError(statusCode);
                }, 'http')).to.be.rejectedWith(`status ${statusCode}`);
                expect(calls).to.eql(1);
                expect(errorInfo).to.containSubset({ label: 'http', attempts: 1 });
            });
        });
        ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EAI_AGAIN'].forEach((code) => {
            it(`should retry on network error ${code}`, async () => {
                const c = new Client();
                c._resilience = { retryLimit: 2, retryDelayMs: 1 };
                let calls = 0;
                await expect(c.withResilience(async () => {
                    calls += 1;
                    throw networkError(code);
                }, 'net')).to.be.rejectedWith(code);
                expect(calls).to.eql(2);
            });
        });
        it('should not retry on unknown error', async () => {
            const c = new Client();
            c._resilience = { retryLimit: 3, retryDelayMs: 1 };
            let calls = 0;
            await expect(c.withResilience(async () => {
                calls += 1;
                throw new Error('bug');
            }, 'unknown')).to.be.rejectedWith('bug');
            expect(calls).to.eql(1);
        });
        it('should retry on own timeout', async () => {
            const c = new Client();
            c._resilience = { timeoutMs: 20, retryLimit: 2, retryDelayMs: 1 };
            let calls = 0;
            await expect(c.withResilience(() => {
                calls += 1;
                return new Promise(() => { });
            }, 'slow')).to.be.rejectedWith('slow timeout after 20ms');
            expect(calls).to.eql(2);
        });
        it('should wait with backoff before retry', async () => {
            const c = new Client();
            const delays = [];
            c._resilience = { retryLimit: 3, retryDelayMs: 40, retryMaxDelayMs: 1000, onRetry: ({ delayMs }) => delays.push(delayMs) };
            const callTimes = [];
            await expect(c.withResilience(async () => {
                callTimes.push(Date.now());
                throw httpError(503);
            }, 'backoff')).to.be.rejected;
            expect(callTimes).to.have.lengthOf(3);
            expect(delays[0]).to.be.within(20, 40);
            expect(delays[1]).to.be.within(40, 80);
            expect(callTimes[1] - callTimes[0]).to.be.at.least(delays[0] - 2);
            expect(callTimes[2] - callTimes[1]).to.be.at.least(delays[1] - 2);
        });
        it('should use custom isRetryable', async () => {
            const c = new Client();
            c._resilience = { retryLimit: 2, retryDelayMs: 1, isRetryable: () => true };
            let calls = 0;
            await expect(c.withResilience(async () => {
                calls += 1;
                throw httpError(404);
            }, 'custom')).to.be.rejected;
            expect(calls).to.eql(2);
        });
    });
});
