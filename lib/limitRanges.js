const Client = require('./client-base');

/**
 * Client for interacting with Kubernetes LimitRanges.
 * Extends the base Kubernetes client.
 */
class LimitRanges extends Client {
    /**
     * Get a specific LimitRange or a list of LimitRanges.
     *
     * @param {Object} [options={}] - Query options.
     * @param {string} [options.name] - Name of the LimitRange to retrieve.
     * @param {string} [options.labelSelector] - Label selector for filtering resources.
     * @param {boolean} [options.useNamespace=true] - Whether to scope the request to the current namespace.
     * @returns {Promise<Object>} - The retrieved LimitRange(s).
     */
    get({ name, labelSelector, useNamespace = true } = {}) {
        const prefix = useNamespace
            ? this._prefix.namespaces(this._namespace).limitranges(name)
            : this._client.api.v1.limitranges;

        return prefix.get({ qs: { labelSelector } });
    }

    /**
     * Get all LimitRanges (namespaced or cluster-wide).
     *
     * @param {boolean} [useNamespace=false] - Whether to scope the request to the current namespace.
     * @returns {Promise<Object>} - The list of LimitRanges.
     */
    all(useNamespace = false) {
        return this.get({ useNamespace });
    }
}

module.exports = LimitRanges;
