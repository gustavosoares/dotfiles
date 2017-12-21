// src/features/puppetLintProvider.ts
'use strict';
const cp = require('child_process');
const vscode = require('vscode');
class PuppetLintProvider {
    doPuppetLint(textDocument) {
        if (textDocument.languageId !== 'puppet') {
            return;
        }
        let decoded = '';
        let diagnostics = [];
        let options = vscode.workspace.rootPath ? { cwd: vscode.workspace.rootPath } : undefined;
        let childProcess = cp.spawn('puppet-lint', ["--log-format", "%{KIND}:%{line}:%{message}", textDocument.fileName], options);
        if (childProcess.pid) {
            childProcess.stdout.on('data', (data) => {
                decoded += data;
            });
            childProcess.stdout.on('end', () => {
                decoded.split("\n").forEach(item => {
                    if (item) {
                        let error = item.split(":");
                        let severity = error[0].toLowerCase() === "warning" ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error;
                        let message = "puppet-lint: " + error[0] + ": " + error[2];
                        let range = new vscode.Range(Number(error[1]) - 1, 0, Number(error[1]) - 1, 300);
                        let diagnostic = new vscode.Diagnostic(range, message, severity);
                        diagnostics.push(diagnostic);
                    }
                });
                this.diagnosticCollection.set(textDocument.uri, diagnostics);
            });
        }
    }
    activate(subscriptions) {
        // this.command = vscode.commands.registerCommand(PuppetLintProvider.commandId, this.runCodeAction, this);
        // subscriptions.push(this);
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        vscode.workspace.onDidOpenTextDocument(this.doPuppetLint, this, subscriptions);
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
            this.diagnosticCollection.delete(textDocument.uri);
        }, null, subscriptions);
        vscode.workspace.onDidSaveTextDocument(this.doPuppetLint, this);
        // puppet-lint all open Puppet documents
        vscode.workspace.textDocuments.forEach(this.doPuppetLint, this);
    }
    dispose() {
        this.diagnosticCollection.clear();
        this.diagnosticCollection.dispose();
        this.command.dispose();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PuppetLintProvider;
//# sourceMappingURL=puppetLintProvider.js.map