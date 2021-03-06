// JS-YAML's default schema for `load` function.
// It is not described in the YAML specification.
//
// This schema is based on JS-YAML's default safe schema and includes
// JavaScript-specific types: !!js/undefined, !!js/regexp and !!js/function.
//
// Also this schema is used as default base schema at `Schema.create` function.
'use strict';
var Schema = require('../schema');
var schema = new Schema({
    include: [
        require('./default_safe')
    ],
    explicit: [
        require('../type/js/undefined'),
        require('../type/js/regexp')
    ]
});
Schema.DEFAULT = schema;
module.exports = schema;
//# sourceMappingURL=default_full.js.map