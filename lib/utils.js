const clonedeep = require('lodash.clonedeep');
const { awsAccessKeyId, awsSecretAccessKey, s3EndpointUrl } = require('./templates/s3-template');
const { fsBaseDirectory, fsVolumeMounts, fsVolumes } = require('./templates/fs-template');

const findContainer = (inputSpec, containerName) => {
    const container = inputSpec.spec.template.spec.containers.find(c => c.name === containerName);
    if (!container) {
        throw new Error(`unable to find container ${containerName}`);
    }
    return container;
};

const parseImageName = (image) => {
    const match = image.match(/^(?:([^/]+)\/)?(?:([^/]+)\/)?([^@:/]+)(?:[@:](.+))?$/);
    if (!match) return null;

    let registry = match[1];
    let namespace = match[2];
    const repository = match[3];
    let tag = match[4];

    if (!namespace && registry && !/[:.]/.test(registry)) {
        namespace = registry;
        registry = null;
    }

    const result = {
        registry: registry || null,
        namespace: namespace || null,
        repository,
        tag: tag || null
    };

    registry = registry ? `${registry}/` : '';
    namespace = namespace && namespace !== 'library' ? `${namespace}/` : '';
    tag = tag && tag !== 'latest' ? `:${tag}` : '';

    result.name = registry + namespace + repository + tag;
    result.fullname = registry + (namespace || 'library/') + repository + (tag || ':latest');

    return result;
};

const _createImageName = ({ registry, namespace, repository, tag }, ignoreTag) => {
    let array = [registry, namespace, repository];
    array = array.filter(a => a);
    let image = array.join('/');
    if (tag && !ignoreTag) {
        image = `${image}:${tag}`;
    }
    return image;
};

const _createImage = (image, versions, registry) => {
    if (!image) {
        return null;
    }
    const imageParsed = parseImageName(image);
    if (registry && !imageParsed.registry) {
        imageParsed.registry = registry.registry;
    }
    if (imageParsed.tag) {
        return _createImageName(imageParsed);
    }
    const version = versions && versions.versions.find(p => p.project === imageParsed.repository);
    if (version && version.tag) {
        imageParsed.tag = version.tag;
    }
    return _createImageName(imageParsed);
};

const createImage = (image, versions, registry) => {
    return _createImage(image, versions, registry);
};

const createImageFromContainer = (spec, containerName, versions, registry) => {
    const container = findContainer(spec, containerName);
    return _createImage(container.image, versions, registry);
};

const applyImage = (inputSpec, image, containerName) => {
    if (!image) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);
    const container = findContainer(spec, containerName);
    container.image = image;
    return spec;
};

const applyResourceRequests = (inputSpec, resourceRequests, containerName) => {
    if (!resourceRequests) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);
    const container = findContainer(spec, containerName);
    container.resources = { ...container.resources, ...resourceRequests };
    return spec;
};

const applyEnvToContainer = (inputSpec, containerName, inputEnv) => {
    if (!inputEnv) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);
    const container = findContainer(spec, containerName);
    if (!container.env) {
        container.env = [];
    }
    const { env } = container;
    Object.entries(inputEnv).forEach(([key, value]) => {
        const index = env.findIndex(i => i.name === key);
        const valueString = (typeof value === 'object') ? value : `${value}`;
        const valueKey = (typeof value === 'object') ? 'valueFrom' : 'value';
        if (index !== -1) {
            if (value == null) {
                env.splice(index, 1);
            }
            else {
                env[index] = { name: key, [valueKey]: valueString };
            }
        }
        else {
            env.push({ name: key, [valueKey]: valueString });
        }
    });
    return spec;
};

const nodeSelectorToNodeAffinity = (nodeSelector) => {
    if (!nodeSelector) {
        return null;
    }
    const matchExpressions = [];
    Object.entries(nodeSelector).forEach(([k, v]) => {
        matchExpressions.push({ key: k, operator: 'In', values: [v] });
    });
    return { nodeSelectorTerms: [{ matchExpressions }] };
};

const applyNodeAffinity = (inputSpec, nodeAffinity) => {
    const spec = clonedeep(inputSpec);
    if (nodeAffinity && Array.isArray(nodeAffinity.nodeSelectorTerms)) {
        spec.spec.template.spec.affinity = {
            nodeAffinity: {
                requiredDuringSchedulingIgnoredDuringExecution: {
                    nodeSelectorTerms: nodeAffinity.nodeSelectorTerms
                }
            }
        };
    }
    return spec;
};

const applyNodeSelector = (inputSpec, nodeSelector) => {
    const nodeAffinity = nodeSelectorToNodeAffinity(nodeSelector);
    return applyNodeAffinity(inputSpec, nodeAffinity);
};

const applyVolumes = (inputSpec, fsvolumes) => {
    if (!fsvolumes) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);

    if (!spec.spec.template.spec.volumes) {
        spec.spec.template.spec.volumes = [];
    }
    const { volumes } = spec.spec.template.spec;
    const index = volumes.findIndex(i => i.name === fsvolumes.name);
    if (index !== -1) {
        volumes[index] = fsvolumes;
    }
    else {
        volumes.push(fsvolumes);
    }
    return spec;
};

const applyVolumeMounts = (inputSpec, containerName, vm) => {
    if (!vm) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);
    const container = findContainer(spec, containerName);
    if (!container.volumeMounts) {
        container.volumeMounts = [];
    }
    const { volumeMounts } = container;
    const index = volumeMounts.findIndex(i => i.name === vm.name);
    if (index !== -1) {
        volumeMounts[index] = vm;
    }
    else {
        volumeMounts.push(vm);
    }
    return spec;
};

const applyStorage = (inputSpec, storage, containerName, configMapName) => {
    let spec = inputSpec;
    if (storage === 's3') {
        spec = applyEnvToContainer(spec, containerName, awsAccessKeyId);
        spec = applyEnvToContainer(spec, containerName, awsSecretAccessKey);
        spec = applyEnvToContainer(spec, containerName, s3EndpointUrl);
    }
    else if (storage === 'fs') {
        spec = applyEnvToContainer(spec, containerName, fsBaseDirectory(configMapName));
        spec = applyVolumes(spec, fsVolumes);
        spec = applyVolumeMounts(spec, containerName, fsVolumeMounts);
    }
    return spec;
};

module.exports = {
    findContainer,
    parseImageName,
    createImage,
    createImageFromContainer,
    applyImage,
    applyResourceRequests,
    applyEnvToContainer,
    nodeSelectorToNodeAffinity,
    applyNodeAffinity,
    applyNodeSelector,
    applyVolumes,
    applyVolumeMounts,
    applyStorage
};
