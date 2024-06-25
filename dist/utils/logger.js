"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleLogger = exports.authLogger = exports.userLogger = void 0;
const winston_1 = require("winston");
const userLogger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [new winston_1.transports.File({ filename: 'logs/user.log' })]
});
exports.userLogger = userLogger;
const authLogger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [new winston_1.transports.File({ filename: 'logs/auth.log' })]
});
exports.authLogger = authLogger;
const sampleLogger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [new winston_1.transports.File({ filename: 'logs/sample.log' })]
});
exports.sampleLogger = sampleLogger;
//# sourceMappingURL=logger.js.map