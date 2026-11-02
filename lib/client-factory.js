const kubernetesClient = require('kubernetes-client');
const compareVersions = require('compare-versions');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const Versions = require('./versions');

const DEFAULT_KEEP_ALIVE_IDLE_TIMEOUT_MS = 30000;
// Dedicated agent pool: request's global pool key ignores keepAlive, so a non keep-alive
// agent created elsewhere for the same CA would otherwise be reused.
const keepAlivePool = {};

/**
 * Options for the `request` backend:
 * - `timeout` - native request timeout, aborts the socket. Falls back to `resilience.timeoutMs`.
 * - `request` - keep-alive agent (default on, `keepAlive: false` disables), so calls reuse
 *   TLS connections instead of creating a new secure context per call.
 *   Idle sockets are closed after `keepAliveIdleTimeoutMs`.
 */
const buildBackendOptions = (k8sOptions) => {
    const { keepAlive = true, keepAliveIdleTimeoutMs = DEFAULT_KEEP_ALIVE_IDLE_TIMEOUT_MS, resilience } = k8sOptions;
    const timeout = k8sOptions.timeout || (resilience && resilience.timeoutMs) || undefined;
    const request = keepAlive
        ? { forever: true, pool: keepAlivePool, agentOptions: { keepAlive: true, timeout: keepAliveIdleTimeoutMs } }
        : {};
    return { timeout, request };
};

const createClient = async (options) => {
    const k8sOptions = options || {};
    const initialVersion = k8sOptions.version || '1.9';
    let config;
    if (!k8sOptions.isLocal) {
        config = kubernetesClient.config.fromKubeconfig(k8sOptions.kubeconfig);
    }
    else {
        config = kubernetesClient.config.getInCluster();
    }
    const backendConfig = () => ({ ...buildBackendOptions(k8sOptions), ...config });
    let client = new kubernetesClient.Client({ config: backendConfig(), version: initialVersion });
    const versions = new Versions(client);
    const kubeVersion = await versions.getParsedVersion();
    if (compareVersions.compare(kubeVersion.version, '1.21', '<')) {
        return { client, config };
    }
    // version is newer than 1.21. need to use latest swagger
    const spec = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'spec', './swagger-1.22.json.gz'))));
    client = new kubernetesClient.Client({ config: backendConfig(), spec });
    return { client, config };
};

module.exports = createClient;
module.exports.buildBackendOptions = buildBackendOptions;
