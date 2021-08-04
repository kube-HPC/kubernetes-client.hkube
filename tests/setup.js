const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chaiSubset = require('chai-subset');
chai.use(chaiSubset);
const kubernetesServerMock = require('./mocks/kubernetes-server.mock');

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


before(async () => {
    const index = require('../index');
    Client = index.Client;
    utils = index.utils;
    client = new Client();
    await kubernetesServerMock.start({ port: 9001 });
    await client.init({ isLocal: false, timeout: 5000, kubeconfig })

    global.testParams = {
        utils,
        Client,
        client,
        kubernetesServerMock
    }
});