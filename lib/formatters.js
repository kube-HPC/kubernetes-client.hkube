module.exports = {
    parseInt(value, defaultValue) {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const ret = parseInt(value, 10);
            if (Number.isNaN(ret)) {
                return defaultValue;
            }
            return ret;
        }
        return defaultValue;
    }
};
