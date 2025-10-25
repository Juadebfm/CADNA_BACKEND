import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CADNA Backend API",
      version: "1.0.0",
      description: "API documentation for CADNA Backend",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      {
        url: "https://cadna-backend.onrender.com",
        description: "Production server",
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste 'Bearer <token>' to authorize (access tokens).",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["student", "instructor", "admin"] },
            university: { type: "string" },
            studentId: { type: "string" },
            twoFAEnabled: { type: "boolean" },
            isActive: { type: "boolean" },
          },
        },
        Question: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "multiple-choice",
                "true-false",
                "short-answer",
                "essay",
                "code",
              ],
            },
            question: { type: "string" },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  isCorrect: { type: "boolean" },
                },
              },
            },
            correctAnswer: { type: "string" },
            points: { type: "number" },
            difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
            category: { type: "string" },
          },
        },
        Exam: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            instructor: { $ref: "#/components/schemas/User" },
            questions: {
              type: "array",
              items: { $ref: "#/components/schemas/Question" },
            },
            settings: {
              type: "object",
              properties: {
                timeLimit: { type: "number" },
                passingScore: { type: "number" },
                randomizeQuestions: { type: "boolean" },
                antiCheating: { type: "boolean" },
                autoGrading: { type: "boolean" },
              },
            },
            schedule: {
              type: "object",
              properties: {
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
              },
            },
            isActive: { type: "boolean" },
            category: { type: "string" },
          },
        },
        ExamSession: {
          type: "object",
          properties: {
            id: { type: "string" },
            exam: { type: "string" },
            student: { type: "string" },
            status: {
              type: "string",
              enum: ["in-progress", "submitted", "auto-submitted", "cancelled"],
            },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            timeRemaining: { type: "number" },
            score: {
              type: "object",
              properties: {
                total: { type: "number" },
                percentage: { type: "number" },
                passed: { type: "boolean" },
              },
            },
          },
        },
        Result: {
          type: "object",
          properties: {
            id: { type: "string" },
            exam: { $ref: "#/components/schemas/Exam" },
            student: { $ref: "#/components/schemas/User" },
            score: {
              type: "object",
              properties: {
                totalPoints: { type: "number" },
                earnedPoints: { type: "number" },
                percentage: { type: "number" },
                passed: { type: "boolean" },
              },
            },
            analytics: {
              type: "object",
              properties: {
                timeSpent: { type: "number" },
                questionsAttempted: { type: "number" },
                questionsCorrect: { type: "number" },
              },
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                accessToken: { type: "string" },
              },
            },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            data: {
              type: "object",
              properties: {
                pagination: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    limit: { type: "number" },
                    total: { type: "number" },
                    pages: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./routes/*.js", "./index.js"],
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
