# Takberäkning Application

## Overview

This is a comprehensive project management system for "Lundmarks Tak & Montage," a door-to-door roofing sales company (20-40 employees, under 1 year in business). The system manages the complete workflow from initial customer contact to project completion:

**Core Business Workflow:**
1. Sales personnel knock on doors and use "Kalkyl" for immediate on-site price estimation
2. Customer responses tracked: No/Yes/Waiting for bank approval (variable timeframes)
3. Deal conversion leads to project leader verification and calculation refinement
4. Common pricing adjustments: customer add-ons, color changes, extra features
5. Final pricing used for customer invoicing and material distributor orders
6. Gantt scheduling with 2-person carpenter teams displayed on office TV
7. Carpenters maintain phone contact with office during projects

The application provides tools for roofing cost calculations, CRM functionality, deal pipeline management, project scheduling, and role-based dashboards for sales, project management, and administrative oversight.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and bundling
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui component system

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express sessions with memory store
- **File Handling**: Multer for file uploads
- **PDF Generation**: Puppeteer for server-side PDF creation

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon)
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**:
  - `users` - User authentication and roles
  - `calculations` - Roofing calculations and estimates
  - `projects` - Project management with team assignments
  - `deals` - Sales pipeline management
  - Configuration tables for prices, materials, roof types

## Key Components

### Authentication & Role System
- **Three-tier role-based access control:**
  - **Sales Admin (Säljchef)**: Full admin access, user management, price settings, reports
  - **Project Admin (Projektledare)**: Project management, Gantt planning, TV display, materials
  - **Sales Person (Säljare)**: Limited to calculator, demos, own deals only
- Session-based authentication with PostgreSQL session store
- Password hashing using Node.js crypto module
- Role-based routing with access denied pages for unauthorized access

### Calculation Engine
- Dynamic pricing based on configurable material costs
- Support for multiple roof types, materials, and accessories
- Real-time calculation updates with form validation

### File Management
- Secure file upload handling with size limits (10MB)
- Support for images and PDFs
- Protected file access with authentication checks

### Project Management
- Gantt chart visualization for project timelines
- Team assignment and scheduling
- Status tracking (ongoing, finished)

### CRM Features
- Deal pipeline management
- Customer information tracking
- Comments system for customer interactions
- PDF generation for quotes and contracts

## Data Flow

1. **User Authentication**: Login credentials validated against database, session established
2. **Calculation Flow**: User inputs → validation → pricing lookup → calculation → results display
3. **File Upload**: Client upload → server validation → secure storage → database reference
4. **PDF Generation**: Data collection → Puppeteer rendering → file creation → download/view
5. **Project Updates**: Form submission → validation → database update → real-time UI refresh

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, ReactDOM, React Hook Form)
- TanStack Query for server state management
- Wouter for routing
- Zod for schema validation

### UI and Styling
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Lucide React for icons
- date-fns for date manipulation

### Backend Dependencies
- Express.js with TypeScript support
- Drizzle ORM with Neon PostgreSQL adapter
- Passport.js for authentication
- Multer for file uploads
- Puppeteer for PDF generation

### Development Tools
- Vite for development server and building
- ESBuild for server bundling
- TypeScript for type safety
- PostCSS with Autoprefixer

## Deployment Strategy

- **Platform**: Replit with Cloud Run deployment target
- **Build Process**: Vite builds client assets, ESBuild bundles server
- **Environment**: Node.js 20 with PostgreSQL 16
- **Port Configuration**: Internal port 5000, external port 80
- **Static Assets**: Client builds to `dist/public`, served by Express in production

## Changelog

