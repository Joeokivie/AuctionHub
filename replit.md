# AuctionHub - Online Auction Platform

## Overview

AuctionHub is a modern full-stack auction platform built with React, Express, and TypeScript. The application allows users to create accounts, list items for auction, place bids, and manage auction activities. It features a responsive design using shadcn/ui components and TailwindCSS, with a PostgreSQL database managed through Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui (Radix UI primitives) with TailwindCSS
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite with hot module replacement
- **Styling**: TailwindCSS with CSS custom properties for theming

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **Storage**: In-memory storage implementation with file-based backup system
- **Authentication**: Session-based authentication with in-memory user tracking
- **API**: RESTful API with JSON responses

### Database Schema
The application uses a PostgreSQL database with four main entities:
- **Users**: Authentication and profile information
- **Categories**: Auction item categorization
- **Auctions**: Item listings with bidding information
- **Bids**: Individual bid records with user and auction relationships

## Key Components

### Authentication System
- Registration and login with username/password
- Session-based authentication without external libraries
- User profile management with shipping and payment information
- Role-based access (regular users and admin functionality)

### Auction Management
- Create auctions with titles, descriptions, categories, and time limits
- Image upload support for auction items
- Starting bid and reserve price configuration
- Automatic auction expiration handling
- Real-time countdown timers

### Bidding System
- Place bids with automatic validation
- Bid history tracking
- Real-time current bid updates
- Shipping address collection per bid

### Admin Dashboard
- System statistics and reporting
- User management and auction oversight
- Data export functionality
- Sales reporting with date ranges

### UI/UX Features
- Responsive design for mobile and desktop
- Dark/light theme support (prepared)
- Toast notifications for user feedback
- Loading states and error handling
- Search and filtering capabilities

## Data Flow

1. **User Authentication**: Users register/login through modals, session state managed in memory
2. **Auction Creation**: Authenticated users can create auctions through a form interface
3. **Bidding Process**: Users place bids which update auction records and create bid history
4. **Data Persistence**: In-memory storage with automatic file-based backups every 5 minutes
5. **Real-time Updates**: Client-side polling through React Query for auction updates

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Components**: Radix UI primitives, Lucide React icons
- **Styling**: TailwindCSS, class-variance-authority, clsx
- **Data Fetching**: TanStack React Query
- **Utilities**: date-fns for date manipulation, Zod for validation

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver (@neondatabase/serverless)
- **Validation**: Zod schemas shared between client and server
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build System**: Vite with React plugin
- **Type Checking**: TypeScript with strict configuration
- **Database Migrations**: Drizzle Kit for schema management
- **Linting/Formatting**: Built-in TypeScript checking

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR on client directory
- **Backend**: tsx for direct TypeScript execution
- **Database**: PostgreSQL connection via environment variable
- **File Structure**: Monorepo with shared schema types

### Production Build
- **Frontend**: Vite builds static assets to dist/public
- **Backend**: esbuild bundles server code to dist/index.js
- **Database**: Drizzle migrations applied via npm script
- **Environment**: NODE_ENV-based configuration

### Data Management
- **Backups**: Automatic JSON backups every 5 minutes to data/backups
- **Persistence**: File-based storage in data/auction_data.json
- **Migration Path**: Ready for PostgreSQL migration from in-memory storage
- **Data Export**: Admin and user data export functionality

The application is designed for easy deployment on platforms like Replit, with automatic database provisioning and environment variable management. The modular architecture allows for easy scaling and feature additions.