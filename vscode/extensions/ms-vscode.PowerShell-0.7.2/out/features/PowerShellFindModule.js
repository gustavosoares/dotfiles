"use strict";
var vscode = require('vscode');
var Window = vscode.window;
var FindModuleRequest;
(function (FindModuleRequest) {
    FindModuleRequest.type = { get method() { return 'powerShell/findModule'; } };
})(FindModuleRequest = exports.FindModuleRequest || (exports.FindModuleRequest = {}));
var InstallModuleRequest;
(function (InstallModuleRequest) {
    InstallModuleRequest.type = { get method() { return 'powerShell/installModule'; } };
})(InstallModuleRequest = exports.InstallModuleRequest || (exports.InstallModuleRequest = {}));
function GetCurrentTime() {
    var timeNow = new Date();
    var hours = timeNow.getHours();
    var minutes = timeNow.getMinutes();
    var seconds = timeNow.getSeconds();
    var timeString = "" + ((hours > 12) ? hours - 12 : hours);
    timeString += ((minutes < 10) ? ":0" : ":") + minutes;
    timeString += ((seconds < 10) ? ":0" : ":") + seconds;
    timeString += (hours >= 12) ? " PM" : " AM";
    return timeString;
}
function registerPowerShellFindModuleCommand(client) {
    var disposable = vscode.commands.registerCommand('PowerShell.PowerShellFindModule', function () {
        var items = [];
        vscode.window.setStatusBarMessage(GetCurrentTime() + " Initializing...");
        client.sendRequest(FindModuleRequest.type, null).then(function (modules) {
            for (var item in modules) {
                items.push({ label: modules[item].name, description: modules[item].description });
            }
            ;
            vscode.window.setStatusBarMessage("");
            Window.showQuickPick(items, { placeHolder: "Results: (" + modules.length + ")" }).then(function (selection) {
                if (!selection) {
                    return;
                }
                switch (selection.label) {
                    default:
                        var moduleName = selection.label;
                        //vscode.window.setStatusBarMessage("Installing PowerShell Module " + moduleName, 1500);
                        client.sendRequest(InstallModuleRequest.type, moduleName);
                }
            });
        });
    });
}
exports.registerPowerShellFindModuleCommand = registerPowerShellFindModuleCommand;
//# sourceMappingURL=PowerShellFindModule.js.map