- January 31, 2025. **Navigation Cleanup** - Removed "Notifikationer" from navigation bar as it's not needed. Cleaned up related imports and fixed authentication permissions to ensure admin button visibility on calculator page for head_admin users.
- January 22, 2025. **CRM Page Removal** - Completely removed CRM page and all references as no longer needed. Updated all navigation to redirect to deals page instead. Removed CRM-related routes, CSS classes, and permissions from role-based access control. Updated revised calculation form and project management page to navigate to deals instead of removed CRM. Cleaned up CRM icon and all related styling from index.css.
- January 21, 2025. **Interface Consolidation and Streamlining** - Completed admin interface consolidation by removing user management from admin dashboard (now handled by employees page). Consolidated settings and system-settings functionality into profile page with tabs. Renamed admin button to "Kalkylinställningar" on calculator page. Removed "Admin" from navigation bars and replaced "INSTÄLLNINGAR/SYSTEMINSTÄLLNINGAR" with single "PROFIL" menu item across all roles. Profile page now features tabbed interface with system settings available only to head_admin role. Fixed duplicate "Profil" navigation entries. Updated Gantt charts to display project addresses instead of customer names for better location-based planning (both planning-page.tsx and planning-gantt.tsx). Added navigation buttons to Demo and Kundregister pages for seamless navigation. Fixed customer registry data mapping to display all calculations as customers/leads with proper field mapping from API response. Fixed "Två0" display issue in calculator by correcting radio button structure and repositioning price overlay component. Set "En" (1 owner) as default selection to prevent display issues. **MAJOR: Developer Handover Preparation** - Created comprehensive documentation (README.md, DEVELOPER_HANDOVER.md) with Swedish→English translations, business logic explanations, and API documentation. Added extensive code comments to critical components. **MAJOR: Complete Calculation System Documentation** - Created detailed CALCULATION_SYSTEM_DOCUMENTATION.md explaining the complex pricing formulas, ROT tax integration, step-by-step backend calculation logic, and admin price display system. Documented all Swedish business rules and mathematical formulas used in the roofing cost calculator. Cleaned up project by removing 200MB+ of development artifacts (attached_assets/, legacy SQL files, unused gantt-master/). Project is now production-ready for English-speaking development team handover.
- January 13, 2025. **MAJOR: Role-Specific Navigation Menu System** - Completely restructured navigation bar with clean role-specific menus. Projektledare: Dashboard, Kalkyl, Affär, Projekt (zendesk), Planering, Settings. Sales Admin: Dashboard, Kalkyl, Demo, Affär, CRM, Settings. Sales Person: Dashboard, Kalkyl, Demo, Affär (filtered to show only their own clients). Implemented comprehensive access control ensuring sales persons only see their own demo and deal data.
- January 13, 2025. **System Settings Configuration Framework** - Created tech admin system settings page for controlling feature visibility. Implemented location dropdown visibility control with database-backed configuration. Head admin can now toggle location dropdown for sales_admin/project_admin roles through /system-settings page.
- January 13, 2025. **MAJOR: Four-Tier Role-Based Access Control System** - Implemented comprehensive four-tier user role system with head_admin, sales_admin, project_admin, and sales_person roles. Each role has specific dashboard, permissions, and data access. Sales persons cannot see price previews in calculator. Updated login credentials for better role clarity.
- January 13, 2025. Integrated authentic Frappe Gantt with real project data - connected existing project database schema to professional timeline visualization with team filtering, progress tracking, and project-level task management
- January 11, 2025. Implemented authentic Frappe Gantt library for Planning page - integrated open source gantt-master code with proper project scheduling, team filtering, and interactive timeline features
- January 10, 2025. Added admin price display feature in Kalkyl - admin users now see current set prices inside input fields for immediate reference
- January 9, 2025. Simplified V2 design based on user feedback - reduced visual clutter, cleaner status buttons, improved readability
- June 15, 2025. Initial setup

## Test Login Credentials

**Four-Tier Role System:**
- **Head Admin**: Admin / admin - Complete system access with all tools
- **Sales Admin**: Sälj / Chef - Sales-focused dashboard with team statistics  
- **Project Admin**: Projekt / Ledare - Project-focused dashboard with task indicators
- **Sales Person**: Tobias / Lundgren - Limited dashboard, no price previews in calculator

## User Preferences

Preferred communication style: Simple, everyday language.

## Business Requirements (Updated)

**Usage Patterns:**
- Mobile/iPad usage: 90% for Kalkyl calculations (field sales)
- Office TV: 70" display for Gantt scheduling (open office environment)
- Deal pipeline: Kanban board with drag-and-drop functionality

**Workflow Details:**
- Kalkyl popup: "Blev det en affär?" triggers yes/no workflow with photo attachment
- Deal stages: Väntande → Ånger/Redo för Projektering (drag-and-drop status updates)
- Follow-up system: Automatic reminders every 2 weeks for "Väntande" status
- Project leader gets notified when deals move to "Redo för Projektering"
- Material distributor: Partnership with "Beijer Bygg" for automated material orders

**Technical Considerations:**
- Offline capability needed for mobile Kalkyl (poor signal areas)
- Responsive design priority: Mobile-first for sales, large screen for office TV
- Notification system for status changes and follow-ups
- Future: Distributor portal for Beijer Bygg to view material requests