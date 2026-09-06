# Quick Start Guide

## Starting the Application

### Prerequisites
- Node.js 16+ installed
- Supabase account with database created
- Environment variables configured

### Backend Setup
```bash
cd Backend
npm install
npm start
# Server runs on http://localhost:5000
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev
# Application runs on http://localhost:5173
```

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info

### Dashboard
- `GET /api/dashboard/stats` - Key metrics
- `GET /api/dashboard/recent-orders` - Recent orders
- `GET /api/dashboard/production-summary` - Production status
- `GET /api/dashboard/inventory-summary` - Inventory status
- `GET /api/dashboard/low-stock-items` - Low stock items

### Products
- `GET /api/products` - List products (with search/filter)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin/manager)
- `PUT /api/products/:id` - Update product (admin/manager)
- `DELETE /api/products/:id` - Delete product (admin/manager)

### Inventory
- `GET /api/inventory` - List inventory items
- `GET /api/inventory/:id` - Get inventory item
- `POST /api/inventory` - Add inventory (admin/manager)
- `PUT /api/inventory/:id` - Update inventory (admin/manager)
- `DELETE /api/inventory/:id` - Delete inventory (admin/manager)

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer (admin/manager)
- `PUT /api/customers/:id` - Update customer (admin/manager)
- `DELETE /api/customers/:id` - Delete customer (admin/manager)

### Sales Orders
- `GET /api/sales-orders` - List sales orders
- `GET /api/sales-orders/:id` - Get order details
- `POST /api/sales-orders` - Create order (admin/manager)
- `PUT /api/sales-orders/:id` - Update order (admin/manager)
- `DELETE /api/sales-orders/:id` - Delete order (admin/manager)

### Production Orders
- `GET /api/production-orders` - List production orders
- `GET /api/production-orders/:id` - Get order details
- `POST /api/production-orders` - Create order (admin/manager)
- `PUT /api/production-orders/:id` - Update order (admin/manager)
- `DELETE /api/production-orders/:id` - Delete order (admin/manager)

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier (admin/manager)
- `PUT /api/suppliers/:id` - Update supplier (admin/manager)
- `DELETE /api/suppliers/:id` - Delete supplier (admin/manager)

### Product Versions (PLM)
- `GET /api/product-versions` - List versions
- `POST /api/product-versions` - Create version (admin/manager/engineer)
- `PUT /api/product-versions/:id` - Update version (admin/manager/engineer)

### BOMs (Bill of Materials)
- `GET /api/boms` - List BOMs
- `GET /api/boms/:id` - Get BOM details
- `POST /api/boms` - Create BOM (admin/manager/engineer)
- `PUT /api/boms/:id` - Update BOM (admin/manager/engineer)
- `DELETE /api/boms/:id` - Delete BOM (admin/manager/engineer)

### BOM Items
- `GET /api/bom-items` - List BOM items
- `POST /api/bom-items` - Add component to BOM (admin/manager/engineer)
- `DELETE /api/bom-items/:id` - Remove component (admin/manager/engineer)

### Components
- `GET /api/components` - List components
- `POST /api/components` - Create component (admin/manager/engineer)
- `PUT /api/components/:id` - Update component (admin/manager/engineer)
- `DELETE /api/components/:id` - Delete component (admin/manager/engineer)

---

## Default Test User

Email: `nikhiltest@gmail.com`
Password: Check your Supabase authentication

**Role:** Admin (full access)

---

## Frontend Pages

### Dashboard
- Real-time KPI metrics
- Production status overview
- Inventory alerts
- Recent orders
- All data from backend

### Modules

**ERP:**
- Products (with categories)
- Sales Orders (with customers)
- Suppliers (procurement)
- Customers (CRM)

**Manufacturing:**
- Inventory (with stock levels)
- Production Orders (with progress)
- Completed Orders

**PLM:**
- Product Versions
- Bill of Materials
- Components
- BOM Management

**Reports:**
- Aggregated data from all modules
- Status dashboards
- Historical data

---

## Error Handling

All pages include:
- Loading states with spinners
- Toast notifications for success/error
- Empty state when no data
- User-friendly error messages
- Automatic error recovery

### Common Error Messages

- **"Access denied. Please log in again."** - Token expired, redirect to login
- **"You don't have permission to perform this action."** - Role authorization failed
- **"Failed to [operation]. Please try again."** - Server error occurred
- **"Connection error. Please check your internet."** - Network failure

---

## Database Schema

### Core Tables
- `profiles` - User information and roles
- `products` - Product catalog
- `inventory` - Stock levels
- `customers` - Customer information
- `sales_orders` - Sales orders
- `suppliers` - Supplier information
- `production_orders` - Manufacturing orders
- `product_versions` - PLM versions
- `components` - Component library
- `boms` - Bill of Materials
- `bom_items` - BOM components

### Relationships
- Products ↔ Sales Orders (customer_id)
- Products ↔ Production Orders (product_id)
- Products ↔ BOMs (product_id)
- BOMs ↔ BOM Items (bom_id)
- BOM Items ↔ Components (component_id)
- Customers ↔ Sales Orders (customer_id)

---

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version  # Should be 16+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Frontend build fails
```bash
# Clear cache
rm -rf node_modules dist .vite

# Reinstall and rebuild
npm install
npm run build
```

### Database connection error
- Verify Supabase URL in .env
- Check API key is correct
- Ensure RLS policies allow queries
- Test with: `GET /api/supabase-test`

### Authentication not working
- Check access_token in localStorage
- Verify JWT token not expired
- Try logging out and logging back in
- Check browser console for errors

---

## Production Deployment

1. Build frontend: `npm run build`
2. Deploy frontend to Vercel/Netlify
3. Deploy backend to Heroku/Railway
4. Update environment variables
5. Run database migrations if needed
6. Test all API endpoints
7. Monitor error logs

---

## Support

For issues or questions:
1. Check browser console for errors
2. Review network tab in DevTools
3. Check backend logs
4. Verify database connection
5. Ensure correct user permissions

**All systems are production-ready! ✅**
