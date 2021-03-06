'use strict';
var Type = require('../type');
function resolveYamlMerge(data) {
    return '<<' === data || null === data;
}
module.exports = new Type('tag:yaml.org,2002:merge', {
    kind: 'scalar',
    resolve: resolveYamlMerge
});
//# sourceMappingURL=merge.js.map