const slimJobTemplate = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
        name: 'job-name',
        labels: {
            type: 'worker',
            group: 'hkube'
        }
    },
    spec: {
        template: {
            spec: {
                nodeSelector: {
                    worker: 'true'
                },
                containers: [
                    {
                        name: 'worker',
                        image: 'hkube/worker:latest'
                    },
                    {
                        name: 'algorunner',
                        image: 'hkube/algorunner:latest'
                    }
                ]
            }
        }
    }
};

module.exports = slimJobTemplate;
