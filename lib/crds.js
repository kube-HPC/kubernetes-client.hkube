const Client = require('./client-base');

/**
 * Client for interacting with arbitrary Custom Resource Definitions (CRDs).
 * Allows fetching individual or all resources by manually constructing the API path.
 */
class CRDs extends Client {
    /**
     * Fetches a single custom resource or a list of custom resources.
     *
     * @param {Object} params - Parameters for the request.
     * @param {string} params.group - API group of the CRD.
     * @param {string} params.version - API version of the CRD.
     * @param {string} params.resource - Resource type (e.g., 'queues').
     * @param {string} [params.name] - Optional resource name for fetching a specific resource.
     * @param {string} [params.labelSelector] - Optional label selector for filtering.
     * @returns {Promise<Object>} The API response containing the requested resource(s).
     */
    async get({ name, group, version, resource, labelSelector } = {}) {
        const basePath = name
            ? `/apis/${group}/${version}/${resource}/${name}`
            : `/apis/${group}/${version}/${resource}`;

        const qs = labelSelector ? { labelSelector } : undefined;

        return this._client.backend.http({
            method: 'GET',
            pathname: basePath,
            qs
        });
    }

    /**
     * Fetches all custom resources of the specified type.
     *
     * @param {Object} params - Parameters for the request.
     * @param {string} params.group - API group of the CRD.
     * @param {string} params.version - API version of the CRD.
     * @param {string} params.resource - Resource type (e.g., 'queues').
     * @param {string} [params.labelSelector] - Optional label selector for filtering.
     * @returns {Promise<Object>} The API response containing the list of resources.
     */
    all(params = {}) {
        return this.get(params);
    }
}

module.exports = CRDs;
