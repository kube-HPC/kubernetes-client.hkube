const { expect } = require('chai');
const http = require('http');
const { isTransientError, backoffDelay, TIMEOUT_ERROR_CODE } = require('../lib/resilience');
const { buildBackendOptions } = require('../lib/client-factory');
const version = require('./stubs/version.json');

const PORT = 9002;
const kubeconfig = {
    apiVersion: 'v1',
    kind: 'Config',
    'current-context': 'dev',
    clusters: [{ name: 'dev', cluster: { server: `http://127.0.0.1:${PORT}/api/kube` } }],
    contexts: [{ name: 'dev', context: { cluster: 'dev', user: 'dev-admin' } }],
    users: [{ name: 'default-admin', user: {} }]
};

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('resilience', () => {
    describe('isTransientError', () => {
        it('should be true for own timeout', () => {
            const error = new Error('x timeout after 1ms');
            error.code = TIMEOUT_ERROR_CODE;
            expect(isTransientError(error)).to.eql(true);
        });
        it('should be true for 429 and 5xx', () => {
            [429, 500, 502, 503, 504].forEach((statusCode) => {
                expect(isTransientError({ statusCode, code: statusCode })).to.eql(true);
            });
        });
        it('should be false for other 4xx', () => {
            [400, 401, 403, 404, 409, 410, 422].forEach((statusCode) => {
                expect(isTransientError({ statusCode, code: statusCode })).to.eql(false);
            });
        });
        it('should be true for network errors', () => {
            ['ECONNRESET', 'ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPIPE', 'EAI_AGAIN', 'EHOSTUNREACH', 'ENETUNREACH'].forEach((code) => {
                expect(isTransientError({ code })).to.eql(true);
            });
        });
        it('should be false for unknown errors', () => {
            expect(isTransientError(new Error('bug'))).to.eql(false);
            expect(isTransientError({ code: 'ENOTFOUND' })).to.eql(false);
            expect(isTransientError(null)).to.eql(false);
        });
    });
    describe('backoffDelay', () => {
        it('should double per attempt with jitter between half and full delay', () => {
            expect(backoffDelay(1, 500, 5000, () => 0)).to.eql(250);
            expect(backoffDelay(1, 500, 5000, () => 1)).to.eql(500);
            expect(backoffDelay(2, 500, 5000, () => 1)).to.eql(1000);
            expect(backoffDelay(3, 500, 5000, () => 1)).to.eql(2000);
        });
        it('should cap at max delay', () => {
            expect(backoffDelay(10, 500, 5000, () => 1)).to.eql(5000);
        });
        it('should return 0 when base delay is 0', () => {
            expect(backoffDelay(3, 0, 5000)).to.eql(0);
        });
    });
    describe('buildBackendOptions', () => {
        it('should enable keep-alive by default', () => {
            const { request } = buildBackendOptions({});
            expect(request.forever).to.eql(true);
            expect(request.agentOptions.keepAlive).to.eql(true);
            expect(request.pool).to.be.an('object');
        });
        it('should disable keep-alive when keepAlive is false', () => {
            const { request } = buildBackendOptions({ keepAlive: false });
            expect(request).to.eql({});
        });
        it('should use resilience timeout as native request timeout', () => {
            expect(buildBackendOptions({ resilience: { timeoutMs: 10000 } }).timeout).to.eql(10000);
        });
        it('should prefer explicit timeout', () => {
            expect(buildBackendOptions({ timeout: 3000, resilience: { timeoutMs: 10000 } }).timeout).to.eql(3000);
        });
        it('should have no timeout when none configured', () => {
            expect(buildBackendOptions({}).timeout).to.eql(undefined);
        });
    });
    describe('http', () => {
        let server;
        let connections = 0;
        let closedRequests = 0;
        let Client;
        before((done) => {
            Client = global.testParams.Client;
            server = http.createServer((req, res) => {
                if (req.url.startsWith('/api/kube/version')) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(version.body));
                    return;
                }
                if (req.url.includes('/configmaps/hang')) {
                    res.on('close', () => { closedRequests += 1; });
                    return;
                }
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ kind: 'ConfigMap', data: {} }));
            });
            server.on('connection', () => { connections += 1; });
            server.listen(PORT, done);
        });
        after((done) => {
            server.closeAllConnections();
            server.close(done);
        });
        beforeEach(() => {
            connections = 0;
            closedRequests = 0;
        });
        it('should reuse connection for repeated calls with keep-alive', async () => {
            const c = new Client();
            await c.init({ isLocal: false, kubeconfig });
            const before = connections;
            for (let i = 0; i < 5; i += 1) {
                await c.configMaps.get({ name: 'hkube-versions' }); // eslint-disable-line no-await-in-loop
            }
            expect(connections - before).to.be.at.most(1);
        });
        it('should open a connection per call without keep-alive', async () => {
            const c = new Client();
            await c.init({ isLocal: false, kubeconfig, keepAlive: false });
            const before = connections;
            for (let i = 0; i < 5; i += 1) {
                await c.configMaps.get({ name: 'hkube-versions' }); // eslint-disable-line no-await-in-loop
            }
            expect(connections - before).to.eql(5);
        });
        it('should abort the request (close socket) on timeout', async () => {
            const c = new Client();
            await c.init({ isLocal: false, kubeconfig, resilience: { timeoutMs: 100 } });
            await expect(c.withResilience(() => c.configMaps.get({ name: 'hang' }), 'hang')).to.be.rejectedWith('hang timeout after 100ms');
            await wait(100);
            expect(closedRequests).to.eql(1);
        });
        it('should abort each attempt on timeout when retrying', async () => {
            const c = new Client();
            await c.init({ isLocal: false, kubeconfig, resilience: { timeoutMs: 100, retryLimit: 2, retryDelayMs: 1 } });
            await expect(c.withResilience(() => c.configMaps.get({ name: 'hang' }), 'hang')).to.be.rejected;
            await wait(100);
            expect(closedRequests).to.eql(2);
        });
    });
});
