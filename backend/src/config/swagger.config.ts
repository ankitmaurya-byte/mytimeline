import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.config';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Timeline API',
      version: '1.0.0',
      description: 'Timeline Project Management Platform API Documentation',
      contact: {
        name: 'Timeline Team',
        email: 'support@timeline-app.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: env?.BACKEND_URL || 'http://localhost:8000',
        description: env?.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth-token',
          description: 'Authentication cookie'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['success', 'message'],
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            statusCode: {
              type: 'integer',
              example: 400
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          required: ['_id', 'name', 'email'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status',
              example: true
            },
            profilePicture: {
              type: 'string',
              format: 'uri',
              description: 'Profile picture URL',
              nullable: true
            },
            isAdmin: {
              type: 'boolean',
              description: 'Admin status',
              example: false
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Workspace: {
          type: 'object',
          required: ['_id', 'name', 'owner'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Workspace name',
              example: 'My Workspace'
            },
            description: {
              type: 'string',
              description: 'Workspace description',
              nullable: true
            },
            owner: {
              type: 'string',
              description: 'Workspace owner ID',
              example: '507f1f77bcf86cd799439011'
            },
            inviteCode: {
              type: 'string',
              description: 'Workspace invite code',
              example: 'ABC123'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Project: {
          type: 'object',
          required: ['_id', 'name', 'workspace', 'createdBy'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Project name',
              example: 'Website Redesign'
            },
            description: {
              type: 'string',
              description: 'Project description',
              nullable: true
            },
            emoji: {
              type: 'string',
              description: 'Project emoji',
              example: '📊',
              default: '📊'
            },
            workspace: {
              type: 'string',
              description: 'Workspace ID',
              example: '507f1f77bcf86cd799439011'
            },
            createdBy: {
              type: 'string',
              description: 'Creator user ID',
              example: '507f1f77bcf86cd799439011'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Task: {
          type: 'object',
          required: ['_id', 'title', 'project', 'workspace', 'createdBy'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            taskCode: {
              type: 'string',
              description: 'Unique task code',
              example: 'TASK-001'
            },
            title: {
              type: 'string',
              description: 'Task title',
              example: 'Update homepage design'
            },
            description: {
              type: 'string',
              description: 'Task description',
              nullable: true
            },
            project: {
              type: 'string',
              description: 'Project ID',
              example: '507f1f77bcf86cd799439011'
            },
            workspace: {
              type: 'string',
              description: 'Workspace ID',
              example: '507f1f77bcf86cd799439011'
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'],
              default: 'TODO',
              example: 'TODO'
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              default: 'MEDIUM',
              example: 'MEDIUM'
            },
            assignedTo: {
              type: 'string',
              description: 'Assigned user ID',
              nullable: true,
              example: '507f1f77bcf86cd799439011'
            },
            createdBy: {
              type: 'string',
              description: 'Creator user ID',
              example: '507f1f77bcf86cd799439011'
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            totalCount: {
              type: 'integer',
              example: 100
            },
            pageSize: {
              type: 'integer',
              example: 10
            },
            pageNumber: {
              type: 'integer',
              example: 1
            },
            totalPages: {
              type: 'integer',
              example: 10
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      },
      {
        CookieAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Workspaces',
        description: 'Workspace management endpoints'
      },
      {
        name: 'Projects',
        description: 'Project management endpoints'
      },
      {
        name: 'Tasks',
        description: 'Task management endpoints'
      },
      {
        name: 'Health',
        description: 'System health and monitoring endpoints'
      }
    ]
  },
  apis: [
    './app/api/**/*.ts',
    './src/routes/**/*.ts',
    './src/validation/**/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
export default swaggerSpec;
