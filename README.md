# Episode Registry - Behavioral Episode Tracking System

## 📱 Overview

A mobile-first, server-side rendered (SSR) web application for tracking and managing behavioral episodes in educational settings, specifically designed for children with ASD Level 1. Built with Vue 3, TypeScript, AWS services, and modern web technologies.

## 🚀 Features

### Core Functionality
- **Dynamic Forms**: Clinicians can create and manage customizable forms for episode tracking
- **Episode Submission**: Teachers can submit behavioral episodes with detailed context
- **Data Review**: Comprehensive filtering and searching capabilities
- **Export Options**: Generate PDF reports and XML exports for clinical review
- **Role-Based Access Control**: Three distinct roles (sysadmin, clinician, teacher)
- **Mobile-First Design**: Optimized for mobile devices (min-width: 360px)
- **Internationalization**: Spanish (ES) and English (EN) support

### Technical Features
- Server-side rendering with Vite + vite-plugin-ssr
- AWS Cognito authentication
- DynamoDB single-table design pattern
- Real-time data validation
- WCAG 2.2 AA accessibility compliance
- Comprehensive audit logging

## 🛠️ Tech Stack

### Frontend
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Pinia** for state management
- **vite-plugin-ssr** for SSR

### Backend
- **Node.js** with Express
- **AWS DynamoDB** for data persistence
- **AWS Cognito** for authentication
- **AWS SDK v3** for AWS services

### DevOps
- **AWS Amplify** for hosting
- **Doppler** for secrets management
- **Vitest** for testing
- **ESLint & Prettier** for code quality

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- AWS Account with appropriate permissions
- Doppler account (for secrets management)
- AWS CLI configured with profile `cgtaa`

## 🚀 Getting Started

### 1. Install dependencies
```bash
yarn install
```

### 2. Configure environment variables
Copy `.env.example` to `.env` and fill in your AWS credentials:
```bash
cp .env.example .env
```

### 3. Run development server
```bash
# With Doppler
doppler run -- yarn dev:ssr

# Without Doppler (requires .env file)
yarn dev:ssr
```

The application will be available at `http://localhost:3000`

## 🧪 Testing

```bash
# Run unit tests
yarn test

# Run tests with UI
yarn test:ui

# Generate coverage report
yarn test:coverage
```

## 📦 Build & Deployment

### Local Build
```bash
# Build for production
yarn build:ssr

# Preview production build
yarn preview
```

## 📝 License

MIT License - see LICENSE file for details

## 👥 Team

Developed by the CGTAA Team for clinical behavioral tracking in educational settings.
