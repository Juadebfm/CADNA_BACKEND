import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CADNA Backend API',
      version: '1.0.0',
      description: 'API documentation for CADNA Backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: "Paste 'Bearer <token>' to authorize (access tokens)."
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            university: { type: 'string' },
            studentId: { type: 'string' },
            twoFAEnabled: { type: 'boolean' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './index.js'],
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };