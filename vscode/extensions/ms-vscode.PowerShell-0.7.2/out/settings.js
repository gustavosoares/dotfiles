/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
function load(myPluginId) {
    var configuration = vscode.workspace.getConfiguration(myPluginId);
    var defaultScriptAnalysisSettings = {
        enable: true,
        settingsPath: ""
    };
    var defaultDeveloperSettings = {
        powerShellExePath: undefined,
        bundledModulesPath: "../modules/",
        editorServicesLogLevel: "Normal",
        editorServicesWaitForDebugger: false
    };
    return {
        useX86Host: configuration.get("useX86Host", false),
        enableProfileLoading: configuration.get("enableProfileLoading", false),
        scriptAnalysis: configuration.get("scriptAnalysis", defaultScriptAnalysisSettings),
        developer: configuration.get("developer", defaultDeveloperSettings)
    };
}
exports.load = load;
//# sourceMappingURL=settings.js.map