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
│   ├── backend/               # Express API server
│   │   ├── prisma/
│   │   │   └── schema.prisma  # Database schema
│   │   └── src/
│   │       ├── index.ts       # Server entry point
│   │       ├── websocket.ts   # WebSocket setup
│   │       ├── middleware/    # Auth & error handling
│   │       ├── routes/        # API endpoints
│   │       ├── services/      # Business logic
│   │       └── types/         # TypeScript types
│   │
│   └── frontend/              # React application
│       └── src/
│           ├── components/    # React components
│           ├── lib/          # API client & utilities
│           ├── store/        # Redux store
│           ├── types/        # TypeScript types
│           └── hooks/        # Custom React hooks
│
├── package.json              # Root package.json
└── tsconfig.json            # Root TypeScript config
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Stripe account (for payment processing)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd restaurant-pos
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**

Create `.env` file in `apps/backend/`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_pos"

# JWT Secrets
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

Create `.env` file in `apps/frontend/`:
```env
VITE_API_URL="http://localhost:3000/api"
```

4. **Set up the database**
```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed the database
npm run db:seed
```

5. **Start development servers**

Terminal 1 - Backend:
```bash
cd apps/backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd apps/frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token

### Tables
- `GET /api/tables/floor/:floorPlanId` - Get all tables for floor plan
- `GET /api/tables/:id` - Get single table
- `POST /api/tables` - Create table (Admin/Manager)
- `PATCH /api/tables/:id` - Update table (Admin/Manager)
- `PATCH /api/tables/:id/status` - Update table status
- `DELETE /api/tables/:id` - Delete table (Admin/Manager)
- `POST /api/tables/combine` - Combine tables
- `POST /api/tables/split/:id` - Split combined table

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/table/:tableId` - Get orders by table
- `GET /api/orders/restaurant/:restaurantId/active` - Get active orders
- `POST /api/orders/:id/items` - Add items to order
- `PATCH /api/orders/items/:itemId/status` - Update item status
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/complete` - Complete order
- `POST /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/:id/total` - Get order total

### Menu
- `GET /api/menu/restaurant/:restaurantId` - Get full menu
- `GET /api/menu/items/:id` - Get menu item
- `POST /api/menu/items` - Create menu item (Admin/Manager)
- `PATCH /api/menu/items/:id` - Update menu item (Admin/Manager)
- `DELETE /api/menu/items/:id` - Delete menu item (Admin/Manager)
- `POST /api/menu/categories` - Create category (Admin/Manager)
- `PATCH /api/menu/categories/:id` - Update category (Admin/Manager)
- `DELETE /api/menu/categories/:id` - Delete category (Admin/Manager)

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments` - Create payment
- `POST /api/payments/:id/confirm` - Confirm payment
- `POST /api/payments/:id/refund` - Process refund (Admin/Manager)
- `POST /api/payments/split` - Split bill
- `GET /api/payments/order/:orderId` - Get order payments

### Inventory
- `GET /api/inventory/restaurant/:restaurantId` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item
- `POST /api/inventory` - Create item (Admin/Manager)
- `PATCH /api/inventory/:id` - Update item (Admin/Manager)
- `POST /api/inventory/:id/adjust` - Adjust stock (Admin/Manager/Chef)
- `GET /api/inventory/restaurant/:restaurantId/low-stock` - Get low stock items
- `GET /api/inventory/:id/transactions` - Get transaction history
- `DELETE /api/inventory/:id` - Delete item (Admin/Manager)

### Employees
- `GET /api/employees/restaurant/:restaurantId` - Get all employees (Admin/Manager)
- `GET /api/employees/:id` - Get employee (Admin/Manager)
- `POST /api/employees` - Create employee (Admin/Manager)
- `PATCH /api/employees/:id` - Update employee (Admin/Manager)
- `POST /api/employees/:id/deactivate` - Deactivate employee (Admin)
- `POST /api/employees/:id/clock-in` - Clock in
- `POST /api/employees/:id/clock-out` - Clock out
- `GET /api/employees/:id/shifts` - Get employee shifts (Admin/Manager)
- `GET /api/employees/restaurant/:restaurantId/active-shifts` - Get active shifts (Admin/Manager)

### Analytics
- `GET /api/analytics/sales/:restaurantId` - Get sales analytics (Admin/Manager)
- `GET /api/analytics/top-items/:restaurantId` - Get top selling items (Admin/Manager)
- `GET /api/analytics/revenue-by-hour/:restaurantId` - Get hourly revenue (Admin/Manager)
- `GET /api/analytics/tables/:restaurantId` - Get table performance (Admin/Manager)
- `GET /api/analytics/employees/:restaurantId` - Get employee performance (Admin/Manager)
- `GET /api/analytics/dashboard/:restaurantId` - Get dashboard summary (Admin/Manager)

## WebSocket Events

### Client to Server
- `table:update` - Update table position/details
- `table:status` - Update table status
- `order:created` - New order created
- `order:updated` - Order updated
- `order:item:status` - Order item status changed
- `kitchen:join` - Join kitchen display room
- `kitchen:item:complete` - Mark item as complete
- `payment:initiated` - Payment started
- `payment:completed` - Payment completed
- `inventory:low` - Low stock alert
- `employee:clock` - Employee clock in/out

### Server to Client
- `table:updated` - Table was updated
- `table:status:changed` - Table status changed
- `order:new` - New order received
- `order:updated` - Order was updated
- `order:item:status:changed` - Item status changed
- `order:item:ready` - Item ready for service
- `kitchen:order:new` - New order for kitchen
- `kitchen:order:updated` - Kitchen order updated
- `kitchen:item:completed` - Kitchen item completed
- `payment:processing` - Payment being processed
- `payment:success` - Payment succeeded
- `inventory:alert` - Inventory alert triggered
- `employee:status:changed` - Employee status changed

## User Roles

- **ADMIN**: Full system access, can manage all resources
- **MANAGER**: Can manage operations, view analytics, manage employees
- **SERVER**: Can take orders, process payments, manage tables
- **CHEF**: Can view and update kitchen orders, manage inventory
- **HOST**: Can manage tables, reservations, and seating

## Database Schema

The system uses Prisma ORM with PostgreSQL. Key models include:

- **Employee**: Staff members with authentication
- **Table**: Restaurant tables with floor plan positioning
- **Order**: Customer orders with line items
- **MenuItem**: Menu items with categories
- **Payment**: Payment records with Stripe integration
- **InventoryItem**: Stock tracking
- **Shift**: Employee time tracking
- **Reservation**: Table reservations

## Development

### Running Tests
```bash
# Backend tests
cd apps/backend
npm test

# Frontend tests
cd apps/frontend
npm test
```

### Building for Production
```bash
# Build backend
cd apps/backend
npm run build

# Build frontend
cd apps/frontend
npm run build
```

### Database Management
```bash
# View database in Prisma Studio
cd apps/backend
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

## Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Build: `npm run build`
5. Start: `npm start`

### Frontend Deployment
1. Build: `npm run build`
2. Serve `dist/` folder with a static server
3. Ensure API_URL environment variable points to backend

### Recommended Platforms
- **Backend**: Railway, Render, Fly.io, AWS EC2
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase, Neon, Railway PostgreSQL

## Environment Variables Reference

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `STRIPE_SECRET_KEY`: Stripe API key
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend
- `VITE_API_URL`: Backend API base URL

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support@example.com
