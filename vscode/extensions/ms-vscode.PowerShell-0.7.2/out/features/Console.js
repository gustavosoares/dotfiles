"use strict";
var vscode = require('vscode');
var EvaluateRequest;
(function (EvaluateRequest) {
    EvaluateRequest.type = { get method() { return 'evaluate'; } };
})(EvaluateRequest = exports.EvaluateRequest || (exports.EvaluateRequest = {}));
var OutputNotification;
(function (OutputNotification) {
    OutputNotification.type = { get method() { return 'output'; } };
})(OutputNotification = exports.OutputNotification || (exports.OutputNotification = {}));
var ShowChoicePromptRequest;
(function (ShowChoicePromptRequest) {
    ShowChoicePromptRequest.type = { get method() { return 'powerShell/showChoicePrompt'; } };
})(ShowChoicePromptRequest = exports.ShowChoicePromptRequest || (exports.ShowChoicePromptRequest = {}));
var ShowInputPromptRequest;
(function (ShowInputPromptRequest) {
    ShowInputPromptRequest.type = { get method() { return 'powerShell/showInputPrompt'; } };
})(ShowInputPromptRequest = exports.ShowInputPromptRequest || (exports.ShowInputPromptRequest = {}));
function showChoicePrompt(promptDetails, client) {
    var quickPickItems = promptDetails.choices.map(function (choice) {
        return {
            label: choice.label,
            description: choice.helpMessage
        };
    });
    // Shift the default item to the front of the
    // array so that the user can select it easily
    if (promptDetails.defaultChoice > -1 &&
        promptDetails.defaultChoice < promptDetails.choices.length) {
        var defaultChoiceItem = quickPickItems[promptDetails.defaultChoice];
        quickPickItems.splice(promptDetails.defaultChoice, 1);
        // Add the default choice to the head of the array
        quickPickItems = [defaultChoiceItem].concat(quickPickItems);
    }
    // For some bizarre reason, the quick pick dialog does not
    // work if I return the Thenable immediately at this point.
    // It only works if I save the thenable to a variable and
    // return the variable instead...
    var resultThenable = vscode.window
        .showQuickPick(quickPickItems, { placeHolder: promptDetails.caption + " - " + promptDetails.message })
        .then(onItemSelected);
    return resultThenable;
}
function showInputPrompt(promptDetails, client) {
    var resultThenable = vscode.window.showInputBox({
        placeHolder: promptDetails.name + ": "
    }).then(onInputEntered);
    return resultThenable;
}
function onItemSelected(chosenItem) {
    if (chosenItem !== undefined) {
        return {
            promptCancelled: false,
            chosenItem: chosenItem.label
        };
    }
    else {
        // User cancelled the prompt, send the cancellation
        return {
            promptCancelled: true,
            chosenItem: undefined
        };
    }
}
function onInputEntered(responseText) {
    if (responseText !== undefined) {
        return {
            promptCancelled: false,
            responseText: responseText
        };
    }
    else {
        return {
            promptCancelled: true,
            responseText: undefined
        };
    }
}
function registerConsoleCommands(client) {
    vscode.commands.registerCommand('PowerShell.RunSelection', function () {
        var editor = vscode.window.activeTextEditor;
        var selectionRange = undefined;
        if (!editor.selection.isEmpty) {
            selectionRange =
                new vscode.Range(editor.selection.start, editor.selection.end);
        }
        else {
            selectionRange = editor.document.lineAt(editor.selection.start.line).range;
        }
        client.sendRequest(EvaluateRequest.type, {
            expression: editor.document.getText(selectionRange)
        });
    });
    var consoleChannel = vscode.window.createOutputChannel("PowerShell Output");
    client.onNotification(OutputNotification.type, function (output) {
        var outputEditorExist = vscode.window.visibleTextEditors.some(function (editor) {
            return editor.document.languageId == 'Log';
        });
        if (!outputEditorExist)
            consoleChannel.show(vscode.ViewColumn.Three);
        consoleChannel.append(output.output);
    });
    var t;
    client.onRequest(ShowChoicePromptRequest.type, function (promptDetails) { return showChoicePrompt(promptDetails, client); });
    client.onRequest(ShowInputPromptRequest.type, function (promptDetails) { return showInputPrompt(promptDetails, client); });
}
exports.registerConsoleCommands = registerConsoleCommands;
//# sourceMappingURL=Console.js.map