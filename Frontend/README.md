# AI-Powered Smart Manufacturing Digital Transformation Platform

An enterprise-grade manufacturing management platform that integrates business operations, production, inventory, customers, products, and analytics into one centralized system.

## Project Overview

This platform provides a comprehensive manufacturing ERP solution with role-based access control (RBAC), real-time dashboards, and modular architecture designed for extensibility. It demonstrates how IT can unify manufacturing operations — from production floor to customer management — in a single, professional interface.

## Features

- **Authentication & RBAC**: JWT-based auth with four roles (Admin, Manager, Engineer, Employee), each with distinct permissions
- **Dashboard**: KPI cards, production charts, sales trends, machine status, low-stock alerts
- **ERP Module**: Product management, sales orders with lifecycle tracking, supplier management
- **Inventory**: Raw materials, components, finished goods with stock-level indicators (Healthy/Low/Critical)
- **Production**: Production order tracking with visual progress bars and analytics
- **PLM/BOM**: Product version management and hierarchical Bill of Materials
- **CRM**: Customer management with order history and analytics
- **Reports**: Production, inventory, sales, customer, and product reports with charts
- **Users & Roles**: User management with role assignment (admin only)
- **Settings**: Profile, notifications, security, and company configuration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Auth | Supabase Auth (JWT, password hashing, session persistence) |
| Icons | Lucide React |

## Architecture

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, Header, ProtectedRoute
│   └── ui/              # Reusable: KPICard, DataTable, Modal, StatusBadge, Toast, etc.
├── context/
│   └── AuthContext.tsx  # Auth state, sign-in/up/out, profile management
├── lib/
│   ├── supabase.ts      # Supabase client singleton
│   └── permissions.ts  # Role-based access control logic
├── pages/
│   ├── auth/            # Login, Register
│   ├── erp/             # Products, Sales Orders, Suppliers tabs
│   ├── DashboardPage.tsx
│   ├── InventoryPage.tsx
│   ├── ProductionPage.tsx
│   ├── PlmPage.tsx
│   ├── CrmPage.tsx
│   ├── ReportsPage.tsx
│   ├── UsersPage.tsx
│   └── SettingsPage.tsx
├── types/
│   └── index.ts         # TypeScript interfaces for all entities
├── App.tsx              # Router + route protection
└── main.tsx             # Entry point
```

## Database

The platform uses Supabase (PostgreSQL) with the following tables:

- `profiles` — extends auth.users with role, full_name, department
- `products` — product catalog
- `customers` — CRM records
- `suppliers` — supplier directory
- `inventory` — stock items with type and status
- `sales_orders` — customer orders with lifecycle
- `sales_order_items` — order line items
- `production_orders` — production runs with progress
- `components` — engineering component catalog
- `product_versions` — versioned product engineering records
- `boms` — bill of materials headers
- `bom_items` — BOM line items

All tables have Row Level Security (RLS) enabled with role-based policies.

## Environment Variables

The following are pre-configured in `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smartfactory.io | Sm@rtF@ct0ry!Adm1n |
| Manager | manager@smartfactory.io | Sm@rtF@ct0ry!Mngr |
| Engineer | engineer@smartfactory.io | Sm@rtF@ct0ry!Eng1 |
| Employee | employee@smartfactory.io | Sm@rtF@ct0ry!Empl |

## Role Permissions

| Module | Admin | Manager | Engineer | Employee |
|--------|-------|---------|----------|----------|
| Dashboard | Full | Full | Full | Full |
| ERP | Full | Read/Write | — | Read |
| Inventory | Full | Read/Write | — | Read |
| Production | Full | Read/Write | Read | Read |
| PLM/BOM | Full | Read | Read/Write | — |
| CRM | Full | Read/Write | — | — |
| Reports | Full | Full | Full | — |
| Users & Roles | Full | — | — | — |
| Settings | Full | Read | — | — |

## Future Improvements

- Gemini Generative AI Assistant for natural language queries
- Machine IoT/sensor monitoring with real-time data
- WebSocket-based real-time machine data
- OEE (Overall Equipment Effectiveness) calculation
- Predictive maintenance alerts
- AWS deployment (RDS/S3/EC2)
- Global factory monitoring dashboard
- Audit logs and activity tracking
- Advanced security monitoring
