import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

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
  apis: isProduction ? ['dist/routes/*.js'] : ['src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);
const CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css';

const setupSwagger = (app: express.Express) => {
  app.use(
    '/docs',
    express.static('node_modules/swagger-ui-dist/', { index: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { customCssUrl: CSS_URL }, { explorer: true })
  );
};

export default setupSwagger;
