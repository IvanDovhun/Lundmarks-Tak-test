# Takberäkning Calculation System - Complete Documentation

## Overview

The calculation system is the heart of the roofing management application. It performs complex pricing calculations based on Swedish roofing industry standards, ROT tax regulations, and company-specific markup formulas.

## Calculation Flow Architecture

### Frontend → Backend → Database Flow
```
1. User inputs data in calculator form
2. Frontend validates and sends to POST /api/calculations
3. Backend processes through complex calculation logic
4. Result stored in database and returned to frontend
5. Frontend displays final pricing with ROT deductions
```

## Core Calculation Components

### 1. Input Data Structure
```typescript
interface CalculationInput {
  // Customer Information
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAdress: string;
  customerOwnerAmount: number; // 1 or 2 (affects ROT max)
  
  // Roof Specifications
  area: number;              // Total roof area (m²)
  roofType: {id: string, name: string};    // Sadel, Mansard, Pulpet
  materialType: {id: string, name: string}; // Plåt, Betong, etc.
  
  // Wood Work
  raspont: number;           // Wood boarding area (m²)
  raspontRivning: boolean;   // Remove old boarding
  
  // Infrastructure
  scaffoldingSize: {id: string, name: string};
  chimneyType: {id: string, name: string};
  twoFloorScaffolding: boolean;
  advancedScaffolding: boolean;
  
  // Additional Components (Dynamic Fields)
  snörasskydd: number;       // Snow guards
  hängränna: number;         // Gutters (meters)
  ränndalar: number;         // Gutter valleys
  fotplåt: number;           // Foot plates
  vindskivor: number;        // Wind boards
  takstege: number;          // Roof ladder
  fönster: number;           // Windows
  stuprör: number;           // Downspouts
  ventilation: number;       // Ventilation units
  avluftning: number;        // Exhaust vents
  
  // Business
  extra: string;             // Additional work description
  milage: number;            // Travel distance (km)
  saljare: string;           // Salesperson name
}
```

### 2. Pricing Database Structure

#### Core Pricing Tables
```sql
-- Dynamic field prices (per unit)
prices = {
  "snörasskydd": { material: 150, arbete: 100, unitType: "Antal" },
  "hängränna": { material: 200, arbete: 150, unitType: "Antal Meter" },
  "ränndalar": { material: 300, arbete: 200, unitType: "Antal" },
  // ... more fields
}

-- Fixed configuration prices
roof_types = {
  "sadel": { materialCost: 5000 },
  "mansard": { materialCost: 7500 },
  "pulpet": { materialCost: 4000 }
}

material_types = {
  "plat_sanda": { costPerKvm: 180 },
  "betong_bender": { costPerKvm: 220 },
  "plat_classic": { costPerKvm: 160 }
}

scaffolding_sizes = {
  "upp_till_150": { cost: 15000 },  // Up to 150 m²
  "over_150": { cost: 25000 },      // 150-200 m²
  "over_200": { cost: 35000 }       // Over 200 m²
}

chimney_types = {
  "ingen": { materialCost: 0, laborCost: 0 },
  "hel_plat": { materialCost: 2500, laborCost: 1500 },
  "halv_plat": { materialCost: 1500, laborCost: 1000 }
}
```

#### System Configuration
```sql
calculation_details = {
  "bortforsling": 2500,                    // Waste removal cost
  "påslag_för_förbrukningsmaterial": 15,  // Material markup %
  "beräkning_påslag": 8,                  // Total calculation markup %
  "rotavdrag_procent": 50                 // ROT deduction percentage
}
```

## Step-by-Step Calculation Logic

### Step 1: Initialize Base Costs
```javascript
let materialCost = 0;
let laborCost = 0;
let totalCost = 0;
```

### Step 2: Calculate Core Roof Cost
```javascript
// Material cost per square meter
const materialPerKvm = materialType.costPerKvm; // e.g., 180 kr/m²
const roofMaterialCost = area * materialPerKvm;
materialCost += roofMaterialCost;

// Roof type base cost (fixed cost regardless of area)
const roofTypeCost = roofType.materialCost; // e.g., 5000 kr
materialCost += roofTypeCost;

console.log(`Roof material: ${area}m² × ${materialPerKvm}kr = ${roofMaterialCost}kr`);
console.log(`Roof type cost: ${roofTypeCost}kr`);
```

