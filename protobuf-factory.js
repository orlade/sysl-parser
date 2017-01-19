/**
 * Helper functions for building and working with Protobuf objects.
 */
module.exports = (namespace, verbose = false) => {

    /**
     * Constructs a new instance of a Message.
     * @param type
     * @param fields
     * @return {*}
     */
    function build(type, fields = {}) {
        verbose && console.log(`Building ${type}`);
        const Class = type.split('.').reduce((cls, part) => cls[part], namespace);
        Class.prototype._type = type;
        const instance = new Class();
        Object.keys(fields).forEach(key => setField(instance, key, fields[key]));
        return instance;
    }

    /**
     * Sets a field of a Message to a value.
     * @param source
     * @param key
     * @param value
     * @return {*}
     */
    function setField(source, key, value) {
        const valueStr = value._type || (value.map && value.map(v => v._type)) || typeof value;
        const method = `set${key[0].toUpperCase()}${key.length > 1 ? key.substr(1) : ''}`;
        verbose && console.log(`Calling ${source._type}.${method}(${valueStr})`);
        source[method](value);
        return value;
    }

    /**
     * Sets multiple values to a Map field of a Message.
     * @param source
     * @param key
     * @param values
     * @param valuesKey
     * @return {*}
     */
    function assign(source, key, values, valuesKey = null) {
        if (values && valuesKey) {
            values = values[valuesKey];
        } else if (!values) {
            return values;
        }
        const valueTypes = values.map(v => v._type || `${Object.keys(v)[0]}: ${v[Object.keys(v)[0]]._type}`);
        verbose && console.log(`Assigning ${source._type}.${key}(${valueTypes.join(', ')})`);
        const map = source[`get${key[0].toUpperCase()}${key.substr(1)}`]();
        const fields = Object.assign({}, ...values);
        return Object.keys(fields).reduce((map, k) => map.set(k, fields[k]), map);
    }

    /**
     * Helper method: returns the first key of an object.
     * @param obj
     */
    const onlyKey = (obj) => Object.keys(obj)[0];

    /**
     * Helper method: returns the value corresponding to the first key of an object.
     * @param obj
     */
    const only = (obj) => obj[onlyKey(obj)];

    return {build, setField, assign, only, onlyKey};
};
