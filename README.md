# Takberäkning - Roofing Management System

## Project Overview

**Takberäkning** is a comprehensive project management system for "Lundmarks Tak & Montage," a Swedish door-to-door roofing sales company. The system manages the complete business workflow from initial customer contact to project completion.

### Core Business Workflow
1. **Sales Process**: Sales personnel knock on doors and use the calculator ("Kalkyl") for immediate on-site price estimation
2. **Customer Response Tracking**: No/Yes/Waiting for bank approval with variable timeframes
3. **Deal Conversion**: Leads to project leader verification and calculation refinement
4. **Pricing Adjustments**: Customer add-ons, color changes, extra features
5. **Final Pricing**: Used for customer invoicing and material distributor orders
6. **Project Scheduling**: Gantt scheduling with 2-person carpenter teams displayed on office TV
7. **Project Execution**: Carpenters maintain phone contact with office during projects

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database (configured for Neon)

### Installation
```bash
npm install
```

### Environment Setup
Required environment variables:
```
DATABASE_URL=your_postgresql_url
SESSION_SECRET=your_session_secret
```

### Running the Application
```bash
npm run dev
```

The application runs on port 5000 with:
- Backend API at `http://localhost:5000/api`
- Frontend at `http://localhost:5000`

### Database Setup
```bash
npm run db:push
```

## System Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **UI**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query

### Project Structure
```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and configurations
├── server/                   # Backend Express application
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Database storage interface
│   └── index.ts             # Server entry point
├── shared/                   # Shared types and schemas
│   └── schema.ts            # Database schema and types
└── uploads/                 # File storage directory
```

## Key Features

### Four-Tier Role System
1. **Head Admin (Huvudadmin)**: Complete system access
2. **Sales Admin (Säljchef)**: Sales-focused dashboard with team statistics
3. **Project Admin (Projektledare)**: Project-focused dashboard with task indicators
4. **Sales Person (Säljare)**: Limited dashboard, no price previews

### Main Application Areas

#### Calculator (Kalkyl) - ⭐ CORE FEATURE
- **Complex pricing engine** with Swedish ROT tax calculations
- **Multi-step formula**: Base costs → Material markup → Calculation markup → ROT deduction → Final price
- **Dynamic pricing system** for 10+ roofing components (gutters, snow guards, etc.)
- **Real-time admin price previews** overlaid on form fields
- **ROT tax integration**: 50% labor deduction, max 50,000kr per property owner
- **Mobile-optimized** for field sales use
- **Complete documentation** in `CALCULATION_SYSTEM_DOCUMENTATION.md`

#### Deal Pipeline (Affär)
- Kanban-style deal management
- Status tracking: Väntande → Ånger/Redo för Projektering
- Drag-and-drop status updates

#### Project Management (Projekt)
- Gantt chart visualization using Frappe Gantt
- Team assignment and scheduling
- Status tracking (ongoing, finished)
- Office TV display support

#### CRM System
- Customer information tracking
- Comments system for interactions
- PDF generation for quotes and contracts

## Database Schema

### Core Tables
- `users` - User authentication and roles
- `calculations` - Roofing calculations and estimates
- `projects` - Project management with team assignments
- `deals` - Sales pipeline management
- `sessions` - User session storage

### Configuration Tables
- Material prices, roof types, scaffolding sizes
- System settings for feature visibility

## Swedish Terms & Business Logic

### Key Terms (Swedish → English)
- **Kalkyl** → Calculator/Estimation
- **Affär** → Deal/Business
- **Projekt** → Project
- **Planering** → Planning
- **Säljare** → Salesperson
- **Projektledare** → Project Manager
- **Kundregister** → Customer Registry
- **Demo** → Demonstration/Test calculations

### Business Rules
- **ROT Deduction**: Swedish tax deduction for renovation work (default 50%)
- **Material Types**: Plåt (Metal), Betong (Concrete), etc.
- **Roof Types**: Sadel (Gable), Mansard, Pulpet (Shed)
- **Owner Amount**: En (One), Två (Two) - affects ROT calculation

## File Uploads & Storage

Files are stored in the `uploads/` directory with organized subdirectories:
- `uploads/projects/P{id}/` - Project-specific files
- `uploads/temp/` - Temporary uploads

Supported file types: Images (JPG, PNG) and PDFs up to 10MB.

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Calculations
- `GET /api/calculations` - List all calculations
- `POST /api/calculations` - Create new calculation
- `GET /api/calculations/:id` - Get specific calculation

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project

### Configuration
- `GET /api/admin/prices` - Get pricing configuration
- `POST /api/admin/prices` - Update pricing

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React functional component patterns
- Use Zod for schema validation
- Implement proper error handling

### State Management
- Use TanStack Query for server state
- Local component state for UI state
- Form state managed by React Hook Form

### File Organization
- Keep related components together
- Use index files for clean imports
- Separate business logic from UI components

## Testing Credentials

```
Head Admin: Admin / admin
Sales Admin: Sälj / Chef  
Project Admin: Projekt / Ledare
Sales Person: Tobias / Lundgren
```

## Deployment

The application is configured for Replit deployment with:
- Automatic builds via Vite
- Static file serving
- PostgreSQL database connection
- Session management

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure DATABASE_URL is properly set
2. **File Uploads**: Check uploads directory permissions
3. **Session Issues**: Verify SESSION_SECRET is configured

### Logs
- Server logs available in Replit console
- Client errors visible in browser DevTools
- Database queries logged in development mode

## Contributing

When adding new features:
1. Update database schema in `shared/schema.ts`
2. Add API routes in `server/routes.ts`
3. Implement frontend in appropriate page/component
4. Update this documentation

For questions about Swedish business terms or workflow, refer to the business documentation in `replit.md`.