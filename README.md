# AuctionHub - Online Auction Platform

A modern, full-stack auction platform built with React, Express, and TypeScript that enables users to list items, place bids, and manage auctions with comprehensive admin features.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure registration and login system
- **Auction Management**: Create, browse, and manage auction listings
- **Real-time Bidding**: Place bids with automatic validation and updates
- **Category Filtering**: Organize auctions by categories (Automobiles, Antiques, Jewelry, etc.)
- **Image Upload**: Support for auction item images with file management
- **Search & Filter**: Advanced filtering by price range, category, and keywords

### Admin Dashboard
- **System Statistics**: Overview of active auctions, revenue, and user metrics
- **User Management**: View and manage registered users
- **Auction Oversight**: Monitor all active auctions
- **Data Export**: Export sales reports and user data
- **Quick Navigation**: Direct links to category-filtered auction views

### UI/UX Features
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and TailwindCSS
- **Loading States**: Smooth loading animations and skeleton screens
- **Toast Notifications**: User-friendly feedback for all actions
- **Real-time Countdown**: Live auction end time displays

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Wouter** for lightweight routing
- **TanStack Query** for server state management
- **shadcn/ui** components (Radix UI primitives)
- **TailwindCSS** for styling
- **React Hook Form** with Zod validation
- **Vite** for build tooling

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** database
- **Drizzle ORM** for database management
- **Multer** for file uploads
- **Session-based authentication**
- **RESTful API** architecture

### Development Tools
- **tsx** for TypeScript execution
- **ESBuild** for production builds
- **Drizzle Kit** for database migrations
- **Hot Module Replacement** for development

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd auction-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`


### Production Build
```bash
npm run build
npm start
```



## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## 🎯 Key Features Walkthrough

### Authentication
Users can register and login with username/password. Session-based authentication maintains login state across browser sessions.

### Auction Creation
Authenticated users can list items with:
- Title and detailed description
- Category selection
- Starting bid and optional reserve price
- Auction duration (1-30 days)
- Image upload support

### Bidding System
- Real-time bid validation
- Automatic current bid updates
- Bid history tracking
- Shipping address collection per bid

### Admin Features
- Comprehensive dashboard with system statistics
- User management and auction oversight
- Data export functionality for reports
- Quick navigation to filtered auction views

## 🔒 Security Features

- Input validation using Zod schemas
- SQL injection prevention through Drizzle ORM
- File upload restrictions and validation
- Session-based authentication
- CORS and security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎉 Acknowledgments

- Built with modern web technologies for optimal performance
- Responsive design ensures great user experience across devices
- Comprehensive admin features for platform management
- Real-time updates for engaging auction experience

## Deployment
https://auction-hub-1-josephokivie95.replit.app/
