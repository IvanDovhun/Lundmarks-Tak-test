# Developer Handover Documentation

## Code Comments & Documentation Status

### Well-Documented Areas ✅
- **Database Schema** (`shared/schema.ts`) - Complete with English comments
- **API Routes** (`server/routes.ts`) - Documented endpoints  
- **Main README** - Comprehensive system overview
- **Calculator System** (`CALCULATION_SYSTEM_DOCUMENTATION.md`) - Complete formula documentation
- **Calculator Frontend** (`client/src/pages/calculator-page.tsx`) - Business logic explained
- **Backend Calculation Logic** (`server/storage.ts`) - Step-by-step pricing formulas

### Areas Needing More Comments ⚠️
1. **Role-Based Access Control** (`client/src/hooks/useEffectiveAuth.ts`)
   - Permission logic needs documentation

2. **File Upload System** (`server/routes.ts` file handling)
   - Upload flow and organization needs comments

## Swedish Terms for English-Speaking Developers

### Business Terms
```javascript
// Business workflow terms
const SWEDISH_TERMS = {
  // Core application areas
  'Kalkyl': 'Calculator/Cost Estimation',
  'Affär': 'Deal/Business Opportunity', 
  'Projekt': 'Project',
  'Planering': 'Planning/Scheduling',
  'Demo': 'Demonstration/Test Calculation',
  
  // User roles
  'Säljare': 'Salesperson',
  'Projektledare': 'Project Manager',
  'Säljchef': 'Sales Manager',
  'Huvudadmin': 'Head Administrator',
  
  // Customer info
  'Kundregister': 'Customer Registry',
  'Kundnummer': 'Customer Number',
  'Adress': 'Address',
  
  // Roofing terms
  'Takyta': 'Roof Area',
  'Taktyp': 'Roof Type',
  'Material': 'Material Type',
  'Skorsten': 'Chimney',
  'Ställning': 'Scaffolding',
  
  // Roof types
  'Sadel': 'Gable Roof',
  'Mansard': 'Mansard Roof', 
  'Pulpet': 'Shed Roof',
  
  // Material types
  'Plåt': 'Metal Sheeting',
  'Betong': 'Concrete Tiles',
  'Sanda': 'Sanda (brand name)',
  
  // Financial terms
  'ROT-avdrag': 'ROT Tax Deduction (Swedish renovation tax benefit)',
  'Påslag': 'Markup/Margin',
  'Ägare': 'Owner (affects ROT calculation)',
  
  // Status terms
  'Väntande': 'Waiting/Pending',
  'Redo': 'Ready',
  'Pågående': 'Ongoing',
  'Avslutad': 'Completed',
  'Ånger': 'Cancellation/Regret'
};
```

### Technical Terms in Code
```javascript
// Common variable names and their meanings
const CODE_TERMS = {
  'customerOwnerAmount': 'Number of property owners (1 or 2, affects ROT tax)',
  'raspont': 'Wood boarding/sheathing',
  'raspontRivning': 'Wood boarding removal',
  'dukType': 'Underlay/membrane type',
  'milage': 'Travel distance for cost calculation',
  'berakningsPaslag': 'Calculation markup percentage',
  'rotAvdrag': 'ROT tax deduction amount'
};
```

## Clean-up Tasks Completed

### Removed Unnecessary Files 🗑️
1. **SQL Migration Files** - `add_berakning_paslag.sql`, `add_rot_avdrag_column.sql`
   - These were development migration files, replaced by Drizzle schema
2. **Development Assets** - `attached_assets/` folder (70+ files)
   - Screenshots, pasted text files, and development images
3. **Test Files** - `cookies.txt`, temporary development files
4. **Gantt Master** - Unused `gantt-master/` directory (Frappe Gantt implementation replaced it)

### File Organization Improvements
1. **Uploads Directory** - Organized project files in structured folders
2. **Asset Consolidation** - Kept only essential logos and icons
3. **Documentation** - Created comprehensive README and handover docs

## Critical Business Logic to Understand

