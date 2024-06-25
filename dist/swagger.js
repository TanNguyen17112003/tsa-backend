"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Document for TSA',
            version: '1.0.0',
            description: 'API Document for TSA'
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                BearerAuth: []
            }
        ]
    },
    apis: ['dist/routes/*.js']
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css';
const setupSwagger = (app) => {
    app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, { customCssUrl: CSS_URL }));
};
exports.default = setupSwagger;
//# sourceMappingURL=swagger.js.map