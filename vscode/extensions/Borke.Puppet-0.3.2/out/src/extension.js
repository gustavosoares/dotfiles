"use strict";
const puppetLintProvider_1 = require('./features/puppetLintProvider');
function activate(context) {
    let linter = new puppetLintProvider_1.default();
    linter.activate(context.subscriptions);
    //vscode.languages.registerCodeActionsProvider('puppet', linter);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map