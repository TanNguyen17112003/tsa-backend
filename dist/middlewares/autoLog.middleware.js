"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAutoLog = exports.authAutoLog = void 0;
const logger_1 = require("../utils/logger");
function authAutoLog(req, res, next) {
    const originalJson = res.json;
    res.json = function (body) {
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        logger_1.authLogger.log(logLevel, 'Response sent', { path: req.path, status: res.statusCode, body });
        return originalJson.call(this, body);
    };
    next();
}
exports.authAutoLog = authAutoLog;
function userAutoLog(req, res, next) {
    const originalJson = res.json;
    res.json = function (body) {
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        logger_1.userLogger.log(logLevel, 'Response sent', { path: req.path, status: res.statusCode, body });
        return originalJson.call(this, body);
    };
    next();
}
exports.userAutoLog = userAutoLog;
//# sourceMappingURL=autoLog.middleware.js.map