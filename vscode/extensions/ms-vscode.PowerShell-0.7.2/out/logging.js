"use strict";
function getLogName(baseName) {
    return Math.floor(Date.now() / 1000) + '-' + baseName + '.log';
}
exports.getLogName = getLogName;
//# sourceMappingURL=logging.js.map