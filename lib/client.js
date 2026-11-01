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
const LimitRanges = require('./limitRanges');
const { isTransientError, backoffDelay, sleep, runWithTimeout } = require('./resilience');

class Client {
    async init(options) {
        const k8sOptions = options || {};
        const namespace = k8sOptions.namespace || 'default';
        this._resilience = k8sOptions.resilience || {};

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
        this.limitRanges = new LimitRanges(client, namespace, this.kubeVersion);
    }

    /**
     * Run a function with an optional timeout and automatic retries, to protect
     * against hung or transient Kubernetes API calls (e.g. `connect ETIMEDOUT`).
     *
     * Behavior is controlled by the `resilience` object passed to `init`:
     * - `timeoutMs` - if set, `fn()` is raced against this timeout (timer cleared when the attempt settles).
     *   It is also used as the native request timeout, which aborts the socket (see client-factory).
     *   If unset, no timeout is applied.
     * - `retryLimit` - maximum number of attempts (default 1, i.e. no retry).
     * - `retryDelayMs` - base backoff delay before a retry (default 500). Doubles per attempt, with jitter.
     * - `retryMaxDelayMs` - maximum backoff delay (default 5000).
     * - `isRetryable(error)` - decides if an error is retried. Default: timeout, network errors, 429, 5xx.
     * - `onRetry({ label, attempt, error, delayMs })` - optional hook invoked before each retry.
     * - `onError({ label, attempts, error })` - optional hook invoked when the call finally fails.
     *
     * With no `resilience` config this is a transparent passthrough, so existing
     * consumers are unaffected.
     *
     * @param {Function} fn - Async function performing the Kubernetes call.
     * @param {string} label - Short label used by the logging hooks.
     * @returns {Promise<*>} Resolves with the value returned by `fn()`.
     * @throws Re-throws the last error if all attempts fail or the error is not retryable.
     */
    async withResilience(fn, label) {
        const {
            timeoutMs,
            retryLimit = 1,
            retryDelayMs = 500,
            retryMaxDelayMs = 5000,
            isRetryable = isTransientError,
            onRetry,
            onError
        } = this._resilience || {};
        const attemptFn = async (attempt) => {
            try {
                return await runWithTimeout(fn, timeoutMs, label);
            }
            catch (error) {
                if (attempt < retryLimit && isRetryable(error)) {
                    const delayMs = backoffDelay(attempt, retryDelayMs, retryMaxDelayMs);
                    if (onRetry) {
                        onRetry({ label, attempt, error, delayMs });
                    }
                    await sleep(delayMs);
                    return attemptFn(attempt + 1);
                }
                if (onError) {
                    onError({ label, attempts: attempt, error });
                }
                throw error;
            }
        };
        return attemptFn(1);
    }
}

module.exports = Client;
