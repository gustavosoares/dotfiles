"use strict";
var vscode = require('vscode');
var vagrant = require('./vagrant');
var path = require('path');
function ignoreError() {
}
function showError(msg) {
    return vscode.window.showErrorMessage(msg);
}
function showInfo(msg) {
    return vscode.window.showInformationMessage(msg);
}
function findVagranfiles() {
    return vscode.workspace.findFiles('**/Vagrantfile', '');
}
function getVagrantfile(fileName) {
    return new Promise(function (accept, reject) {
        accept(new vagrant.Vagrantfile(fileName));
    });
}
function getVagrantfiles(uris) {
    return Promise.all(uris.map(function (uri) { return uri.fsPath; })
        .sort()
        .map(function (fileName) { return getVagrantfile(fileName); }));
}
function getVagrantfileMachines(vagrantfile) {
    return new Promise(function (accept, reject) {
        vagrantfile.machines(function (machines, status) {
            accept({ machines: machines, status: status });
        });
    });
}
function getMachines(vagrantfiles) {
    return Promise.all(vagrantfiles.map(function (vagrantfile) { return getVagrantfileMachines(vagrantfile); }));
}
function findMachines() {
    return new Promise(function (accept, reject) {
        findVagranfiles()
            .then(getVagrantfiles)
            .then(getMachines)
            .then(accept);
    });
}
function listMachines(infos) {
    return new Promise(function (accept, reject) {
        var quickPickItems = [];
        infos.forEach(function (info) {
            info.machines.forEach(function (machine) {
                var dir = path.relative(vscode.workspace.rootPath, machine.directory);
                var status = info.status[machine.name]['state-human-short'];
                switch (info.status[machine.name]['state']) {
                    case 'not_created':
                        status = '$(x)';
                        break;
                    case 'running':
                        status = '$(triangle-right)';
                        break;
                    case 'saved':
                        status = '$(history)';
                        break;
                    case 'poweroff':
                        status = '$(primitive-square)';
                        break;
                }
                quickPickItems.push({
                    label: machine.name + " - " + status,
                    description: dir, machine: machine
                });
            });
        });
        return vscode.window.showQuickPick(quickPickItems).then(function (item) {
            if (item) {
                accept(item.machine);
            }
            else {
                reject('Operation canceled.');
            }
        }, reject);
    });
}
function listMachinesIfMultiple(infos) {
    return new Promise(function (accept, reject) {
        if (infos.length == 0) {
            reject('No machine found.');
        }
        else if (infos.length == 1 && infos[0].machines.length == 1) {
            accept(infos[0].machines[0]);
        }
        else {
            listMachines(infos).then(accept, reject);
        }
    });
}
function registerCmd(cmdName, vagrantfileAction) {
    return vscode.commands.registerCommand(cmdName, function () {
        findMachines()
            .then(listMachinesIfMultiple)
            .then(vagrantfileAction)
            .then(executeChildProcess)
            .then(showInfo);
    });
}
function executeChildProcess(proc) {
    return new Promise(function (accept, reject) {
        var commandOutput = vscode.window.createOutputChannel("Vagrant");
        commandOutput.clear();
        proc.stdout.on('data', function (data) { commandOutput.append("" + data); });
        proc.stderr.on('data', function (data) { commandOutput.append("" + data); });
        proc.on('close', function (code) {
            if (code) {
                commandOutput.show();
                reject("Vagrant exited with code " + code);
            }
            accept('Vagrant operation suceeded.');
        });
    });
}
function registerCommands(context) {
    [{ name: 'vagrant.up',
            action: function (machine) { return machine.up(); } },
        { name: 'vagrant.provision',
            action: function (machine) { return machine.provision(); } },
        { name: 'vagrant.suspend',
            action: function (machine) { return machine.suspend(); } },
        { name: 'vagrant.halt',
            action: function (machine) { return machine.halt(); } },
        { name: 'vagrant.reload',
            action: function (machine) { return machine.reload(); } },
        { name: 'vagrant.destroy',
            action: function (machine) { return machine.destroy(); } }
    ].map(function (description) {
        return registerCmd(description.name, description.action);
    }).forEach(function (disposable) {
        context.subscriptions.push(disposable);
    });
    vscode.commands.registerCommand('vagrant.status', function () {
        findMachines().then(listMachines).catch(console.log);
    });
    vscode.commands.registerCommand('vagrant.log', function () {
        var commandOutput = vscode.window.createOutputChannel("Vagrant");
        commandOutput.show();
    });
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=vagrant-extension.js.map