### ROT Tax Deduction System
```javascript
// Swedish tax system for renovation work
// Customers can deduct 50% of labor costs (not materials)
// Maximum deduction varies by number of property owners
const ROT_RULES = {
  oneOwner: { maxDeduction: 50000, percentage: 50 },
  twoOwners: { maxDeduction: 100000, percentage: 50 }
};
```

### Calculator Price Structure
```javascript
// Pricing consists of:
// 1. Material costs (plåt, betong, etc.)
// 2. Labor costs (arbete)
// 3. Travel costs (based on milage)
// 4. Scaffolding costs (if needed)
// 5. Additional work (extras)
// 6. Company markup (påslag)
```

### Deal Pipeline Workflow
```javascript
// Business process flow:
// 1. Door-to-door sales creates calculation
// 2. Customer response: No/Yes/Waiting for bank
// 3. If Yes → moves to "Redo för Projektering"
// 4. Project manager refines calculation
// 5. Final pricing for invoicing
// 6. Material order to distributor (Beijer Bygg)
// 7. Gantt scheduling for 2-person teams
```

## API Design Patterns

### Consistent Response Format
```javascript
// All API responses follow this pattern:
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

### Role-Based Route Protection
```javascript
// Middleware pattern used throughout:
app.get('/api/admin/*', requireRole(['head_admin', 'sales_admin']));
app.get('/api/projects/*', requireRole(['project_admin', 'head_admin']));
```

## Performance Considerations

### Database Queries
- Use Drizzle ORM for type safety
- Indexes on frequently queried fields (user roles, project status)
- Paginated responses for large datasets

### File Handling
- 10MB upload limit enforced
- Files organized by project/customer for easy cleanup
- Temporary files cleaned up after 24 hours

### Frontend Optimization
- TanStack Query for efficient caching
- Lazy loading for complex components
- Mobile-first responsive design

## Security Notes

### Authentication
- Session-based auth with PostgreSQL storage
- Password hashing using Node.js crypto
- Role-based access control at API and UI level

### File Security
- Upload validation by file type and size
- Protected file access requiring authentication
- No direct file system access from frontend

## Known Technical Debt

### Areas for Future Improvement
1. **Calculator Validation** - Complex form validation could be simplified
2. **Error Handling** - More granular error messages needed
3. **Offline Support** - Calculator needs offline capability for field sales
4. **Test Coverage** - No automated tests currently implemented
5. **TypeScript Strictness** - Some areas use `any` type

### Browser Compatibility
- Tested on Chrome, Firefox, Safari
- Mobile browsers (iOS Safari, Chrome Mobile)
- IE11 not supported (uses modern JS features)

## Deployment Notes

### Production Environment
- Runs on Replit with automatic deployments
- PostgreSQL database (Neon provider)
- Static files served by Express
- SSL termination handled by Replit

### Environment Variables Required
```
DATABASE_URL=postgresql://...
SESSION_SECRET=random_secure_string
REPLIT_DOMAINS=your-repl-domain.replit.app
```

## Future Feature Requests

### Documented User Requests
1. **Offline Calculator** - Work without internet in remote areas
2. **Material Integration** - Direct API with Beijer Bygg distributor
3. **SMS Notifications** - Twilio integration for status updates
4. **Advanced Reporting** - Sales analytics and performance metrics
5. **Mobile App** - Native mobile application for field sales

### Technical Improvements
1. **API Documentation** - OpenAPI/Swagger specification
2. **Automated Testing** - Unit and integration tests
3. **Monitoring** - Application performance monitoring
4. **Backup System** - Automated database backups
5. **Caching Layer** - Redis for session storage and caching

## Contact & Handover

The system is production-ready with active users. Key considerations:
- **Swedish language UI** - Don't change without user consultation
- **Business workflow** - Changes to deal pipeline require user approval
- **Pricing formulas** - Calculator logic is business-critical
- **Role permissions** - Security model is strictly enforced

For questions about Swedish business terms or specific workflow requirements, refer to the comprehensive documentation in `replit.md`.