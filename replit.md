# ChatConnect - Random Video Chat Application

## Overview

ChatConnect is a modern real-time video chat application that connects users randomly from around the world. Built with a full-stack architecture using React, Express, PostgreSQL, and WebRTC, it provides secure video communication with subscription features and country-specific matching.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive component library using Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time Communication**: WebSocket server for signaling
- **Authentication**: Replit Auth with OpenID Connect

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Session Storage**: PostgreSQL table for session persistence

## Key Components

### Authentication System
- **Provider**: Replit Auth integration
- **Strategy**: OpenID Connect with Passport.js
- **Session Management**: Secure session storage with HTTP-only cookies
- **User Management**: Automatic user creation and profile updates

### Video Chat Infrastructure
- **WebRTC**: Peer-to-peer video communication
- **Signaling Server**: WebSocket-based signaling for connection establishment
- **STUN Servers**: Google STUN servers for NAT traversal
- **Media Permissions**: Camera and microphone access management

### Subscription System
- **Payment Processor**: Stripe integration for subscription management
- **Plans**: Free and premium tiers with different features
- **Webhooks**: Stripe webhook handling for subscription updates

### Chat Matching System
- **Algorithm**: Country-based user matching with fallback to global pool
- **Queue Management**: Waiting room system for user pairing
- **Session Tracking**: Active chat session monitoring

## Data Flow

### User Registration & Authentication
1. User clicks login → Redirected to Replit Auth
2. Successful authentication → User data stored/updated in database
3. Session created and stored in PostgreSQL
4. User redirected to application with authenticated session

### Video Chat Connection
1. User selects country preference and starts chat
2. WebSocket connection established to signaling server
3. User added to waiting queue for selected country
4. When match found, WebRTC offer/answer exchange begins
5. P2P video connection established between users
6. Chat session tracked in database

### Subscription Flow
1. User navigates to subscription page
2. Stripe payment form rendered with subscription details
3. Payment processed through Stripe
4. User subscription status updated in database
5. Premium features unlocked

## External Dependencies

### Payment Processing
- **Stripe**: Subscription management and payment processing
- **Webhooks**: Real-time subscription status updates

### Database Infrastructure
- **Neon**: Serverless PostgreSQL hosting
- **Connection Pooling**: Managed through Neon's infrastructure

### Development Tools
- **Replit**: Development environment and deployment platform
- **TypeScript**: Type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- **Platform**: Replit with hot reloading
- **Database**: Neon development instance
- **WebSocket**: Development server on same port as HTTP

### Production Deployment
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Server**: Express serves both API and static files
- **Database**: Production Neon PostgreSQL instance
- **Environment Variables**: Secure configuration management

### Configuration
- **Port**: 5000 (internal), 80 (external)
- **Environment**: NODE_ENV for development/production switching
- **Security**: HTTPS in production, secure cookies

## User Preferences

Preferred communication style: Simple, everyday language.
Admin user: ibrahimy2gg2g@gmail.com with full admin privileges.
UI Theme: Clean white background design with blue-purple gradients.
Mobile login: Enhanced with account selection prompt for multiple accounts.
Display features: Show real-time online user count on homepage.

## Recent Changes

- June 24, 2025: Fixed application startup and Vercel deployment issues
  - Resolved ES module conflicts between root and server configurations
  - Updated server package.json and tsconfig.json to use ES modules
  - Fixed TypeScript compilation errors in client components
  - Created proper Vercel serverless function entry point (api/index.mjs)
  - Simplified enhanced admin page temporarily for deployment
  - Application now running successfully on port 5000
- June 24, 2025: Prepared application for Vercel deployment
  - Created vercel.json configuration
  - Added separate package.json files for client/server
  - Updated server entry point for serverless functions
  - Added CORS configuration for production
  - Created deployment documentation
- June 23, 2025: Enhanced system with 190+ countries support
- June 23, 2025: Implemented advanced matching system with regional server distribution
- June 23, 2025: Added comprehensive enhanced admin panel with:
  - User ban/unban system with duration controls
  - Advanced report review and resolution system
  - Server pool management and load balancing
  - Real-time analytics and queue monitoring
  - Admin action logging and audit trail
- June 23, 2025: Upgraded matching algorithm to prioritize same country, then region, then global
- June 23, 2025: Added server pool management for optimal user distribution across regions

## Changelog

- June 23, 2025: Initial video chat application setup with Replit Auth and Stripe
- June 23, 2025: Added comprehensive admin panel with user management, chat monitoring, and reporting system
- Added admin privileges for ibrahimy2gg2g@gmail.com