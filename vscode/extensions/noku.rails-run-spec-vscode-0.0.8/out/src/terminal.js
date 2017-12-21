'use strict';
const vscode = require("vscode");
let lastCommandText;
let activeTerminals = {};
const SPEC_TERMINAL_NAME = 'Running Specs';
const ZEUS_TERMINAL_NAME = 'Zeus Start';
vscode.window.onDidCloseTerminal((terminal) => {
    if (activeTerminals[terminal.name]) {
        delete activeTerminals[terminal.name];
    }
});
function runSpecFile(options = {}) {
    let editor = vscode.window.activeTextEditor, fileName = vscode.workspace.asRelativePath(options.path || editor.document.fileName);
    if (!editor || !isSpecDirectory(fileName) && !isSpec(fileName) && !options.commandText) {
        return;
    }
    let isZeusInit = isZeusActive() && !activeTerminals[ZEUS_TERMINAL_NAME];
    if (isZeusInit) {
        zeusTerminalInit();
    }
    if (isZeusInit) {
        let interval = getZeusStartTimeout();
        if (interval > 0) {
            vscode.window.showInformationMessage('Starting Zeus ...');
        }
        setTimeout(() => {
            executeInTerminal(fileName, options);
        }, interval);
    }
    else {
        executeInTerminal(fileName, options);
    }
}
exports.runSpecFile = runSpecFile;
function runLastSpec() {
    if (lastCommandText) {
        runSpecFile({ commandText: lastCommandText });
    }
}
exports.runLastSpec = runLastSpec;
function executeInTerminal(fileName, options) {
    let specTerminal = activeTerminals[SPEC_TERMINAL_NAME];
    if (!specTerminal) {
        specTerminal = vscode.window.createTerminal(SPEC_TERMINAL_NAME);
        activeTerminals[SPEC_TERMINAL_NAME] = specTerminal;
    }
    if (shouldClearTerminal()) {
        vscode.commands.executeCommand('workbench.action.terminal.clear');
    }
    specTerminal.show(shouldFreserveFocus());
    let lineNumberText = options.lineNumber ? `:${options.lineNumber}` : '', commandText = options.commandText || `${getSpecCommand()} ${fileName}${lineNumberText}`;
    specTerminal.sendText(commandText);
    lastCommandText = commandText;
}
function getSpecCommand() {
    if (customSpecCommand()) {
        return customSpecCommand();
    }
    else if (isZeusActive()) {
        return 'zeus test';
    }
    else {
        return 'bundle exec rspec';
    }
}
function shouldFreserveFocus() {
    return !vscode.workspace.getConfiguration("ruby").get('specFocusTerminal');
}
function shouldClearTerminal() {
    return vscode.workspace.getConfiguration("ruby").get('specClearTerminal');
}
function customSpecCommand() {
    return vscode.workspace.getConfiguration("ruby").get('specCommand');
}
function isZeusActive() {
    return vscode.workspace.getConfiguration("ruby").get('specGem') == "zeus";
}
function getZeusStartTimeout() {
    return vscode.workspace.getConfiguration("ruby").get('zeusStartTimeout');
}
function zeusTerminalInit() {
    let zeusTerminal = vscode.window.createTerminal(ZEUS_TERMINAL_NAME);
    activeTerminals[ZEUS_TERMINAL_NAME] = zeusTerminal;
    zeusTerminal.sendText("zeus start");
}
function isSpec(fileName) {
    return fileName.indexOf('_spec.rb') > -1;
}
function isSpecDirectory(fileName) {
    return fileName.indexOf('spec') > -1 && fileName.indexOf('.rb') == -1;
}
//# sourceMappingURL=terminal.js.map