# CADNA Backend - AI-Powered Assessment & Exam Platform

A secure, scalable, and AI-driven assessment platform built with Node.js, Express, MongoDB, and Redis.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, role-based access (Student, Instructor, Admin)
- **Two-Factor Authentication**: TOTP-based 2FA with QR code setup
- **Exam Management**: Create, update, delete, and manage exams
- **Real-time Exam Sessions**: Live exam taking with auto-save and time tracking
- **AI-Powered Integrity**: Suspicious activity detection and risk scoring
- **Instant Results**: Automated grading with detailed analytics
- **Comprehensive Analytics**: Performance insights and reporting

### Security Features
- JWT-based authentication with refresh tokens
- Token blacklisting for secure logout
- Rate limiting and CORS protection
- Encrypted data storage
- Suspicious activity monitoring
- IP tracking and browser fingerprinting

### Technical Features
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for session management and performance
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Error Handling**: Centralized error handling middleware
- **Validation**: Input validation and sanitization
- **Logging**: Structured logging for monitoring

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cadna-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cadna-backend
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES=60m
   REFRESH_EXPIRES=7d
   REFRESH_COOKIE_NAME=jid
   NODE_ENV=development
   ```

4. **Start the services**
   ```bash
   # Start MongoDB (if not running as service)
   mongod
   
   # Start Redis (if not running as service)
   redis-server
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:5000/api-docs`

## 🏗️ Project Structure

```
cadna-backend/
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── examController.js
│   ├── examSessionController.js
│   ├── userController.js
│   └── analyticsController.js
├── models/               # Database models
│   ├── userModel.js
│   ├── examModel.js
│   ├── examSessionModel.js
│   ├── resultModel.js
│   └── analyticsModel.js
├── routes/               # API routes
│   ├── authRoutes.js
│   ├── examRoutes.js
│   ├── examSessionRoutes.js
│   ├── userRoutes.js
│   └── analyticsRoutes.js
├── middleware/           # Custom middleware
│   ├── AuthMiddleware.js
│   ├── RoleMiddleware.js
│   └── ErrorMiddleware.js
├── db/                   # Database connections
│   ├── db.js
│   └── redis.js
├── utils/                # Utility functions
│   └── generateToken.js
├── .env                  # Environment variables
├── index.js              # Application entry point
├── swagger.js            # API documentation config
└── package.json
```

## 🔐 Authentication & Authorization

### User Roles
- **Student**: Can take exams, view results
- **Instructor**: Can create/manage exams, view analytics
- **Admin**: Full system access

### Authentication Flow
1. **Registration/Login**: Returns access token + refresh token (httpOnly cookie)
2. **2FA Setup**: Optional TOTP-based two-factor authentication
3. **Token Refresh**: Automatic token rotation for security
4. **Logout**: Token blacklisting and cookie clearing

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-2fa-login` - Complete 2FA login
- `POST /api/auth/setup-2fa` - Setup 2FA
- `POST /api/auth/verify-2fa-enable` - Enable 2FA
- `POST /api/auth/disable-2fa` - Disable 2FA
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Exams
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get single exam
- `POST /api/exams` - Create exam (Instructor/Admin)
- `PUT /api/exams/:id` - Update exam (Instructor/Admin)
- `DELETE /api/exams/:id` - Delete exam (Instructor/Admin)
- `POST /api/exams/:id/enroll` - Enroll in exam
- `POST /api/exams/:id/start` - Start exam session

### Exam Sessions
- `GET /api/exam-sessions/:id` - Get session details
- `POST /api/exam-sessions/:id/answer` - Submit answer
- `POST /api/exam-sessions/:id/submit` - Submit exam
- `POST /api/exam-sessions/:id/auto-submit` - Auto-submit (time up)
- `POST /api/exam-sessions/:id/flag-activity` - Flag suspicious activity

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/:id/results` - Get user results
- `GET /api/users/:id/sessions` - Get user sessions

### Analytics
- `GET /api/analytics/exam/:examId` - Get exam analytics
- `GET /api/analytics/instructor/dashboard` - Instructor dashboard
- `GET /api/analytics/admin/dashboard` - Admin dashboard

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cadna-backend
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-production-jwt-secret
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Configuration

### MongoDB Indexes
The application automatically creates necessary indexes for optimal performance:
- User email (unique)
- Exam instructor + isActive
- ExamSession exam + student
- Result student + exam

### Redis Usage
- Session caching for active exam sessions
- Token blacklisting for security
- Performance optimization for frequently accessed data

## 🛡️ Security Best Practices

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited
- **CORS**: Configured for specific origins
- **Helmet**: Security headers middleware
- **JWT Security**: Short-lived access tokens with refresh rotation
- **Password Hashing**: bcrypt with salt rounds
- **2FA Support**: TOTP-based two-factor authentication

## 📈 Monitoring & Analytics

### AI-Powered Features
- **Fraud Detection**: Suspicious activity monitoring
- **Risk Scoring**: Automated risk assessment
- **Performance Analytics**: Detailed exam insights
- **Behavioral Analysis**: User interaction patterns

### Metrics Tracked
- Exam completion rates
- Average scores and pass rates
- Time spent per question
- Suspicious activity incidents
- System performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api-docs`

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - Exam management system
  - Real-time exam sessions
  - Analytics and reporting
  - AI-powered integrity features