"use strict";
var vscode = require('vscode');
var ShowOnlineHelpRequest;
(function (ShowOnlineHelpRequest) {
    ShowOnlineHelpRequest.type = { get method() { return 'powerShell/showOnlineHelp'; } };
})(ShowOnlineHelpRequest = exports.ShowOnlineHelpRequest || (exports.ShowOnlineHelpRequest = {}));
function registerShowHelpCommand(client) {
    var disposable = vscode.commands.registerCommand('PowerShell.OnlineHelp', function () {
        var editor = vscode.window.activeTextEditor;
        var selection = editor.selection;
        var doc = editor.document;
        var cwr = doc.getWordRangeAtPosition(selection.active);
        var text = doc.getText(cwr);
        client.sendRequest(ShowOnlineHelpRequest.type, text);
    });
}
exports.registerShowHelpCommand = registerShowHelpCommand;
//# sourceMappingURL=ShowOnlineHelp.js.map