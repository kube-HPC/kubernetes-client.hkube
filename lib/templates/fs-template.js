const fsVolumes = {
    name: 'storage-volume',
    persistentVolumeClaim: {
        claimName: 'hkube-storage-pvc'
    }
};

const fsVolumeMounts = {
    name: 'storage-volume',
    mountPath: process.env.BASE_FS_ADAPTER_DIRECTORY || '/hkubedata'
};

const fsBaseDirectory = (configMapName) => ({
    BASE_FS_ADAPTER_DIRECTORY: {
        configMapKeyRef: {
            name: configMapName,
            key: 'BASE_FS_ADAPTER_DIRECTORY'
        }
    }
});

module.exports = {
    fsBaseDirectory,
    fsVolumeMounts,
    fsVolumes
};