### Step 3: Calculate Wood Boarding (Råspont)
```javascript
if (raspont > 0) {
  const raspontMaterialCost = raspont * 200; // 200 kr/m²
  let raspontLaborCost;
  
  if (raspontRivning) {
    // With removal of old boarding
    raspontLaborCost = raspont * 250; // 250 kr/m²
  } else {
    // Without removal
    raspontLaborCost = raspont * 150; // 150 kr/m²
  }
  
  materialCost += raspontMaterialCost;
  laborCost += raspontLaborCost;
  
  console.log(`Raspont: ${raspont}m² × 200kr = ${raspontMaterialCost}kr material`);
  console.log(`Raspont labor: ${raspont}m² × ${raspontRivning ? 250 : 150}kr = ${raspontLaborCost}kr`);
}
```

### Step 4: Calculate Scaffolding
```javascript
// Base scaffolding cost
const scaffoldingCost = scaffoldingSize.cost;
materialCost += scaffoldingCost;

// Additional scaffolding options
if (twoFloorScaffolding) {
  materialCost += 15000; // Two-floor scaffolding
}

if (advancedScaffolding) {
  materialCost += 20000; // Advanced scaffolding
}

console.log(`Base scaffolding: ${scaffoldingCost}kr`);
console.log(`Two-floor: ${twoFloorScaffolding ? '+15000kr' : '0kr'}`);
console.log(`Advanced: ${advancedScaffolding ? '+20000kr' : '0kr'}`);
```

### Step 5: Calculate Chimney Work
```javascript
const chimneyMaterialCost = chimneyType.materialCost;
const chimneyLaborCost = chimneyType.laborCost;

materialCost += chimneyMaterialCost;
laborCost += chimneyLaborCost;

console.log(`Chimney material: ${chimneyMaterialCost}kr`);
console.log(`Chimney labor: ${chimneyLaborCost}kr`);
```

### Step 6: Process Dynamic Fields
```javascript
// Loop through all dynamic fields (snörasskydd, hängränna, etc.)
Object.entries(input).forEach(([fieldName, quantity]) => {
  const priceData = prices[fieldName];
  
  if (priceData && quantity > 0) {
    const fieldMaterialCost = quantity * priceData.material;
    const fieldLaborCost = quantity * priceData.arbete;
    
    materialCost += fieldMaterialCost;
    laborCost += fieldLaborCost;
    
    console.log(`${fieldName}: ${quantity} × ${priceData.material}/${priceData.arbete} = ${fieldMaterialCost}/${fieldLaborCost}kr`);
  }
});
```

### Step 7: Add Fixed Costs
```javascript
// Waste removal (bortforsling)
const wasteRemovalCost = 2500;
materialCost += wasteRemovalCost;

console.log(`Waste removal: ${wasteRemovalCost}kr`);
```

### Step 8: Apply Material Markup
```javascript
const materialMarkupPercent = 15; // From database
const originalMaterialCost = materialCost;
materialCost = Math.ceil(materialCost * (1 + materialMarkupPercent / 100));

console.log(`Material markup (${materialMarkupPercent}%): ${originalMaterialCost}kr → ${materialCost}kr`);
```

### Step 9: Calculate Total Cost
```javascript
totalCost = materialCost + laborCost;

console.log(`Subtotal: ${materialCost}kr material + ${laborCost}kr labor = ${totalCost}kr`);
```

### Step 10: Apply Calculation Markup
```javascript
const calculationMarkupPercent = 8; // From database
const originalTotalCost = totalCost;
totalCost = Math.ceil(totalCost * (1 + calculationMarkupPercent / 100));

console.log(`Calculation markup (${calculationMarkupPercent}%): ${originalTotalCost}kr → ${totalCost}kr`);
```

## Frontend Final Price Calculation

After receiving the backend calculation result, the frontend performs the final customer pricing:

### Step 1: Apply Company Margin
```javascript
const payMarginPercent = 5; // User-configurable (typically 5%)
const payMarginPrice = Math.ceil(totalCost * payMarginPercent * 0.01);

console.log(`Company margin (${payMarginPercent}%): ${payMarginPrice}kr`);
```

