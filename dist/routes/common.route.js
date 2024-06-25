"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonRouter = void 0;
const express_1 = require("express");
const auth_route_1 = require("./auth.route");
const sample_route_1 = require("./sample.route");
const user_route_1 = require("./user.route");
const commonRouter = (0, express_1.Router)();
exports.commonRouter = commonRouter;
commonRouter.use('/auth', auth_route_1.authRouter);
commonRouter.use('/samples', sample_route_1.sampleRouter);
commonRouter.use('/users', user_route_1.userRouter);
//# sourceMappingURL=common.route.js.map