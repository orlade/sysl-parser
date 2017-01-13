/**
 * Helper functions for building and working with Protobuf objects.
 */
module.exports = (namespace) => ({

    build: function build(type) {
        console.log(`Building ${type}`);
        const Class = type.split('.').reduce((cls, part) => cls[part], namespace);
        Class.prototype._type = type;
        return new Class();
    },

    setField: function setField(source, key, value) {
        const valueStr = value._type || (value.map && value.map(v => v._type)) || 'UNKNOWN';
        console.log(`Calling ${source._type}.set${key[0].toUpperCase()}${key.substr(1)}(${valueStr})`);
        source[`set${key[0].toUpperCase()}${key.substr(1)}`](value);
        return value;
    },

    assign: function assign(source, key, values) {
        const valueTypes = values.map(v => v._type || `${Object.keys(v)[0]}: ${v[Object.keys(v)[0]]._type}`);
        console.log(`Assigning ${source._type}.${key}(${valueTypes.join(', ')})`);
        const map = source[`get${key[0].toUpperCase()}${key.substr(1)}`]();
        return Object.assign(map, ...values);
    },

});
