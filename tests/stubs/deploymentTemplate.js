

const name = 'test-deployment';

const algorithmQueueTemplate = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
        name,
        labels: {
            type: name,
            app: name,
            group: 'hkube',
            core: 'true'
        }
    },
    spec: {
        replicas: 1,
        selector: {
            matchLabels: {
                app: name
            }
        },
        template: {
            metadata: {
                labels: {
                    app: name,
                    group: 'hkube'
                }
            },
            spec: {
                nodeSelector: {
                    core: 'true'
                },
                containers: [
                    {
                        name,
                        image: 'hkube/algorithm-queue:latest',
                        ports: [
                            {
                                containerPort: 3000
                            }
                        ],
                        env: [
                            {
                                name: 'NODE_ENV',
                                value: 'kube'
                            }
                        ]
                    }
                ]
            }
        }
    }
}

module.exports = algorithmQueueTemplate;
