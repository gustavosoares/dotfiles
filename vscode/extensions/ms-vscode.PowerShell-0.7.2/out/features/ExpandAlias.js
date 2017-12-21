"use strict";
var vscode = require('vscode');
var Window = vscode.window;
var ExpandAliasRequest;
(function (ExpandAliasRequest) {
    ExpandAliasRequest.type = { get method() { return 'powerShell/expandAlias'; } };
})(ExpandAliasRequest = exports.ExpandAliasRequest || (exports.ExpandAliasRequest = {}));
function registerExpandAliasCommand(client) {
    var disposable = vscode.commands.registerCommand('PowerShell.ExpandAlias', function () {
        var editor = Window.activeTextEditor;
        var document = editor.document;
        var selection = editor.selection;
        var text, range;
        var sls = selection.start;
        var sle = selection.end;
        if ((sls.character === sle.character) &&
            (sls.line === sle.line)) {
            text = document.getText();
            range = new vscode.Range(0, 0, document.lineCount, text.length);
        }
        else {
            text = document.getText(selection);
            range = new vscode.Range(sls.line, sls.character, sle.line, sle.character);
        }
        client.sendRequest(ExpandAliasRequest.type, text).then(function (result) {
            editor.edit(function (editBuilder) {
                editBuilder.replace(range, result);
            });
        });
    });
}
exports.registerExpandAliasCommand = registerExpandAliasCommand;
//# sourceMappingURL=ExpandAlias.js.map