const clonedeep = require('lodash.clonedeep');

const findContainer = (inputSpec, containerName) => {
    const container = inputSpec.spec.template.spec.containers.find(c => c.name === containerName);
    if (!container) {
        throw new Error(`unable to find container ${containerName}`);
    }
    return container;
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

const applyVolumes = (inputSpec, fsVolumes) => {
    if (!fsVolumes) {
        return inputSpec;
    }
    const spec = clonedeep(inputSpec);

    if (!spec.spec.template.spec.volumes) {
        spec.spec.template.spec.volumes = [];
    }
    const { volumes } = spec.spec.template.spec;
    const index = volumes.findIndex(i => i.name === fsVolumes.name);
    if (index !== -1) {
        volumes[index] = fsVolumes;
    }
    else {
        volumes.push(fsVolumes);
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

module.exports = {
    findContainer,
    applyImage,
    applyResourceRequests,
    applyEnvToContainer,
    nodeSelectorToNodeAffinity,
    applyNodeAffinity,
    applyNodeSelector,
    applyVolumes,
    applyVolumeMounts
};
