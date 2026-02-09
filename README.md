# Restaurant POS and Management System

A comprehensive, full-stack Point of Sale and management system for restaurants, built with modern technologies including React, Node.js, Express, PostgreSQL, and real-time WebSocket communication.

## Features

### Core POS Functionality
- **Table Management**: Visual floor plan editor with drag-and-drop table positioning
- **Order Management**: Full order lifecycle from creation to completion
- **Menu Management**: Categorized menu items with modifiers and customization
- **Payment Processing**: Multiple payment methods with Stripe integration and bill splitting
- **Kitchen Display System (KDS)**: Real-time order tracking for kitchen staff

### Management Features
- **Inventory Management**: Stock tracking with low-stock alerts and transaction history
- **Employee Management**: Staff scheduling, time tracking, and performance analytics
- **Analytics Dashboard**: Sales reports, revenue tracking, and business insights
- **Real-time Updates**: WebSocket integration for live order and table status updates

### Security
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, Server, Chef, Host)
- Secure password hashing with bcrypt
- Protected API routes with middleware

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Query** for server state management
- **Socket.IO Client** for real-time updates
- **Vite** for fast development and builds
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL database
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **Stripe** for payment processing

## Project Structure

```
restaurant-pos/
├── apps/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   ├── middleware/
│   │   │   └── types/
│   │   └── prisma/       # Database schema
│   └── frontend/         # React application
│       └── src/
│           ├── components/
│           ├── hooks/
│           ├── store/
│           └── types/
├── API.md               # Complete API documentation
└── DEPLOYMENT.md        # Deployment guide
```

## Getting Started

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup and deployment instructions.

## Documentation

- [API Documentation](./API.md) - Complete REST API and WebSocket reference
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions

## License

MIT