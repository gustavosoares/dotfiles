"use strict";
const urlRelative = require("url-relative");
const fileUrl = require("file-url");
const url = require("url");
const path = require("path");
/** converts a server-side XDebug file URI to a local path for VS Code with respect to source root settings */
function convertDebuggerPathToClient(fileUri, localSourceRoot, serverSourceRoot) {
    if (typeof fileUri === 'string') {
        fileUri = url.parse(fileUri);
    }
    // convert the file URI to a path
    let serverPath = decodeURI(fileUri.pathname);
    // strip the trailing slash from Windows paths (indicated by a drive letter with a colon)
    const serverIsWindows = /^\/[a-zA-Z]:\//.test(serverPath);
    if (serverIsWindows) {
        serverPath = serverPath.substr(1);
    }
    let localPath;
    if (serverSourceRoot && localSourceRoot) {
        // get the part of the path that is relative to the source root
        const pathRelativeToSourceRoot = (serverIsWindows ? path.win32 : path.posix).relative(serverSourceRoot, serverPath);
        // resolve from the local source root
        localPath = path.resolve(localSourceRoot, pathRelativeToSourceRoot);
    }
    else {
        localPath = path.normalize(serverPath);
    }
    return localPath;
}
exports.convertDebuggerPathToClient = convertDebuggerPathToClient;
/** converts a local path from VS Code to a server-side XDebug file URI with respect to source root settings */
function convertClientPathToDebugger(localPath, localSourceRoot, serverSourceRoot) {
    let localFileUri = fileUrl(localPath, { resolve: false });
    let serverFileUri;
    if (serverSourceRoot && localSourceRoot) {
        let localSourceRootUrl = fileUrl(localSourceRoot, { resolve: false });
        if (!localSourceRootUrl.endsWith('/')) {
            localSourceRootUrl += '/';
        }
        let serverSourceRootUrl = fileUrl(serverSourceRoot, { resolve: false });
        if (!serverSourceRootUrl.endsWith('/')) {
            serverSourceRootUrl += '/';
        }
        // get the part of the path that is relative to the source root
        const urlRelativeToSourceRoot = urlRelative(localSourceRootUrl, localFileUri);
        // resolve from the server source root
        serverFileUri = url.resolve(serverSourceRootUrl, urlRelativeToSourceRoot);
    }
    else {
        serverFileUri = localFileUri;
    }
    return serverFileUri;
}
exports.convertClientPathToDebugger = convertClientPathToDebugger;
function isWindowsUri(path) {
    return /^file:\/\/\/[a-zA-Z]:\//.test(path);
}
function isSameUri(clientUri, debuggerUri) {
    if (isWindowsUri(clientUri) || isWindowsUri(debuggerUri)) {
        // compare case-insensitive on Windows
        return debuggerUri.toLowerCase() === clientUri.toLowerCase();
    }
    else {
        return debuggerUri === clientUri;
    }
}
exports.isSameUri = isSameUri;
//# sourceMappingURL=paths.js.map