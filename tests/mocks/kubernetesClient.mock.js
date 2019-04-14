const { nodes, pods } = require('../stubs/resources');
const nodesBody = nodes;
const podsBody = pods;

class MockClient {
    constructor() {
        this.shouldThrow = false;
        const jobs = (jobName) => ({
            delete: () => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ deleted: jobName })
            },
            get: ({ qs }) => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ get: { qs } })

            },
            post: ({ body }) => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ body })
            },
            patch: ({ body }) => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ body })
            }
        });
        jobs.post = ({ body }) => {
            if (this.shouldThrow) {
                throw new Error();
            }
            return Promise.resolve({ body })
        }
        const deployments = (deploymentName) => ({
            delete: () => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ deleted: deploymentName })
            },
            get: ({ qs }) => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ get: { qs } })

            },
            patch: ({ body }) => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ body })
            }
        });
        deployments.post = ({ body }) => {
            if (this.shouldThrow) {
                throw new Error();
            }
            return Promise.resolve({ body })
        };
        this.apis = {
            batch: {
                v1: {
                    namespaces: () => ({
                        jobs
                    })
                }
            },
            apps: {
                v1: {
                    namespaces: () => ({
                        deployment: deployments,
                        deployments
                    })
                }
            }
        };
        const pods = (jobName) => ({
            get: ({ qs } = {}) => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({ getPod: { qs }, body: podsBody.body })
            },
            log: {
                get: ({ qs } = {}) => {
                    if (this.shouldThrow) {
                        throw new Error();
                    }
                    return Promise.resolve({ getPod: { qs }, body: podsBody.body })
                }
            }
        });
        const configmaps = (name) => ({
            get: () => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({
                    body: {
                        data: {
                            'versions.json': JSON.stringify({ name, versions: [] }),
                            'registry.json': JSON.stringify({ name, versions: [] }),
                            'clusterOptions.json': JSON.stringify({ name, versions: [] }),
                        }
                    }
                })
            }
        });
        const nodes = {
            get: () => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve({
                    get: 'nodes',
                    body: nodesBody.body
                })
            }
        };
        this.version = {
            get: () => {
                if (this.shouldThrow) {
                    throw new Error();
                }
                return Promise.resolve()
            }
        };
        this.api = {
            v1: {
                namespaces: () => ({
                    pods,
                    configmaps
                }),
                pods,
                nodes
            }
        };
    }
}

module.exports = {
    config: {
        fromKubeconfig: () => ({ desc: 'mock config' }),
        getInCluster: () => ({ desc: 'mock config' }),
    },
    Client: MockClient
};

