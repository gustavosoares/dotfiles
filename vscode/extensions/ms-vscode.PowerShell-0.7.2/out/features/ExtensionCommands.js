"use strict";
var vscode = require('vscode');
var path = require('path');
var extensionCommands = [];
var InvokeExtensionCommandRequest;
(function (InvokeExtensionCommandRequest) {
    InvokeExtensionCommandRequest.type = { get method() { return 'powerShell/invokeExtensionCommand'; } };
})(InvokeExtensionCommandRequest = exports.InvokeExtensionCommandRequest || (exports.InvokeExtensionCommandRequest = {}));
var ExtensionCommandAddedNotification;
(function (ExtensionCommandAddedNotification) {
    ExtensionCommandAddedNotification.type = { get method() { return 'powerShell/extensionCommandAdded'; } };
})(ExtensionCommandAddedNotification = exports.ExtensionCommandAddedNotification || (exports.ExtensionCommandAddedNotification = {}));
function addExtensionCommand(command) {
    extensionCommands.push({
        name: command.name,
        displayName: command.displayName
    });
}
function showExtensionCommands(client) {
    // If no extension commands are available, show a message
    if (extensionCommands.length == 0) {
        vscode.window.showInformationMessage("No extension commands have been loaded into the current session.");
        return;
    }
    var quickPickItems = extensionCommands.map(function (command) {
        return {
            label: command.displayName,
            description: "",
            command: command
        };
    });
    vscode.window
        .showQuickPick(quickPickItems, { placeHolder: "Select a command" })
        .then(function (command) { return onCommandSelected(command, client); });
}
function onCommandSelected(chosenItem, client) {
    if (chosenItem !== undefined) {
        client.sendRequest(InvokeExtensionCommandRequest.type, { name: chosenItem.command.name,
            context: getEditorContext() });
    }
}
// ---------- Editor Operations ----------
function asRange(value) {
    if (value === undefined) {
        return undefined;
    }
    else if (value === null) {
        return null;
    }
    return { start: asPosition(value.start), end: asPosition(value.end) };
}
function asPosition(value) {
    if (value === undefined) {
        return undefined;
    }
    else if (value === null) {
        return null;
    }
    return { line: value.line, character: value.character };
}
function asCodeRange(value) {
    if (value === undefined) {
        return undefined;
    }
    else if (value === null) {
        return null;
    }
    return new vscode.Range(asCodePosition(value.start), asCodePosition(value.end));
}
exports.asCodeRange = asCodeRange;
function asCodePosition(value) {
    if (value === undefined) {
        return undefined;
    }
    else if (value === null) {
        return null;
    }
    return new vscode.Position(value.line, value.character);
}
exports.asCodePosition = asCodePosition;
function getEditorContext() {
    return {
        currentFilePath: vscode.window.activeTextEditor.document.fileName,
        cursorPosition: asPosition(vscode.window.activeTextEditor.selection.active),
        selectionRange: asRange(new vscode.Range(vscode.window.activeTextEditor.selection.start, vscode.window.activeTextEditor.selection.end))
    };
}
var GetEditorContextRequest;
(function (GetEditorContextRequest) {
    GetEditorContextRequest.type = { get method() { return 'editor/getEditorContext'; } };
})(GetEditorContextRequest = exports.GetEditorContextRequest || (exports.GetEditorContextRequest = {}));
var EditorOperationResponse;
(function (EditorOperationResponse) {
    EditorOperationResponse[EditorOperationResponse["Unsupported"] = 0] = "Unsupported";
    EditorOperationResponse[EditorOperationResponse["Completed"] = 1] = "Completed";
})(EditorOperationResponse || (EditorOperationResponse = {}));
var InsertTextRequest;
(function (InsertTextRequest) {
    InsertTextRequest.type = { get method() { return 'editor/insertText'; } };
})(InsertTextRequest = exports.InsertTextRequest || (exports.InsertTextRequest = {}));
function insertText(details) {
    var edit = new vscode.WorkspaceEdit();
    edit.set(vscode.Uri.parse(details.filePath), [
        new vscode.TextEdit(new vscode.Range(details.insertRange.start.line, details.insertRange.start.character, details.insertRange.end.line, details.insertRange.end.character), details.insertText)
    ]);
    vscode.workspace.applyEdit(edit);
    return EditorOperationResponse.Completed;
}
var SetSelectionRequest;
(function (SetSelectionRequest) {
    SetSelectionRequest.type = { get method() { return 'editor/setSelection'; } };
})(SetSelectionRequest = exports.SetSelectionRequest || (exports.SetSelectionRequest = {}));
function setSelection(details) {
    vscode.window.activeTextEditor.selections = [
        new vscode.Selection(asCodePosition(details.selectionRange.start), asCodePosition(details.selectionRange.end))
    ];
    return EditorOperationResponse.Completed;
}
var OpenFileRequest;
(function (OpenFileRequest) {
    OpenFileRequest.type = { get method() { return 'editor/openFile'; } };
})(OpenFileRequest = exports.OpenFileRequest || (exports.OpenFileRequest = {}));
function openFile(filePath) {
    // Make sure the file path is absolute
    if (!path.win32.isAbsolute(filePath)) {
        filePath = path.win32.resolve(vscode.workspace.rootPath, filePath);
    }
    var promise = vscode.workspace.openTextDocument(filePath)
        .then(function (doc) { return vscode.window.showTextDocument(doc); })
        .then(function (_) { return EditorOperationResponse.Completed; });
    return promise;
}
function registerExtensionCommands(client) {
    vscode.commands.registerCommand('PowerShell.ShowAdditionalCommands', function () {
        var editor = vscode.window.activeTextEditor;
        var start = editor.selection.start;
        var end = editor.selection.end;
        if (editor.selection.isEmpty) {
            start = new vscode.Position(start.line, 0);
        }
        showExtensionCommands(client);
    });
    client.onNotification(ExtensionCommandAddedNotification.type, function (command) { return addExtensionCommand(command); });
    client.onRequest(GetEditorContextRequest.type, function (details) { return getEditorContext(); });
    client.onRequest(InsertTextRequest.type, function (details) { return insertText(details); });
    client.onRequest(SetSelectionRequest.type, function (details) { return setSelection(details); });
    client.onRequest(OpenFileRequest.type, function (filePath) { return openFile(filePath); });
}
exports.registerExtensionCommands = registerExtensionCommands;
//# sourceMappingURL=ExtensionCommands.js.map