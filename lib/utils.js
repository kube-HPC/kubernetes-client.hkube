const clonedeep = require('lodash.clonedeep');
const objectPath = require('object-path');
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
    const match = image.match(/^(?:([^/]+)\/)?(?:([^@:]+)\/)?([^@:]+)(?:[@:](.+))?$/);
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
    let imageParsed = parseImageName(image);
    const version = versions && versions.versions.find(p => p.project === imageParsed.repository);
    if (version && version.image) {
        imageParsed = parseImageName(version.image);
    }

    if (registry && !imageParsed.registry) {
        imageParsed.registry = registry.registry;
    }

    if (imageParsed.tag) {
        return _createImageName(imageParsed);
    }
    if (version && version.tag) {
        imageParsed.tag = version.tag;
    }
    return _createImageName(imageParsed);
};

const createEnvFromConfigmap = (configMapName, key) => ({
    [key]: {
        configMapKeyRef: {
            name: configMapName,
            key
        }
    }
});

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

const _setKeyValueAnnotation = (annotations, key, value) => {
    const valueString = (typeof value === 'object') ? value : `${value}`;
    if (value == null) {
        delete annotations[key];
    }
    annotations[key] = valueString;
};

const _setAnnotations = (inputAnnotations, spec, path) => {
    if (!objectPath.get(spec, path)) {
        objectPath.set(spec, path, {});
    }
    const targetAnnotations = objectPath.get(spec, path);
    Object.entries(inputAnnotations).forEach(([key, value]) => {
        _setKeyValueAnnotation(targetAnnotations, key, value);
    });
};

const _setKeyValueEnv = (env, key, value) => {
    const index = env.findIndex(i => i.name === key);
    const valueString = (typeof value === 'object') ? value : `${value}`;
    const valueKey = (typeof value === 'object') ? 'valueFrom' : 'value';
    if (index !== -1) {
        if (value == null) {
            env.splice(index, 1);
        }
        else {
            env[index] = { name: key, [valueKey]: valueString }; //eslint-disable-line
        }
    }
    else {
        env.push({ name: key, [valueKey]: valueString });
    }
};


const applyAnnotation = (inputSpec, inputAnnotations) => {
    if (!inputAnnotations) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);

    _setAnnotations(inputAnnotations, spec, 'metadata.annotations');
    _setAnnotations(inputAnnotations, spec, 'spec.template.metadata.annotations');
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
        _setKeyValueEnv(env, key, value);
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
    spec = applyEnvToContainer(spec, containerName, createEnvFromConfigmap(configMapName, 'STORAGE_BINARY'));
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

const applyImagePullSecret = (inputSpec, secretName) => {
    const spec = clonedeep(inputSpec);
    if (!secretName) {
        return spec;
    }
    if (!spec.spec.template.spec.imagePullSecrets) {
        spec.spec.template.spec.imagePullSecrets = [];
    }
    const { imagePullSecrets } = spec.spec.template.spec;
    const index = imagePullSecrets.findIndex(i => i.name === secretName);
    if (index === -1) {
        imagePullSecrets.push({ name: secretName });
    }
    return spec;
};

const applyPrivileged = (inputSpec, isPrivileged, containerName) => {
    const spec = clonedeep(inputSpec);
    if (!isPrivileged) {
        return spec;
    }
    const container = findContainer(spec, containerName);
    objectPath.set(container, 'securityContext.privileged', true);
    return spec;
};

const applySecret = (inputSpec, containerName, secret) => {
    const spec = clonedeep(inputSpec);
    const container = findContainer(spec, containerName);
    if (!container.env) {
        container.env = [];
    }
    const { name } = secret.metadata;
    Object.keys(secret.data).forEach((k) => {
        const key = k.toUpperCase();
        const value = {
            secretKeyRef: {
                name,
                key: k
            }
        };
        _setKeyValueEnv(container.env, key, value);
    });
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
    applyStorage,
    applyPrivileged,
    applySecret,
    createEnvFromConfigmap,
    applyAnnotation,
    applyImagePullSecret
};
