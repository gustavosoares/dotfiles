"use strict";
var vagrantExt = require('./vagrant-extension');
function activate(context) {
    vagrantExt.registerCommands(context);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map