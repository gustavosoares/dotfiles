"use strict";
var childProcess = require('child_process');
var path = require('path');
var OutputParser = (function () {
    function OutputParser() {
    }
    OutputParser.unescapeString = function (str) {
        return str
            .replace(/%!\(VAGRANT_COMMA\)/g, ',')
            .replace(/\\n/g, '\n');
    };
    return OutputParser;
}());
exports.OutputParser = OutputParser;
var Command = (function () {
    function Command() {
    }
    Command.spawn = function (args, cwd) {
        return childProcess.spawn('vagrant', ['--no-color'].concat(args), { cwd: cwd });
    };
    Command.exec = function (args, cwd, callback) {
        childProcess.exec('vagrant --no-color ' + args.join(' '), { cwd: cwd }, callback);
    };
    Command.status = function (cwd, machine, callback) {
        Command.exec(['status', '--machine-readable'], cwd, function (error, stdout, stderr) {
            if (error)
                throw error;
            var obj = {};
            stdout.toString()
                .split(/\r?\n/)
                .map(function (line) { return line.trim(); })
                .filter(function (line) { return line.length > 0; })
                .map(function (line) { return line.split(','); })
                .map(function (row) {
                var unescaped = [];
                row.forEach(function (cell) {
                    unescaped.push(OutputParser.unescapeString(cell));
                });
                return unescaped;
            })
                .forEach(function (row) {
                if (row[1].length > 0) {
                    if (!Object.prototype.hasOwnProperty.call(obj, row[1])) {
                        obj[row[1]] = {};
                    }
                    obj[row[1]][row[2]] = row[3];
                }
            });
            callback(obj);
        });
    };
    Command.up = function (cwd, machine, provision) {
        var args = ['up'];
        if (machine)
            args.push(machine);
        if (provision)
            args.push('--provision');
        return this.spawn(args, cwd);
    };
    Command.provision = function (cwd, machine) {
        var args = ['provision'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    };
    Command.suspend = function (cwd, machine) {
        var args = ['suspend'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    };
    Command.halt = function (cwd, machine) {
        var args = ['halt'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    };
    Command.reload = function (cwd, machine, provision) {
        var args = ['reload'];
        if (machine)
            args.push(machine);
        if (provision)
            args.push('--provision');
        return this.spawn(args, cwd);
    };
    Command.destroy = function (cwd, machine) {
        var args = ['destroy', '-f'];
        if (machine)
            args.push(machine);
        return this.spawn(args, cwd);
    };
    Command.ssh = function (commands, cwd, machine) {
        var args = ['ssh'];
        if (machine)
            args.push(machine);
        if (commands) {
            commands.forEach(function (cmd) {
                args.push('-c');
                args.push(cmd);
            });
        }
        return this.spawn(args, cwd);
    };
    Command.winrm = function (commands, cwd, machine, shell) {
        var args = ['winrm'];
        if (machine)
            args.push(machine);
        if (shell) {
            args.push('-s');
            args.push(shell);
        }
        if (commands) {
            commands.forEach(function (cmd) {
                args.push('-c');
                args.push(cmd);
            });
        }
        return this.spawn(args, cwd);
    };
    return Command;
}());
exports.Command = Command;
var Vagrantfile = (function () {
    function Vagrantfile(file) {
        this._file = file;
    }
    Object.defineProperty(Vagrantfile.prototype, "fileName", {
        get: function () {
            return this._file;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Vagrantfile.prototype, "directory", {
        get: function () {
            return path.dirname(this.fileName);
        },
        enumerable: true,
        configurable: true
    });
    Vagrantfile.prototype.status = function (machine, callback) {
        Command.status(this.directory, machine, callback);
    };
    Vagrantfile.prototype.machines = function (callback) {
        var _this = this;
        this.status(null, function (status) {
            callback(Object.keys(status).map(function (key) {
                return new Machine(key, _this.directory);
            }), status);
        });
    };
    Vagrantfile.prototype.up = function (machine, provision) {
        return Command.up(this.directory, machine, provision);
    };
    Vagrantfile.prototype.provision = function (machine) {
        return Command.provision(this.directory, machine);
    };
    Vagrantfile.prototype.suspend = function (machine) {
        return Command.suspend(this.directory, machine);
    };
    Vagrantfile.prototype.halt = function (machine) {
        return Command.halt(this.directory, machine);
    };
    Vagrantfile.prototype.reload = function (machine, provision) {
        return Command.reload(this.directory, machine, provision);
    };
    Vagrantfile.prototype.destroy = function (machine) {
        return Command.destroy(this.directory, machine);
    };
    Vagrantfile.prototype.ssh = function (commands, machine) {
        return Command.ssh(commands, this.directory, machine);
    };
    Vagrantfile.prototype.winrm = function (commands, machine, shell) {
        return Command.winrm(commands, this.directory, machine, shell);
    };
    return Vagrantfile;
}());
exports.Vagrantfile = Vagrantfile;
var Machine = (function () {
    function Machine(name, directory) {
        this._name = name;
        this._directory = directory;
    }
    Object.defineProperty(Machine.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Machine.prototype, "directory", {
        get: function () {
            return this._directory;
        },
        enumerable: true,
        configurable: true
    });
    Machine.prototype.status = function (callback) {
        var _this = this;
        Command.status(this.directory, this.name, function (status) {
            callback(status[_this.name]);
        });
    };
    Machine.prototype.up = function (provision) {
        return Command.up(this.directory, this.name, provision);
    };
    Machine.prototype.provision = function () {
        return Command.provision(this.directory, this.name);
    };
    Machine.prototype.suspend = function () {
        return Command.suspend(this.directory, this.name);
    };
    Machine.prototype.halt = function () {
        return Command.halt(this.directory, this.name);
    };
    Machine.prototype.reload = function (provision) {
        return Command.reload(this.directory, this.name, provision);
    };
    Machine.prototype.destroy = function () {
        return Command.destroy(this.directory, this.name);
    };
    Machine.prototype.ssh = function (commands) {
        return Command.ssh(commands, this.directory, this.name);
    };
    Machine.prototype.winrm = function (commands, shell) {
        return Command.winrm(commands, this.directory, this.name, shell);
    };
    return Machine;
}());
exports.Machine = Machine;
//# sourceMappingURL=vagrant.js.map