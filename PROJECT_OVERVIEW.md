# 🚀 CodeStreak Tracker - Project Overview

> **Comprehensive documentation for the complete CodeStreak Tracker ecosystem**

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Module Documentation](#module-documentation)
5. [Development Workflow](#development-workflow)
6. [Deployment Guide](#deployment-guide)
7. [API Reference](#api-reference)
8. [Contributing](#contributing)

## 🎯 Project Overview

CodeStreak Tracker is a comprehensive coding activity tracking and gamification platform that transforms the coding learning experience. Similar to Duolingo's approach to language learning, it provides real-time tracking, progress analytics, and achievement systems to motivate consistent coding practice.

### 💡 Our Unique Approach

We recognize the fast-evolving learning landscape that provides everyone with plenty of opportunities to study, learn, and become a better engineer. However, what's missing is a **platform-independent system** to incentivize and nudge people to come back every day and embrace continuous learning.

**Imagine your friends talking about their 300-day programming streak instead of just their latest project!** 

CodeStreak Tracker bridges this gap by creating a unified gamification layer that works across all coding platforms - whether you're solving LeetCode problems, contributing to GitHub repositories, or learning from Stack Overflow. We transform the solitary act of coding into a social, engaging, and habit-forming experience that encourages daily practice and continuous improvement.

### 🌟 Key Features

- **🔍 Real-time Activity Tracking**: Monitors coding activity across popular platforms
- **📊 Advanced Analytics**: Provides detailed insights into coding patterns and productivity
- **🎮 Gamification System**: XP points, streaks, achievements, and leaderboards
- **📈 Progress Visualization**: Interactive dashboards showing coding trends
- **🔗 Cross-Platform Integration**: Seamlessly tracks activity across multiple platforms

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Chrome Extension]
        B[React Frontend]
    end
    
    subgraph "API Layer"
        C[Firebase Cloud Functions]
        D[RESTful APIs]
    end
    
    subgraph "Data Layer"
        E[Firestore Database]
        F[Cloud Storage]
    end
    
    subgraph "Processing Layer"
        G[Session Processor]
        H[Analytics Engine]
        I[Gamification Engine]
    end
    
    A --> C
    B --> D
    C --> E
    C --> F
    C --> G
    G --> H
    G --> I
    H --> E
    I --> E
```

## 🛠️ Technology Stack

### **Google Cloud Technologies**

#### 🔥 **Firebase Suite**
- **Firebase Cloud Functions**: Serverless backend processing
- **Firestore Database**: NoSQL document database
- **Firebase Hosting**: Global CDN for frontend

#### ☁️ **Google Cloud Platform**
- **Cloud Run**: Containerized deployment (via Firebase Functions)
- **Cloud Logging**: Centralized logging (via Firebase)

#### 🌐 **Chrome Extension Platform**
- **Chrome Extension Manifest V3**: Modern extension architecture
- **Chrome APIs**: Tab management, storage, and messaging
- **Chrome Web Store**: Distribution platform

### **Frontend Technologies**
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI primitives for shadcn/ui components
- **Lucide React**: Beautiful icon library
- **Recharts**: Composable charting library
- **React Query**: Data fetching and caching
- **Date-fns**: Date manipulation utilities

### **Backend Technologies**
- **Node.js 18**: Runtime environment
- **TypeScript**: Type-safe development
- **Zod**: Runtime validation and schema definition
- **Firebase Admin SDK**: Server-side Firebase integration
- **ESLint**: Code linting and formatting

## 📁 Module Documentation

### 🔌 [Chrome Extension](./chrome-plugin/README.md)
- **Purpose**: Real-time activity tracking and session management
- **Technology**: Chrome Extension Manifest V3, JavaScript ES6+
- **Key Features**: Activity monitoring, session grouping, manual controls
- **APIs**: Chrome APIs, Firebase SDK

### ⚡ [Firebase Cloud Functions](./functions/README.md)
- **Purpose**: Serverless backend processing and API endpoints
- **Technology**: Node.js, TypeScript, Firebase Cloud Functions
- **Key Features**: Data processing, gamification, analytics
- **APIs**: RESTful endpoints, Firestore triggers

### 🎨 [React Frontend](./frontend/README.md)
- **Purpose**: Interactive dashboard and user interface
- **Technology**: React 18, TypeScript, Vite, Tailwind CSS
- **Key Features**: Data visualization, progress tracking, gamification UI
- **APIs**: RESTful API integration, React Query

### 🌐 [Firebase Hosting](./hosting/README.md)
- **Purpose**: Global CDN hosting for web application
- **Technology**: Firebase Hosting, Global CDN
- **Key Features**: Fast delivery, SSL certificates, custom domains
- **APIs**: Firebase CLI, deployment automation

## 🔄 Development Workflow

### **Local Development**

1. **Setup Environment**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/codestreak-tracker.git
   cd codestreak-tracker
   
   # Install dependencies
   cd functions && npm install
   cd ../frontend && npm install
   cd ../chrome-plugin && npm install
   ```

2. **Start Development Servers**
   ```bash
   # Backend (Firebase Functions)
   cd functions && npm run serve
   
   # Frontend (React)
   cd frontend && npm run dev
   
   # Chrome Extension
   # Load unpacked extension in Chrome
   ```

3. **Run Tests**
   ```bash
   # Backend tests
   cd functions && npm test
   
   # Frontend tests
   cd frontend && npm test
   ```

### **Code Quality**

- **TypeScript**: Full type safety across all modules
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for quality assurance

## 🚀 Deployment Guide

### **Firebase Functions Deployment**

```bash
cd functions
npm run build
firebase deploy --only functions
```

### **Frontend Deployment**

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### **Chrome Extension Deployment**

1. **Build for Production**
   ```bash
   cd chrome-plugin
   # No build step required - pure JavaScript
   ```

2. **Package for Chrome Web Store**
   ```bash
   zip -r codestreak-extension.zip chrome-plugin/
   ```

3. **Submit to Chrome Web Store**
   - Upload package through Chrome Web Store Developer Dashboard
   - Complete store listing and screenshots
   - Submit for review

## 📖 API Reference

### **Authentication**
All APIs use mock token authentication for demo purposes:
```
Authorization: Bearer mock_token_anonymous_1757385512613
```

### **Endpoints**

#### **Data Ingestion**
- `POST /ingest` - Receive session data from Chrome extension

#### **Data Retrieval**
- `GET /getSessions` - Retrieve user session data
- `GET /getXP` - Get XP and gamification data
- `GET /getTopics` - Get topic-based analytics
- `GET /getDaily` - Get daily statistics
- `GET /getGithub` - Get GitHub activity data

#### **Demo Endpoints**
- `GET /getSessionsDemo` - Demo session data
- `GET /getXPDemo` - Demo XP data
- `GET /getTopicsDemo` - Demo topic data
- `GET /getDailyDemo` - Demo daily data
- `GET /getGithubDemo` - Demo GitHub data

### **Data Schemas**

All API responses are validated using Zod schemas defined in `functions/src/schemas.ts`:

```typescript
// Session Schema
export const SessionSchema = z.object({
  duration: z.number().int().nonnegative(),
  sources: z.array(Source).default([]),
  topics: z.array(z.string()).default([]),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
});

// XP Schema
export const XPSchema = z.object({
  total_xp: z.number().int().nonnegative(),
  session_xp: z.number().int().nonnegative(),
  github_xp: z.number().int().nonnegative(),
  topic_xp: z.number().int().nonnegative(),
  daily_xp: z.number().int().nonnegative(),
  stream_xp: z.number().int().nonnegative(),
});
```

## 🎮 Gamification System

### **XP Calculation**
- **Session XP**: 1 XP per minute of coding activity
- **Streak XP**: 2 XP per day in current streak
- **Topic XP**: 25 XP per unique topic explored
- **Daily XP**: 10 XP per day with coding activity
- **Stream XP**: 20 XP per hour for long coding sessions

### **Session Types**
- **Algorithm Practice**: LeetCode problems, coding challenges
- **Code Review**: GitHub pull requests, code reviews
- **Problem Solving**: Stack Overflow questions, debugging
- **Learning**: Documentation, tutorials, courses
- **Bug Fixing**: Issue resolution, debugging sessions
- **Code Exploration**: Repository browsing, code discovery
- **Focused Coding**: Long, uninterrupted coding sessions
- **Mixed Activity**: Multiple types in one session

## 🔒 Security & Privacy

### **Data Protection**
- **Minimal Data Collection**: Only necessary activity data
- **Local Storage**: Sensitive data stored locally when possible
- **Encrypted Transmission**: All data encrypted in transit
- **User Control**: Users can disable tracking at any time

### **Authentication**
- **Mock Tokens**: Demo authentication system
- **Firebase Auth**: Production-ready authentication
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Zod schema validation

## 📊 Analytics & Monitoring

### **Firebase Analytics**
- **User Behavior**: Track user engagement and patterns
- **Performance Metrics**: Monitor application performance
- **Error Reporting**: Automatic error detection and reporting
- **Custom Events**: Track specific user actions

### **Cloud Monitoring**
- **Function Performance**: Monitor Cloud Function execution
- **Database Metrics**: Track Firestore usage and performance
- **API Latency**: Monitor API response times
- **Error Rates**: Track and alert on error rates

## 🚀 Future Roadmap

### **Short Term**
- **Real-time Updates**: WebSocket integration for live data
- **Mobile App**: React Native companion app
- **Advanced Analytics**: Machine learning insights
- **Team Features**: Collaborative tracking and leaderboards

### **Long Term**
- **AI-Powered Insights**: Personalized learning recommendations
- **Integration APIs**: Third-party platform integration
- **Enterprise Features**: Team management and reporting
- **Global Expansion**: Multi-language support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### **Code Standards**
- **TypeScript**: Use TypeScript for all new code
- **Testing**: Add tests for new features
- **Documentation**: Update documentation for changes
- **Linting**: Follow ESLint and Prettier configurations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Platform** for providing the robust infrastructure
- **Firebase Team** for the excellent developer experience
- **Chrome Extension Team** for the powerful extension APIs
- **React Community** for the amazing frontend framework
- **Open Source Community** for the incredible tools and libraries

---

**Built with ❤️ for the Google Hackathon**

*Transforming coding education through gamification and real-time analytics*

## 📞 Contact

For questions, suggestions, or collaboration opportunities, please reach out:

- **Project Repository**: [GitHub Repository](https://github.com/your-username/codestreak-tracker)
- **Issues**: [GitHub Issues](https://github.com/your-username/codestreak-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/codestreak-tracker/discussions)

---

*Last updated: September 2025*
