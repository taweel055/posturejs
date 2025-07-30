# ProPostureFitness-JS Directory Documentation

This document provides a comprehensive overview of the ProPostureFitness-JS project's backend and node_modules directories, explaining their structure, purpose, and key components.

## Table of Contents

1. [Backend Directory Overview](#backend-directory-overview)
2. [Backend Architecture & Components](#backend-architecture--components)
3. [Node Modules Overview](#node-modules-overview)
4. [Key Dependencies Analysis](#key-dependencies-analysis)
5. [Development Dependencies](#development-dependencies)
6. [Installation & Setup](#installation--setup)

---

## Backend Directory Overview

The `/backend` directory contains a complete Node.js/Express server implementation that provides API services, real-time WebSocket communication, and database management for the ProPostureFitness application.

### Directory Structure

```
backend/
├── .env                    # Environment configuration
├── .DS_Store              # macOS system file (ignore)
├── Dockerfile             # Docker containerization config
├── package.json           # Backend dependencies and scripts
├── package-lock.json      # Exact dependency versions
├── server.js              # Main server entry point
├── node_modules/          # Backend NPM dependencies
├── config/
│   └── database.js        # Database configuration and setup
├── data/                  # SQLite database files and data
├── middleware/
│   ├── auth.js           # Authentication middleware
│   └── errorHandler.js   # Global error handling
├── routes/
│   ├── analytics.js      # Analytics API endpoints
│   ├── auth.js          # Authentication routes
│   ├── posture.js       # Posture data endpoints
│   └── users.js         # User management routes
├── scripts/              # Database migration and utility scripts
└── websocket/
    └── handler.js        # WebSocket connection management
```

### Technology Stack

**Core Framework:**
- **Express.js 4.19.2**: Web application framework for Node.js
- **Node.js 18+**: Runtime environment with ES modules support

**Database:**
- **SQLite3 5.1.7**: Lightweight, file-based SQL database
- Custom migration and seeding scripts

**Real-time Communication:**
- **Socket.IO 4.8.1**: WebSocket library for real-time bidirectional communication

**Security & Middleware:**
- **Helmet 7.1.0**: Security headers and protection
- **CORS 2.8.5**: Cross-Origin Resource Sharing configuration
- **bcryptjs 2.4.3**: Password hashing and authentication
- **jsonwebtoken 9.0.2**: JWT token generation and validation
- **express-rate-limit 7.1.5**: API rate limiting

**Development Tools:**
- **Nodemon 3.0.3**: Development server with auto-restart
- **ESLint 9.15.0**: Code linting and style enforcement
- **Prettier 3.2.4**: Code formatting
- **Vitest 3.2.4**: Testing framework

---

## Backend Architecture & Components

### 1. Server Entry Point (`server.js`)

The main server file that:
- Initializes Express application with security middleware
- Configures CORS for frontend communication
- Sets up rate limiting and compression
- Establishes WebSocket connections via Socket.IO
- Mounts API route handlers
- Initializes SQLite database
- Handles graceful shutdown

**Key Features:**
- Security-first configuration with Helmet
- MediaPipe-compatible CORS settings
- Real-time WebSocket support
- Structured error handling
- Environment-based configuration

### 2. Database Configuration (`config/database.js`)

Manages SQLite database:
- Database initialization and connection
- Table schema creation
- Migration support
- Connection pooling (if applicable)

### 3. API Routes

**Authentication Routes (`routes/auth.js`):**
- User registration and login
- JWT token generation
- Password reset functionality
- Session management

**User Routes (`routes/users.js`):**
- User profile management
- Settings and preferences
- User data CRUD operations

**Posture Routes (`routes/posture.js`):**
- Posture analysis data storage
- Session management
- Real-time posture metrics
- Historical posture data retrieval

**Analytics Routes (`routes/analytics.js`):**
- Performance metrics collection
- Usage statistics
- Progress tracking
- Data export functionality

### 4. Middleware

**Authentication Middleware (`middleware/auth.js`):**
- JWT token validation
- User authentication checks
- Route protection
- Token refresh logic

**Error Handler (`middleware/errorHandler.js`):**
- Global error catching
- Structured error responses
- Logging and monitoring
- Production-safe error messages

### 5. WebSocket Handler (`websocket/handler.js`)

Real-time communication for:
- Live posture data streaming
- Real-time notifications
- Session synchronization
- Multi-client coordination

### 6. Environment Configuration (`.env`)

Contains sensitive configuration:
- Database connection strings
- JWT secrets
- API keys
- Port configurations
- CORS origins

---

## Node Modules Overview

The project contains two separate `node_modules` directories:

1. **Root `node_modules/`**: Frontend dependencies for the Vite-based web application
2. **Backend `node_modules/`**: Server-side dependencies for the Express API

### Root Node Modules (Frontend)

Contains packages for the client-side application:

**Core Dependencies:**
- MediaPipe libraries for pose detection
- Camera and drawing utilities
- Real-time computer vision processing

**Development Dependencies:**
- Vite build system and plugins
- Testing frameworks (Vitest, Jest)
- Code quality tools (ESLint, Prettier)
- TypeScript support

---

## Key Dependencies Analysis

### Frontend Dependencies

#### MediaPipe Ecosystem
```json
{
  "@mediapipe/camera_utils": "~0.3.1640029074",
  "@mediapipe/drawing_utils": "~0.3.1620248257", 
  "@mediapipe/pose": "~0.5.1675469404"
}
```

**Purpose:** Google's MediaPipe provides the computer vision capabilities for:
- Real-time pose detection and tracking
- Camera feed processing and management
- Skeleton visualization and overlay rendering
- High-performance ML inference in the browser

**Why These Versions:** Pinned to specific tested versions for stability and compatibility with WebAssembly requirements.

### Backend Dependencies

#### Core Server Framework
```json
{
  "express": "^4.19.2",
  "socket.io": "^4.8.1",
  "sqlite3": "^5.1.7"
}
```

**Express 4.19.2:**
- Mature, production-ready web framework
- Extensive middleware ecosystem
- RESTful API support
- High performance and reliability

**Socket.IO 4.8.1:**
- Real-time bidirectional communication
- WebSocket with fallback support
- Room-based messaging for sessions
- Cross-browser compatibility

**SQLite3 5.1.7:**
- Zero-configuration database
- Perfect for desktop/local applications
- ACID compliance for data integrity
- No external database server required

#### Security & Authentication
```json
{
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "express-rate-limit": "^7.1.5"
}
```

**Security Stack Reasoning:**
- **Helmet**: Sets security headers (CSP, HSTS, etc.)
- **CORS**: Configures cross-origin policies for MediaPipe
- **bcryptjs**: Secure password hashing (pure JS, no native deps)
- **JWT**: Stateless authentication for API access
- **Rate Limiting**: Protection against abuse and DoS

#### Performance & Middleware
```json
{
  "compression": "^1.7.4",
  "morgan": "^1.10.0",
  "joi": "^17.12.2"
}
```

**Performance Optimizations:**
- **Compression**: Gzip/deflate response compression
- **Morgan**: HTTP request logging for monitoring
- **Joi**: Input validation and sanitization

---

## Development Dependencies

### Build & Development Tools

#### Frontend Development
```json
{
  "vite": "^6.0.1",
  "vite-plugin-pwa": "^0.21.1",
  "@vitest/ui": "^3.2.4"
}
```

**Vite 6.0.1:**
- Lightning-fast development server
- Hot Module Replacement (HMR)
- ES modules native support
- Optimized production builds
- MediaPipe compatibility

**PWA Plugin:**
- Service worker generation
- Offline functionality
- App manifest creation
- Cache management

#### Testing Infrastructure
```json
{
  "vitest": "^3.2.4",
  "happy-dom": "^15.11.6",
  "jsdom": "^25.0.1",
  "@types/jest": "^29.5.14"
}
```

**Testing Strategy:**
- **Vitest**: Fast unit testing with Vite integration
- **Happy-DOM/JSDOM**: Browser environment simulation
- **Jest Types**: TypeScript support for testing

#### Code Quality
```json
{
  "eslint": "^9.15.0",
  "@eslint/js": "^9.15.0",
  "prettier": "^3.3.3",
  "typescript": "^5.6.3"
}
```

**Quality Assurance:**
- **ESLint**: Code linting and consistency
- **Prettier**: Automatic code formatting
- **TypeScript**: Type checking and IntelliSense

---

## Installation & Setup

### Prerequisites
- Node.js 18.0.0 or higher
- NPM 9.0.0 or higher
- Modern browser with WebRTC support

### Installation Commands

#### Frontend Setup
```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Initialize database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Configuration

Create `.env` file in backend directory:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_PATH=./data/posture.db
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h
```

### Docker Support

The backend includes a Dockerfile for containerization:
```bash
# Build Docker image
docker build -t proposturefitness-backend .

# Run container
docker run -p 5000:5000 proposturefitness-backend
```

---

## Dependency Size Analysis

### Frontend Bundle Analysis
- **Total Size**: ~15MB (including MediaPipe WASM files)
- **Core Dependencies**: ~8MB (MediaPipe libraries)
- **Dev Dependencies**: ~7MB (build tools, not included in production)

### Backend Dependencies
- **Production**: ~25MB (including SQLite native bindings)
- **Development**: ~45MB (including testing and linting tools)

### Critical Dependencies
1. **MediaPipe libraries**: Essential for pose detection
2. **SQLite3**: Core database functionality
3. **Socket.IO**: Real-time features
4. **Express**: API framework
5. **Security middleware**: Production safety

---

## Performance Considerations

### Frontend Optimizations
- MediaPipe WASM files cached by browser
- Vite code splitting for lazy loading
- Tree shaking eliminates unused code
- Progressive Web App caching

### Backend Optimizations
- SQLite for minimal overhead
- Compression middleware for responses
- Rate limiting prevents abuse
- Connection pooling for WebSockets

---

## Security Considerations

### Frontend Security
- CSP headers prevent XSS
- HTTPS required for camera access
- MediaPipe runs in isolated context
- No sensitive data in client code

### Backend Security
- JWT authentication for API access
- bcrypt password hashing
- Rate limiting prevents brute force
- CORS configured for specific origins
- Helmet security headers
- Input validation with Joi

---

## Troubleshooting Common Issues

### SQLite3 Compilation Issues
If SQLite3 fails to compile:
```bash
npm rebuild sqlite3
# or
npm install sqlite3 --build-from-source
```

### MediaPipe Loading Issues
Ensure proper CORS headers and HTTPS for camera access:
- Check browser console for WASM loading errors
- Verify camera permissions
- Test on localhost with HTTPS enabled

### WebSocket Connection Issues
Check CORS configuration and port accessibility:
- Verify backend server is running on correct port
- Check firewall settings
- Confirm WebSocket upgrade headers

---

This documentation provides a comprehensive overview of the project's structure and dependencies. For specific implementation details, refer to the individual source files and their inline documentation.