'use strict';
const vscode = require("vscode");
const child_process_1 = require("child_process");
const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
function fmt(execPath, text) {
    return new Promise((resolve, reject) => {
        const child = child_process_1.exec(execPath + ' fmt -', {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024,
        }, (error, stdout, stderr) => {
            if (error) {
                reject(stderr);
            }
            else {
                resolve(stdout);
            }
        });
        child.stdin.write(text);
        child.stdin.end();
    });
}
function activate(context) {
    let ignoreNextSave = new WeakSet();
    var onSave = vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.languageId !== 'terraform' || ignoreNextSave.has(document)) {
            return;
        }
        let terraformConfig = vscode.workspace.getConfiguration('terraform');
        let textEditor = vscode.window.activeTextEditor;
        if (terraformConfig['formatOnSave'] && textEditor.document === document) {
            const range = fullRange(document);
            fmt(terraformConfig['path'], document.getText())
                .then((formattedText) => {
                textEditor.edit((editor) => {
                    editor.replace(range, formattedText);
                });
            }).then((applied) => {
                ignoreNextSave.add(document);
                return document.save();
            }).then(() => {
                ignoreNextSave.delete(document);
            }).catch((e) => {
                vscode.window.showErrorMessage(e);
            });
        }
    });
    context.subscriptions.push(onSave);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map