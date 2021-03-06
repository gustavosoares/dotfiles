/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var os = require('os');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var utils = require('./utils');
var vscode = require('vscode');
var logging = require('./logging');
var settingsManager = require('./settings');
var string_decoder_1 = require('string_decoder');
var vscode_languageclient_1 = require('vscode-languageclient');
var ExpandAlias_1 = require('./features/ExpandAlias');
var ShowOnlineHelp_1 = require('./features/ShowOnlineHelp');
var OpenInISE_1 = require('./features/OpenInISE');
var PowerShellFindModule_1 = require('./features/PowerShellFindModule');
var Console_1 = require('./features/Console');
var ExtensionCommands_1 = require('./features/ExtensionCommands');
var net = require('net');
// NOTE: We will need to find a better way to deal with the required
//       PS Editor Services version...
var requiredEditorServicesVersion = "0.7.2";
var powerShellProcess = undefined;
var languageServerClient = undefined;
var PowerShellLanguageId = 'powershell';
var powerShellLogWriter = undefined;
function activate(context) {
    var settings = settingsManager.load('powershell');
    vscode.languages.setLanguageConfiguration(PowerShellLanguageId, {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\'\"\,\.\<\>\/\?\s]+)/g,
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
        comments: {
            lineComment: '#',
            blockComment: ['<#', '#>']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        __electricCharacterSupport: {
            docComment: { scope: 'comment.documentation', open: '/**', lineStart: ' * ', close: ' */' }
        },
        __characterPairSupport: {
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"', notIn: ['string'] },
                { open: '\'', close: '\'', notIn: ['string', 'comment'] }
            ]
        }
    });
    // Get the current version of this extension
    var hostVersion = vscode
        .extensions
        .getExtension("ms-vscode.PowerShell")
        .packageJSON
        .version;
    var bundledModulesPath = settings.developer.bundledModulesPath;
    if (!path.isAbsolute(bundledModulesPath)) {
        bundledModulesPath = path.resolve(__dirname, bundledModulesPath);
    }
    var startArgs = '-EditorServicesVersion "' + requiredEditorServicesVersion + '" ' +
        '-HostName "Visual Studio Code Host" ' +
        '-HostProfileId "Microsoft.VSCode" ' +
        '-HostVersion "' + hostVersion + '" ' +
        '-BundledModulesPath "' + bundledModulesPath + '" ';
    if (settings.developer.editorServicesWaitForDebugger) {
        startArgs += '-WaitForDebugger ';
    }
    if (settings.developer.editorServicesLogLevel) {
        startArgs += '-LogLevel "' + settings.developer.editorServicesLogLevel + '" ';
    }
    // Find the path to powershell.exe based on the current platform
    // and the user's desire to run the x86 version of PowerShell
    var powerShellExePath = undefined;
    if (os.platform() == "win32") {
        powerShellExePath =
            settings.useX86Host || !process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')
                ? process.env.windir + '\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
                : process.env.windir + '\\Sysnative\\WindowsPowerShell\\v1.0\\powershell.exe';
    }
    else if (os.platform() == "darwin") {
        powerShellExePath = "/usr/local/bin/powershell";
        // Check for OpenSSL dependency on OS X
        if (!utils.checkIfFileExists("/usr/local/lib/libcrypto.1.0.0.dylib") ||
            !utils.checkIfFileExists("/usr/local/lib/libssl.1.0.0.dylib")) {
            var thenable = vscode.window.showWarningMessage("The PowerShell extension will not work without OpenSSL on Mac OS X", "Show Documentation");
            thenable.then(function (s) {
                if (s === "Show Documentation") {
                    cp.exec("open https://github.com/PowerShell/vscode-powershell/blob/master/docs/troubleshooting.md#1-powershell-intellisense-does-not-work-cant-debug-scripts");
                }
            });
            // Don't continue initializing since Editor Services will not load successfully
            console.log("Cannot start PowerShell Editor Services due to missing OpenSSL dependency.");
            return;
        }
    }
    else {
        powerShellExePath = "/usr/bin/powershell";
    }
    // Is there a setting override for the PowerShell path?
    if (settings.developer.powerShellExePath &&
        settings.developer.powerShellExePath.trim().length > 0) {
        powerShellExePath = settings.developer.powerShellExePath;
        // If the path does not exist, show an error
        fs.access(powerShellExePath, fs.X_OK, function (err) {
            if (err) {
                vscode.window.showErrorMessage("powershell.exe cannot be found or is not accessible at path " + powerShellExePath);
            }
            else {
                startPowerShell(powerShellExePath, bundledModulesPath, startArgs);
            }
        });
    }
    else {
        startPowerShell(powerShellExePath, bundledModulesPath, startArgs);
    }
}
exports.activate = activate;
function startPowerShell(powerShellExePath, bundledModulesPath, startArgs) {
    try {
        var startScriptPath = path.resolve(__dirname, '../scripts/Start-EditorServices.ps1');
        var logBasePath = path.resolve(__dirname, "../logs");
        utils.ensurePathExists(logBasePath);
        var editorServicesLogName = logging.getLogName("EditorServices");
        var powerShellLogName = logging.getLogName("PowerShell");
        startArgs +=
            '-LogPath "' + path.resolve(logBasePath, editorServicesLogName) + '" ';
        var args = [
            '-NoProfile',
            '-NonInteractive'
        ];
        // Only add ExecutionPolicy param on Windows
        if (os.platform() == "win32") {
            args.push('-ExecutionPolicy');
            args.push('Unrestricted');
        }
        // Add the Start-EditorServices.ps1 invocation arguments
        args.push('-Command');
        args.push('& "' + startScriptPath + '" ' + startArgs);
        // Launch PowerShell as child process
        powerShellProcess = cp.spawn(powerShellExePath, args);
        // Open a log file to be used for PowerShell.exe output
        powerShellLogWriter =
            fs.createWriteStream(path.resolve(logBasePath, powerShellLogName));
        var decoder = new string_decoder_1.StringDecoder('utf8');
        powerShellProcess.stdout.on('data', function (data) {
            powerShellLogWriter.write("OUTPUT: " + data);
            var response = JSON.parse(decoder.write(data).trim());
            if (response["status"] === "started") {
                var sessionDetails = response;
                // Write out the session configuration file
                utils.writeSessionFile(sessionDetails);
                // Start the language service client
                startLanguageClient(sessionDetails.languageServicePort, powerShellLogWriter);
            }
            else {
            }
        });
        powerShellProcess.stderr.on('data', function (data) {
            console.log("powershell.exe - ERROR: " + data);
            powerShellLogWriter.write("ERROR: " + data);
        });
        powerShellProcess.on('close', function (exitCode) {
            console.log("powershell.exe terminated with exit code: " + exitCode);
            powerShellLogWriter.write("\r\npowershell.exe terminated with exit code: " + exitCode + "\r\n");
            if (languageServerClient != undefined) {
                languageServerClient.stop();
            }
        });
        console.log("powershell.exe started, pid: " + powerShellProcess.pid + ", exe: " + powerShellExePath);
        powerShellLogWriter.write("powershell.exe started --" +
            "\r\n    pid: " + powerShellProcess.pid +
            "\r\n    exe: " + powerShellExePath +
            "\r\n    bundledModulesPath: " + bundledModulesPath +
            "\r\n    args: " + startScriptPath + ' ' + startArgs + "\r\n\r\n");
    }
    catch (e) {
        vscode.window.showErrorMessage("The language service could not be started: " + e);
    }
}
function startLanguageClient(port, logWriter) {
    logWriter.write("Connecting to port: " + port + "\r\n");
    try {
        var connectFunc = function () {
            return new Promise(function (resolve, reject) {
                var socket = net.connect(port);
                socket.on('connect', function () {
                    console.log("Socket connected!");
                    resolve({ writer: socket, reader: socket });
                });
            });
        };
        var clientOptions = {
            documentSelector: [PowerShellLanguageId],
            synchronize: {
                configurationSection: PowerShellLanguageId,
            }
        };
        languageServerClient =
            new vscode_languageclient_1.LanguageClient('PowerShell Editor Services', connectFunc, clientOptions);
        languageServerClient.onReady().then(function () { return registerFeatures(); }, function (reason) { return vscode.window.showErrorMessage("Could not start language service: " + reason); });
        languageServerClient.start();
    }
    catch (e) {
        vscode.window.showErrorMessage("The language service could not be started: " + e);
    }
}
function registerFeatures() {
    // Register other features
    ExpandAlias_1.registerExpandAliasCommand(languageServerClient);
    ShowOnlineHelp_1.registerShowHelpCommand(languageServerClient);
    Console_1.registerConsoleCommands(languageServerClient);
    OpenInISE_1.registerOpenInISECommand();
    PowerShellFindModule_1.registerPowerShellFindModuleCommand(languageServerClient);
    ExtensionCommands_1.registerExtensionCommands(languageServerClient);
}
function deactivate() {
    powerShellLogWriter.write("\r\n\r\nShutting down language client...");
    // Close the language server client
    if (languageServerClient) {
        languageServerClient.stop();
        languageServerClient = undefined;
    }
    // Clean up the session file
    utils.deleteSessionFile();
    // Kill the PowerShell process we spawned
    powerShellLogWriter.write("\r\nTerminating PowerShell process...");
    powerShellProcess.kill();
}
exports.deactivate = deactivate;
//# sourceMappingURL=main.js.map