### Step 2: Calculate ROT Tax Deduction
```javascript
const rotPercent = 50; // From database (typically 50%)
const calculatedRot = Math.round(laborCost * (rotPercent / 100));

// Apply ROT maximum based on number of owners
const rotMaxPerOwner = 50000; // Swedish tax law
const maxRot = rotMaxPerOwner * customerOwnerAmount;
const finalRot = Math.min(calculatedRot, maxRot);

console.log(`ROT calculation: ${laborCost}kr labor × ${rotPercent}% = ${calculatedRot}kr`);
console.log(`ROT maximum: ${customerOwnerAmount} owners × ${rotMaxPerOwner}kr = ${maxRot}kr`);
console.log(`Final ROT deduction: ${finalRot}kr`);
```

### Step 3: Calculate Final Customer Price
```javascript
const priceToPay = Math.ceil(totalCost - finalRot + payMarginPrice);

console.log(`Final calculation:`);
console.log(`Total cost: ${totalCost}kr`);
console.log(`- ROT deduction: -${finalRot}kr`);
console.log(`+ Company margin: +${payMarginPrice}kr`);
console.log(`= Customer pays: ${priceToPay}kr`);
```

### Step 4: Calculate Monthly Payment
```javascript
const monthCost = 0.039; // 3.9% annual interest rate
const monthlyPayment = Math.ceil((priceToPay * monthCost) / 12);

console.log(`Monthly payment (3.9% interest): ${monthlyPayment}kr/month`);
```

## Price Display for Admin Users

Admin users see real-time pricing information overlaid on form fields:

### Dynamic Fields
```javascript
const getAdminPriceDisplay = (fieldName) => {
  const priceData = currentPrices[fieldName];
  if (priceData.material > 0 && priceData.arbete > 0) {
    return `Material: ${priceData.material}kr, Arbete: ${priceData.arbete}kr`;
  }
  // Handle material-only or labor-only pricing
};
```

### Dropdown Fields
```javascript
const getDropdownPriceDisplay = (type, selectedId) => {
  switch (type) {
    case 'roof':
      return `Material: ${item.materialCost}kr`;
    case 'material':
      return `${item.costPerKvm}kr/kvm`;
    case 'scaffolding':
      return `Kostnad: ${item.cost}kr`;
    case 'chimney':
      return `Material: ${item.materialCost}kr, Arbete: ${item.laborCost}kr`;
  }
};
```

### Radio Button Options
```javascript
const getRadioButtonPriceDisplay = (type, isSelected) => {
  switch (type) {
    case 'raspont':
      return isSelected === true ? 
        'Material: 200kr, Arbete: 250kr' :  // With removal
        'Material: 200kr, Arbete: 150kr';   // Without removal
    case 'owners':
      const maxRot = isSelected * 50000;
      return `ROT max: ${maxRot}kr`;
  }
};
```

## Error Handling & Validation

### Backend Validation
```javascript
// Input validation using Zod schema
const validatedInput = calculationSchema.parse(req.body);

// Database constraints ensure data integrity
// Calculations are logged extensively for debugging
```

### Frontend Validation
```javascript
// Real-time form validation
const form = useForm({
  resolver: zodResolver(calculationSchema),
  mode: "onSubmit"
});

// User-friendly error messages in Swedish
// Prevents invalid calculations from being processed
```

## Configuration Management

### Price Updates
Admin users can update all pricing through the admin interface:
- Dynamic field prices (material + labor costs)
- Roof type base costs
- Material costs per square meter
- Scaffolding tier pricing
- System markups and percentages

### Calculation Parameters
Critical calculation parameters stored in `calculation_details`:
- Material markup percentage
- Total calculation markup
- ROT deduction percentage
- Fixed costs (waste removal, etc.)

## Business Logic Notes

### Swedish ROT System
- 50% of labor costs can be deducted as tax credit
- Maximum 50,000 kr per property owner
- Only applies to labor, not materials
- Critical for customer decision-making

### Pricing Strategy
- Material costs include supplier markup (15%)
- Labor costs calculated separately for ROT compliance
- Company margin applied after ROT calculation
- Final markup ensures profitability

### Scalability Considerations
- Dynamic fields system allows easy addition of new components
- Price configuration separated from calculation logic
- Extensive logging for business analysis and debugging

This calculation system handles the complex Swedish roofing industry requirements while maintaining accuracy and configurability for business needs.