# ProPostureFitness - Full-Stack JavaScript Application

A comprehensive posture analysis application with real-time monitoring, user accounts, data persistence, and analytics. Built with modern JavaScript, Node.js, and SQLite.

## 🌟 Features

### Frontend
- **Real-time Posture Analysis** with MediaPipe
- **Three Analysis Modes**: Basic, Advanced, GPU-accelerated
- **WebSocket Real-time Updates**
- **Ultra-optimized Performance** with dynamic loading
- **Progressive Web App** capabilities
- **Responsive Design** for all devices

### Backend
- **Node.js Express API** with REST endpoints
- **SQLite Database** with comprehensive schema
- **JWT Authentication** with refresh tokens
- **WebSocket Support** for real-time communication
- **User Management** with profiles and preferences
- **Analytics Dashboard** with progress tracking
- **Session Management** with detailed metrics

### Full-Stack Integration
- **User Authentication** with login/register
- **Real-time Data Sync** via WebSocket
- **Session Persistence** with cloud backup
- **Analytics & Progress Tracking**
- **Goal Setting & Achievement**
- **Notification System**

## 🚀 Quick Start

### Option 1: Full-Stack Docker Setup (Recommended)

```bash
# Start complete application with Docker
./start-fullstack.sh
```

This will:
- Build and start both frontend and backend
- Initialize SQLite database with demo data
- Set up WebSocket connections
- Available at http://localhost:3000 (frontend) and http://localhost:5000 (backend)

### Option 2: Development Mode

```bash
# Terminal 1: Start Backend
./start-backend.sh

# Terminal 2: Start Frontend
npm run dev
```

### Option 3: Individual Services

```bash
# Backend only
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend only
npm install
npm run dev
```

## 📋 Requirements

- **Node.js 18+**
- **Docker & Docker Compose** (for full-stack setup)
- **Modern Browser** with WebRTC support
- **Camera Access** for posture analysis

## 🗄️ Database Schema

### Users
- Profile management with preferences
- Authentication with JWT tokens
- Goal setting and tracking
- Statistics and analytics

### Posture Sessions
- Real-time posture data storage
- Session metadata and notes
- Performance metrics
- Analysis results

### Analytics
- Daily/weekly/monthly aggregates
- Progress tracking
- Goal achievement
- Trend analysis

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
DATABASE_PATH=./data/proposturefitness.db
```

**Frontend**:
```bash
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

## 🎯 Demo Account

```
Email: demo@proposturefitness.com
Password: demo123456
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - User statistics
- `GET /api/users/goals` - User goals
- `POST /api/users/goals` - Create goal

### Posture Data
- `GET /api/posture/sessions` - Get sessions
- `POST /api/posture/sessions` - Create session
- `PUT /api/posture/sessions/:id` - Update session
- `POST /api/posture/data` - Add posture data
- `GET /api/posture/sessions/:id/data` - Get session data

### Analytics
- `GET /api/analytics/dashboard` - Analytics dashboard
- `GET /api/analytics/progress` - Progress tracking
- `GET /api/analytics/posture-analysis` - Detailed analysis

## 🔌 WebSocket Events

### Client → Server
- `join_session` - Join posture session
- `posture_stream_start` - Start streaming data
- `posture_data_stream` - Send real-time data
- `goal_progress_update` - Update goal progress

### Server → Client
- `posture_data` - Real-time posture updates
- `posture_alert` - Poor posture notifications
- `goal_achieved` - Goal achievement notifications
- `session_ended` - Session completion

## 🏗️ Architecture

```
Frontend (React/Vite)
├── MediaPipe Integration
├── WebSocket Client
├── API Service Layer
└── Authentication Manager

Backend (Node.js/Express)
├── REST API Routes
├── WebSocket Handler
├── SQLite Database
├── JWT Authentication
└── Real-time Analytics

Infrastructure
├── Docker Containers
├── Nginx Reverse Proxy
├── Database Persistence
└── Health Monitoring
```

## 📈 Performance Features

- **Ultra-optimized MediaPipe Loading** with intelligent caching
- **Code Splitting** with dynamic imports
- **WebSocket Compression** for real-time data
- **Database Indexing** for fast queries
- **Memory Management** with automatic cleanup
- **Progressive Enhancement** with fallbacks

## 🔒 Security Features

- **JWT Authentication** with secure tokens
- **CORS Protection** with environment-specific origins
- **Rate Limiting** on API endpoints
- **Input Validation** with Joi schemas
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with Content Security Policy

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
npm test

# E2E tests
npm run test:e2e
```

## 📦 Deployment

### Production Docker Deployment

```bash
# Build production images
cd deployment
docker-compose up --build -d

# Monitor services
docker-compose logs -f
```

### Manual Deployment

```bash
# Build frontend
npm run build

# Start backend
cd backend
npm start

# Serve frontend with nginx
# Configure nginx to serve dist/ folder
```

## 🛠️ Development

### Adding New Features

1. **Backend**: Add routes in `backend/routes/`
2. **Frontend**: Update `js/apiService.js`
3. **Database**: Add migrations in `backend/scripts/`
4. **WebSocket**: Update `backend/websocket/handler.js`

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run typecheck
```

## 📚 Documentation

- **API Documentation**: Available at `/api/docs` when server is running
- **WebSocket Events**: See `backend/websocket/handler.js`
- **Database Schema**: See `backend/config/database.js`
- **Frontend Architecture**: See `js/` directory structure

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**Camera not working**:
- Ensure HTTPS or localhost
- Check browser permissions
- Verify WebRTC support

**Backend connection failed**:
- Check if backend is running on port 5000
- Verify CORS configuration
- Check network connectivity

**Database issues**:
- Ensure SQLite is installed
- Check file permissions
- Run database migration

**WebSocket not connecting**:
- Verify Socket.IO version compatibility
- Check authentication token
- Monitor browser console for errors

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check service health
curl http://localhost:5000/health
curl http://localhost:3000
```

## 📞 Support

For issues and support:
1. Check existing issues in repository
2. Create new issue with reproduction steps
3. Include browser/system information
4. Provide error logs and screenshots

---

Built with ❤️ using JavaScript, Node.js, MediaPipe, and modern web technologies.