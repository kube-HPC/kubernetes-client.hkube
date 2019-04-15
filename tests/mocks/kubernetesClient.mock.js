const { nodes, pods } = require('../stubs/resources');
const nodesBody = nodes;
const podsBody = pods;

class MockClient {
    constructor() {
        const jobs = (jobName) => ({
            delete: () => {
                return Promise.resolve({ deleted: jobName })
            },
            get: ({ qs }) => {
                return Promise.resolve({ get: { qs } })

            },
            post: ({ body }) => {
                return Promise.resolve({ body })
            },
            patch: ({ body }) => {
                return Promise.resolve({ body })
            }
        });
        jobs.post = ({ body }) => {
            return Promise.resolve({ body })
        }
        const deployments = (deploymentName) => ({
            delete: () => {
                return Promise.resolve({ deleted: deploymentName })
            },
            get: ({ qs }) => {
                return Promise.resolve({ get: { qs } })

            },
            patch: ({ body }) => {
                return Promise.resolve({ body })
            }
        });
        deployments.post = ({ body }) => {
            return Promise.resolve({ body })
        };
        const services = (servicesName) => ({
            delete: () => {
                return Promise.resolve({ deleted: servicesName })
            },
            get: ({ qs }) => {
                return Promise.resolve({ get: { qs } })

            },
            patch: ({ body }) => {
                return Promise.resolve({ body })
            }
        });
        services.post = ({ body }) => {
            return Promise.resolve({ body })
        };
        const ingresses = (servicesName) => ({
            delete: () => {
                return Promise.resolve({ deleted: servicesName })
            },
            get: ({ qs }) => {
                return Promise.resolve({ get: { qs } })

            },
            patch: ({ body }) => {
                return Promise.resolve({ body })
            }
        });
        ingresses.post = ({ body }) => {
            return Promise.resolve({ body })
        };
        this.apis = {
            v1: {
                namespaces: () => ({
                    services
                })
            },
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
            },
            extensions: {
                v1beta: {
                    namespaces: () => ({
                        ingresses
                    })
                }
            }
        };
        const pods = (jobName) => ({
            get: ({ qs } = {}) => {
                return Promise.resolve({ getPod: { qs }, body: podsBody.body })
            },
            log: {
                get: ({ qs } = {}) => {
                    return Promise.resolve({ getPod: { qs }, body: podsBody.body })
                }
            }
        });
        const configmaps = (name) => ({
            get: () => {
                return Promise.resolve({
                    body: {
                        data: {
                            'versions.json': JSON.stringify({ name, versions: [{ project: 'worker', tag: 'v2.1.0' }] }),
                            'registry.json': JSON.stringify('cloud.docker.com'),
                            'clusterOptions.json': JSON.stringify({ useNodeSelector: true }),
                        }
                    }
                })
            }
        });
        const nodes = {
            get: () => {
                return Promise.resolve({
                    get: 'nodes',
                    body: nodesBody.body
                })
            }
        };
        this.version = {
            get: () => {
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

