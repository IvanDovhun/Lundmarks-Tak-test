import session from "express-session";
import createMemoryStore from "memorystore";
import { eq, desc, asc, and, sql, or, isNull, inArray, like, max } from "drizzle-orm";
import { addDays } from 'date-fns';
import {
  User,
  InsertUser,
  Calculation,
  CalculationInput,
  Prices,
  users,
  calculations,
  prices,
  roofTypes,
  materialTypes,
  scaffoldingSizes,
  RoofType,
  MaterialType,
  ScaffoldingSize,
  chimneyTypes,
  ChimneyCovering,
  FormDataSchemaType,
  projects,
  Project,
  projectTeams,
  ProjectWithTeam,
  Demo,
  Deal,
  comments,
  deal_data,
  calculation_details,
  material_costs,
  materialRequests,
  MaterialRequest,
  Employee,
  InsertEmployee,
  cities,
  City,
  InsertCity,
  userCityAccess,
  UserCityAccess,
  InsertUserCityAccess,
  system_settings,
  SystemSetting,
  InsertSystemSetting,
} from "@shared/schema";
import { hashPassword } from "./utils";
import { db } from "./db";
import { log } from "./vite";
import puppeteer from 'puppeteer-core';
import { format } from 'date-fns'; // For formatting the date
import { sv } from 'date-fns/locale/sv';
import { Request } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const MemoryStore = createMemoryStore(session);

const FILE_SIZE_LIMIT = 1024 * 1024 * 10;

const tempDiskStorage: StorageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempUploadPath = path.join(__dirname, '..', 'uploads', 'temp'); // Save to a general temp folder
    fs.ensureDirSync(tempUploadPath); // fs-extra ensures directory exists (like mkdir -p)
    cb(null, tempUploadPath);
  },
  filename: function (req, file, cb) {
    // Keep generating unique filenames to avoid collisions in the temp folder
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export interface ProcessRequestFiles {
  agreementFile?: Express.Multer.File[];
  projectFiles?: Express.Multer.File[];
}

interface CalculationProcessUpdateData {
  isDeal: boolean;
  reasonNoDeal?: string;
  revisit?: boolean;
  processNotes?: string;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Employee management
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  toggleEmployeeStatus(id: number): Promise<Employee>;
  createCalculation(userId: number, input: CalculationInput): Promise<Calculation>;
  getUserCalculations(userId: number): Promise<Calculation[]>;
  getAllCalculations(): Promise<Calculation[]>;
  getPrices(): Promise<Prices>;
  updatePrices(prices: Prices): Promise<Prices>;
  getRoofTypes(): Promise<RoofType[]>;
  createRoofType(roofType: RoofType): Promise<RoofType>;
  updateRoofType(id: string, roofType: RoofType): Promise<RoofType>;
  deleteRoofType(id: string): Promise<void>;
  getMaterialTypes(): Promise<MaterialType[]>;
  createMaterialType(materialType: MaterialType): Promise<MaterialType>;
  updateMaterialType(id: string, materialType: MaterialType): Promise<MaterialType>;
  deleteMaterialType(id: string): Promise<void>;
  getScaffoldingSizes(): Promise<ScaffoldingSize[]>;
  createScaffoldingSize(scaffoldingSize: ScaffoldingSize): Promise<ScaffoldingSize>;
  updateScaffoldingSize(id: string, scaffoldingSize: ScaffoldingSize): Promise<ScaffoldingSize>;
  deleteScaffoldingSize(id: string): Promise<void>;
  getChimneyTypes(): Promise<ChimneyCovering[]>;
  createChimneyType(chimneyType: ChimneyCovering): Promise<ChimneyCovering>;
  updateChimneyType(id: string, chimneyType: ChimneyCovering): Promise<ChimneyCovering>;
  deleteChimneyType(id: string): Promise<void>;
  sessionStore: session.Store;
  initialize(): Promise<void>;
  getCalculation(id: number): Promise<Calculation | undefined>;
  createDeal(calculation: Calculation, calculationType: string): Promise<Calculation>;
  updateCalculationDealStatus(calcId: number, calculationType: string, marginPrice: number, marginPercent: number): Promise<Calculation>;
  updateDealStatus(calcId: number, calculationType: string): Promise<Calculation>;
  getCategories(): Promise<{ [category: string]: { unitType: string } }>;
  userGetRoofTypes(): Promise<{ id: string; name: string }[]>;
  userGetMaterialTypes(): Promise<{ id: string; name: string }[]>;
  userGetScaffoldingSizes(): Promise<{ id: string; name: string }[]>;
  userGetChimneyTypes(): Promise<{ id: string; name: string }[]>;
  findByIdAndDelete(id: number): Promise<boolean>;
  createProject(projectData: FormDataSchemaType, signature: string): Promise<{ id: number } | null>;
  getProjects(): Promise<ProjectWithTeam[]>;
  generateProjectPDF(project: Project): Promise<Buffer>;
  getProjectOwnership(projectId: string): Promise<{ userId: number } | null>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
  getSalesDashboardStats(userId: number): Promise<any>;
  getSalesCustomers(userId: number): Promise<any[]>;
  getAdminDashboardStats(): Promise<any>;
  
  // Material requests management
  getMaterialRequests(): Promise<MaterialRequest[]>;
  createMaterialRequest(materialRequest: Omit<MaterialRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaterialRequest>;
  updateMaterialRequest(id: number, updates: Partial<MaterialRequest>): Promise<MaterialRequest>;
  deleteMaterialRequest(id: number): Promise<void>;
  getMaterialRequestStats(): Promise<{ pending: number; approved: number; ordered: number; delivered: number; totalCost: number }>;
  exportMaterialRequests(filters?: { status?: string; priority?: string }): Promise<string>;
  
  // City management
  getCities(): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: string, city: Partial<InsertCity>): Promise<City>;
  deleteCity(id: string): Promise<void>;
  toggleCityStatus(id: string): Promise<City>;
  
  // Project Leader functionality
  getProjectLeaderTickets(userId: number): Promise<any[]>;
  updateProjectLeaderTicket(ticketId: number, updateData: any): Promise<any>;
  
  // System settings
  getSystemSetting(settingKey: string): Promise<boolean>;
  updateSystemSetting(settingKey: string, settingValue: boolean): Promise<SystemSetting>;
}

let logoBase64 = '';
const logoFilename = 'logo.png';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

// Try multiple possible paths for the logo
const possibleLogoPaths = [
  path.join(__dirname, 'assets', logoFilename), // Development path
  path.join(__dirname, '..', 'client', 'src', 'icons', logoFilename), // Alternative path
  path.join(process.cwd(), 'server', 'assets', logoFilename), // Process working directory
  path.join(process.cwd(), 'assets', logoFilename), // Root assets
];

let logoPath = '';
for (const testPath of possibleLogoPaths) {
  if (fs.existsSync(testPath)) {
    logoPath = testPath;
    break;
  }
}

console.log(`[PDF LOGO DEBUG] Attempting to load logo from: ${logoPath}`);

try {
  if (logoPath && fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    console.log(`[PDF LOGO DEBUG] Read file, buffer length: ${logoBuffer.length}`);

    const mimeType = 'image/png';
    logoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
    console.log(`[PDF LOGO DEBUG] Generated Base64 starts with: ${logoBase64.substring(0, 60)}...`);
  } else {
    console.warn("[PDF LOGO DEBUG] Logo file not found at any expected location");
  }
} catch (err) {
  console.error("[PDF LOGO DEBUG] Error loading logo file:", err);
}

type AggregatedComment = { id: number; calculationId: number; text: string; createdAt: Date; };

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async initialize() {
    // Check if admin user exists
    // const adminUser = await this.getUserByUsername("Admin");
    // if (!adminUser) {
    //   const hashedPassword = await hashPassword("pw");
    //   await this.createUser({
    //     username: "Admin",
    //     password: hashedPassword,
    //     isAdmin: true,
    //   });
    // }

    // Check if prices exist
    const currentPrices = await this.getPrices();
    if (!currentPrices || Object.keys(currentPrices).length === 0) {
      // Initialize with an empty prices object - admin needs to set these up
      await db.insert(prices).values({
        priceData: {},
      });
    }

    // Initialize default cities if they don't exist
    const existingCities = await this.getCities();
    if (existingCities.length === 0) {
      const defaultCities = [
        { id: "skelleftea", name: "Skellefteå", isActive: true },
        { id: "pitea", name: "Piteå", isActive: true },
      ];

      for (const city of defaultCities) {
        await db.insert(cities).values(city).onConflictDoNothing();
      }
    }
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
    await db.delete(calculations).where(eq(calculations.userId, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getOtherUsers(userId: number): Promise<{id: number, name: string}[]> {
    return db.select({
      id: users.id,
      name: users.username,
    }).from(users)
    .where(and(eq(users.isAdmin, false), sql`${users.id} != ${userId}`));
  }

  async getCategories(): Promise<{ [category: string]: { unitType: string } }> {
    const [priceRecord] = await db.select().from(prices).orderBy(desc(prices.updatedAt));

    if (!priceRecord?.priceData) {
        return {}; // Return empty object if no data exists
    }

    const priceData = priceRecord.priceData;

    const result: { [category: string]: { unitType: string } } = {};

    for (const category in priceData) {
        if (priceData.hasOwnProperty(category)) {
            result[category] = { unitType: priceData[category].unitType };
        }
    }

    return result;
  }

  // Prices Management
  async getPrices(): Promise<Prices> {
    const [priceRecord] = await db.select().from(prices).orderBy(desc(prices.updatedAt));
    return priceRecord?.priceData || {};
  }

  async updatePrices(newPrices: Prices): Promise<Prices> {
    const [priceRecord] = await db.insert(prices).values({ priceData: newPrices }).returning();
    return priceRecord.priceData;
  }

  async getCalculationDetails(): Promise<{name: string, value: number, valueSuffix: string}[]> {
    const calculationDetails = await db.select({
      name: calculation_details.name,
      value: calculation_details.value,
      valueSuffix: calculation_details.valueSuffix,
    }).from(calculation_details)
    return calculationDetails;
  }

  async updateCalculationDetail(input: {name: string, value: number}): Promise<{name: string, value: number}> {
    const [calculationDetail] = await db.update(calculation_details).set(input).where(eq(calculation_details.name, input.name)).returning();
    return calculationDetail;
  }

  async getRootDeduction(): Promise<number> {
    const [rootDeduction] = await db.select({
      value: calculation_details.value,
    }).from(calculation_details).where(eq(calculation_details.name, 'rotavdrag_procent'));
    return rootDeduction.value;
  }

  // Roof Types Management
  async getRoofTypes(): Promise<RoofType[]> {
    log("Fetching all roof types");
    const types = await db.select().from(roofTypes).orderBy(asc(roofTypes.sortOrder));
    log(`Found ${types.length} roof types`);
    return types;
  }

  async userGetRoofTypes(): Promise<{ id: string; name: string }[]> {
    const records = await db.select({
      id: roofTypes.id,
      name: roofTypes.name
    }).from(roofTypes).orderBy(asc(roofTypes.sortOrder));
  
    if (!records || records.length === 0) {
      return [];
    }
  
    return records.map(record => ({
      id: record.id,
      name: record.name
    }));
  }

  async createRoofType(roofType: RoofType): Promise<RoofType> {
    log(`Creating new roof type: ${JSON.stringify(roofType)}`);
    const [created] = await db.insert(roofTypes).values(roofType).returning();
    log(`Created roof type with ID: ${created.id}`);
    return created;
  }

  async updateRoofType(id: string, roofType: RoofType): Promise<RoofType> {
    log(`Updating roof type ${id} with data: ${JSON.stringify(roofType)}`);
    const [updated] = await db.update(roofTypes).set(roofType).where(eq(roofTypes.id, id)).returning();
    log(`Updated roof type ${id}`);
    return updated;
  }

  async deleteRoofType(id: string): Promise<void> {
    log(`Deleting roof type ${id}`);
    await db.delete(roofTypes).where(eq(roofTypes.id, id));
    log(`Deleted roof type ${id}`);
  }

  // Material Types Management
  async getMaterialTypes(): Promise<MaterialType[]> {
    log("Fetching all material types");
    const types = await db.select().from(materialTypes).orderBy(asc(materialTypes.sortOrder));
    log(`Found ${types.length} material types`);
    return types;
  }
  
  async userGetMaterialTypes(): Promise<{ id: string; name: string }[]> {
    const records = await db.select({
      id: materialTypes.id,
      name: materialTypes.name
    }).from(materialTypes).orderBy(asc(materialTypes.sortOrder));
  
    if (!records || records.length === 0) {
      return [];
    }
  
    return records.map(record => ({
      id: record.id,
      name: record.name
    }));
  }

  async createMaterialType(materialType: MaterialType): Promise<MaterialType> {
    log(`Creating new material type: ${JSON.stringify(materialType)}`);
    const [created] = await db.insert(materialTypes).values(materialType).returning();
    log(`Created material type with ID: ${created.id}`);
    return created;
  }

  async updateMaterialType(id: string, materialType: MaterialType): Promise<MaterialType> {
    log(`Updating material type ${id} with data: ${JSON.stringify(materialType)}`);
    const [updated] = await db.update(materialTypes).set(materialType).where(eq(materialTypes.id, id)).returning();
    log(`Updated material type ${id}`);
    return updated;
  }

  async deleteMaterialType(id: string): Promise<void> {
    log(`Deleting material type ${id}`);
    await db.delete(materialTypes).where(eq(materialTypes.id, id));
    log(`Deleted material type ${id}`);
  }

  // Scaffolding Sizes Management
  async getScaffoldingSizes(): Promise<ScaffoldingSize[]> {
    log("Fetching all scaffolding sizes");
    const sizes = await db.select().from(scaffoldingSizes).orderBy(asc(scaffoldingSizes.sortOrder));
    log(`Found ${sizes.length} scaffolding sizes`);
    return sizes;
  }

  async userGetScaffoldingSizes(): Promise<{ id: string; name: string }[]> {
    const records = await db.select({
      id: scaffoldingSizes.id,
      name: scaffoldingSizes.name
    }).from(scaffoldingSizes).orderBy(asc(scaffoldingSizes.sortOrder));

    if (!records || records.length === 0) {
      return [];
    }

    return records.map(record => ({
      id: record.id,
      name: record.name
    }));
  }

  async createScaffoldingSize(scaffoldingSize: ScaffoldingSize): Promise<ScaffoldingSize> {
    log(`Creating new scaffolding size: ${JSON.stringify(scaffoldingSize)}`);
    const [created] = await db.insert(scaffoldingSizes).values(scaffoldingSize).returning();
    log(`Created scaffolding size with ID: ${created.id}`);
    return created;
  }

  async updateScaffoldingSize(id: string, scaffoldingSize: ScaffoldingSize): Promise<ScaffoldingSize> {
    log(`Updating scaffolding size ${id} with data: ${JSON.stringify(scaffoldingSize)}`);
    const [updated] = await db.update(scaffoldingSizes).set(scaffoldingSize).where(eq(scaffoldingSizes.id, id)).returning();
    log(`Updated scaffolding size ${id}`);
    return updated;
  }

  async deleteScaffoldingSize(id: string): Promise<void> {
    log(`Deleting scaffolding size ${id}`);
    await db.delete(scaffoldingSizes).where(eq(scaffoldingSizes.id, id));
    log(`Deleted scaffolding size ${id}`);
  }

  // Chimney Types Management
  async getChimneyTypes(): Promise<ChimneyCovering[]> {
    log("Fetching all chimney types");
    const types = await db.select().from(chimneyTypes).orderBy(asc(chimneyTypes.sortOrder));
    log(`Found ${types.length} chimney types`);
    return types;
  }

  // Chimney Types Management
  async userGetChimneyTypes(): Promise<{ id: string; name: string }[]> {
    const records = await db.select({
      id: chimneyTypes.id,
      name: chimneyTypes.name
    }).from(chimneyTypes).orderBy(asc(chimneyTypes.sortOrder));

    if (!records || records.length === 0) {
      return [];
    }

    return records.map(record => ({
      id: record.id,
      name: record.name
    }));
  }

  async createChimneyType(chimneyType: ChimneyCovering): Promise<ChimneyCovering> {
    log(`Creating new chimney type: ${JSON.stringify(chimneyType)}`);
    const [created] = await db.insert(chimneyTypes).values(chimneyType).returning();
    log(`Created chimney type with ID: ${created.id}`);
    return created;
  }

  async updateChimneyType(id: string, chimneyType: ChimneyCovering): Promise<ChimneyCovering> {
    log(`Updating chimney type ${id} with data: ${JSON.stringify(chimneyType)}`);
    const [updated] = await db.update(chimneyTypes).set(chimneyType).where(eq(chimneyTypes.id, id)).returning();
    log(`Updated chimney type ${id}`);
    return updated;
  }

  async deleteChimneyType(id: string): Promise<void> {
    log(`Deleting chimney type ${id}`);
    await db.delete(chimneyTypes).where(eq(chimneyTypes.id, id));
    log(`Deleted chimney type ${id}`);
  }

  // Calculations
  async createCalculation(userId: number, input: CalculationInput): Promise<Calculation> {
    const currentPrices = await this.getPrices();
    let totalCost = 0;
    let laborCost = 0;
    let materialCost = 0;

    console.log("=== CALCULATION DEBUG START ===");
    console.log("Processing calculation with input:", input);
    console.log("Initial costs - Material: 0, Labor: 0");

    // Add costs from options
    if (input.roofType?.id) {
      const [roofType] = await db.select().from(roofTypes).where(eq(roofTypes.id, input.roofType.id));
      if (roofType) {
        const roofCost = roofType.materialCost;
        materialCost += roofCost;
        console.log(`[ROOF] Added ${roofCost} to materialCost (${input.roofType.name})`);
        console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
      }
    }

    if (input.materialType?.id && input.area) {
      const [materialType] = await db.select().from(materialTypes).where(eq(materialTypes.id, input.materialType.id));
      if (materialType) {
        const materialTypeCost = materialType.costPerKvm * input.area;
        materialCost += materialTypeCost;
        console.log(`[MATERIAL TYPE] Added ${materialTypeCost} to materialCost (${input.materialType.name}: ${materialType.costPerKvm} * ${input.area})`);
        
        const laborKvmCost = input.area * 950;
        laborCost += laborKvmCost;
        console.log(`[LABOR KVM] Added ${laborKvmCost} to laborCost (${input.area} * 950)`);
        
        const takpappCost = input.area * 100;
        materialCost += takpappCost;
        console.log(`[TAKPAPP] Added ${takpappCost} to materialCost (${input.area} * 100)`);
        
        console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
      }
    }

    if (input.scaffoldingSize?.id) {
      const [scaffoldingSize] = await db.select().from(scaffoldingSizes).where(eq(scaffoldingSizes.id, input.scaffoldingSize.id));
      if (scaffoldingSize) {
        const scaffoldingCost = scaffoldingSize.cost;
        laborCost += scaffoldingCost;
        console.log(`[SCAFFOLDING] Added ${scaffoldingCost} to laborCost (${scaffoldingSize.name})`);
        console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
      }
    }

    // Add chimney cost if selected
    if (input.chimneyType?.id) {
      const [chimneyType] = await db.select().from(chimneyTypes).where(eq(chimneyTypes.id, input.chimneyType.id));
      if (chimneyType) {
        const chimneyMaterialCost = chimneyType.materialCost || 0;
        materialCost += chimneyMaterialCost;
        console.log(`[CHIMNEY] Added ${chimneyMaterialCost} to materialCost (${chimneyType.name})`);
        const chimneyLaborCost = chimneyType.laborCost || 0;
        laborCost += chimneyLaborCost;
        console.log(`[CHIMNEY] Added ${chimneyLaborCost} to laborCost (${chimneyType.name})`);
        console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
      }
    }

    // Add costs from dynamic fields
    console.log("Processing dynamic fields with prices:", currentPrices);
    Object.entries(input).forEach(([key, value]) => {
      const price = currentPrices[key];
      if (price && value && typeof value === "number" && value > 0) {
        const dynamicMaterialCost = value * price.material;
        const dynamicLaborCost = value * price.arbete;
        
        materialCost += dynamicMaterialCost;
        laborCost += dynamicLaborCost;
        
        console.log(`[DYNAMIC ${key.toUpperCase()}] Added ${dynamicMaterialCost} to materialCost and ${dynamicLaborCost} to laborCost (${value} * ${price.material}/${price.arbete})`);
        console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
      }
    });

    const [bortforsling] = await db.select().from(calculation_details).where(eq(calculation_details.name, 'bortforsling'));
    const bortforslingCost = bortforsling.value;
    materialCost += bortforslingCost;
    console.log(`[BORTFORSLING] Added ${bortforslingCost} to materialCost`);
    console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);

    console.log("Råspont: ", input.raspont, " med rivning? ", input.raspontRivning);

    if (input.raspontRivning) {
      const [raspontMedRivning] = await db.select().from(material_costs).where(eq(material_costs.name, 'råspont_med_rivning'));
      const raspontMaterialCost = raspontMedRivning.materialCost * input.raspont;
      const raspontLaborCost = raspontMedRivning.laborCost * input.raspont;
      
      materialCost += raspontMaterialCost;
      laborCost += raspontLaborCost;
      
      console.log(`[RÅSPONT MED RIVNING] Added ${raspontMaterialCost} to materialCost and ${raspontLaborCost} to laborCost (${input.raspont} * ${raspontMedRivning.materialCost}/${raspontMedRivning.laborCost})`);
    } else {
      const [raspontUtanRivning] = await db.select().from(material_costs).where(eq(material_costs.name, 'råspont_utan_rivning'));
      const raspontMaterialCost = raspontUtanRivning.materialCost * input.raspont;
      const raspontLaborCost = raspontUtanRivning.laborCost * input.raspont;
      
      materialCost += raspontMaterialCost;
      laborCost += raspontLaborCost;
      
      console.log(`[RÅSPONT UTAN RIVNING] Added ${raspontMaterialCost} to materialCost and ${raspontLaborCost} to laborCost (${input.raspont} * ${raspontUtanRivning.materialCost}/${raspontUtanRivning.laborCost})`);
    }
    console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);

    if (input.advancedScaffolding == true) {
      const [avanceradByggstallning] = await db.select().from(calculation_details).where(eq(calculation_details.name, 'avancerad_byggställning'));
      const advancedScaffoldingCost = avanceradByggstallning.value;
      materialCost += advancedScaffoldingCost;
      console.log(`[ADVANCED SCAFFOLDING] Added ${advancedScaffoldingCost} to materialCost`);
      console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
    }

    if (input.twoFloorScaffolding == true) {
      const [byggstallningTvaVaningar] = await db.select().from(calculation_details).where(eq(calculation_details.name, 'byggställning_två_våningar'));
      const twoFloorCost = byggstallningTvaVaningar.value;
      laborCost += twoFloorCost;
      console.log(`[TWO FLOOR SCAFFOLDING] Added ${twoFloorCost} to laborCost`);
      console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
    }

    if (input.milage) {
      const [milersattning] = await db.select().from(calculation_details).where(eq(calculation_details.name, 'milersättning'));
      const milageCost = milersattning.value * input.milage;
      laborCost += milageCost;
      console.log(`[MILAGE] Added ${milageCost} to laborCost (${input.milage} * ${milersattning.value})`);
      console.log(`[RUNNING TOTAL] Material: ${materialCost}, Labor: ${laborCost}`);
    }

    const [paslagForForbrukningsmaterial] = await db.select().from(calculation_details).where(eq(calculation_details.name, 'påslag_för_förbrukningsmaterial'));
    const originalMaterialCost = materialCost;
    materialCost = Math.ceil(materialCost * (paslagForForbrukningsmaterial.value / 100.0 + 1));
    const addedMarkup = materialCost - originalMaterialCost;
    console.log(`[MATERIAL MARKUP] Applied ${paslagForForbrukningsmaterial.value}% markup to materialCost`);
    console.log(`[MATERIAL MARKUP] Original: ${originalMaterialCost}, New: ${materialCost}, Added markup: ${addedMarkup}`);

    totalCost = materialCost + laborCost;

    // Apply beräkning_påslag to total cost
    const [berakningPaslag] = await db.select().from(calculation_details).where(eq(calculation_details.name, 'beräkning_påslag'));
    const originalTotalCost = totalCost;
    totalCost = Math.ceil(totalCost * (berakningPaslag.value / 100.0 + 1));
    const addedTotalMarkup = totalCost - originalTotalCost;
    console.log(`[TOTAL COST MARKUP] Applied ${berakningPaslag.value}% markup to totalCost`);
    console.log(`[TOTAL COST MARKUP] Original: ${originalTotalCost}, New: ${totalCost}, Added markup: ${addedTotalMarkup}`);

    // Calculate ROT avdrag with cap based on owner amount
    const rootDeduction = await this.getRootDeduction();
    const calculatedRotAvdrag = Math.round(laborCost * (rootDeduction / 100));
    const maxRotAvdrag = 50000 * (input.customerOwnerAmount || 1);
    const rotAvdrag = Math.min(calculatedRotAvdrag, maxRotAvdrag);

    console.log("=== FINAL CALCULATION ===");
    console.log(`Total Cost: ${totalCost}`);
    console.log(`Material Cost: ${materialCost}`);
    console.log(`Labor Cost: ${laborCost}`);
    console.log(`ROT Avdrag (${rootDeduction}%): ${calculatedRotAvdrag}`);
    console.log(`Max ROT Avdrag (50000 * ${input.customerOwnerAmount || 1}): ${maxRotAvdrag}`);
    console.log(`Final ROT Avdrag: ${rotAvdrag}`);
    console.log("=== CALCULATION DEBUG END ===");

    const [calculation] = await db
      .insert(calculations)
      .values({
        userId,
        totalCost,
        laborCost,
        materialCost,
        rotAvdrag,
        calculationType: 'calc',
        inputData: input,
      })
      .returning();

    return calculation;
  }

  async getUserCalculations(userId: number): Promise<Calculation[]> {
    return db
      .select()
      .from(calculations)
      .where(and(eq(calculations.userId, userId), eq(calculations.calculationType, 'calc')))
      .orderBy(desc(calculations.createdAt));
  }

  async getAllCalculations(): Promise<Calculation[]> {
    return db
      .select()
      .from(calculations)
      .orderBy(desc(calculations.createdAt));
  }

  async getCalculation(id: number): Promise<Calculation | undefined> {
    const [calculation] = await db.select().from(calculations).where(eq(calculations.id, id));
    return calculation;
  }

  async createDeal(calculation: Calculation, calculationType: string): Promise<Calculation> {
    const [deal] = await db
      .insert(calculations)
      .values({
        ...calculation,
        id: undefined,
        calculationType: calculationType,
        createdAt: new Date(),
      })
      .returning();
    if (calculationType == 'deal') {
      await db
        .insert(deal_data)
        .values({
          calculationId: deal.id,
        })
    }
    return deal;
  }

  async getAllDeals(calculationType: string): Promise<any[]> {
    const initialResults = await db
      .select({
        id: calculations.id,
        customerName: sql<string>`${calculations.inputData}->>'customerName'`,
        adress: sql<string>`${calculations.inputData}->>'customerAdress'`,
        totalCost: calculations.totalCost,
        createdAt: calculations.createdAt,
        sellerId: users.id,
        sellerName: users.username,
        commentsJson: sql<AggregatedComment[] | null>`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', c.id, 
                  'text', c.text, 
                  'createdAt', NULL
                  /* map other comment fields here */
                )
              )
              FROM ${comments} AS c
              WHERE c.calculation_id = ${calculations.id}
            ),
            '[]'::json
          )
        `.as('comments_data'),
      })
      .from(calculations)
      .leftJoin(users, eq(users.id, calculations.userId))
      .where(eq(calculations.calculationType, calculationType))
      .orderBy(desc(calculations.createdAt));
      
    const enrichedResults = [];

    for (const result of initialResults) {
        const baseData = {
            id: result.id,
            customerName: result.customerName,
            adress: result.adress,
            date: result.createdAt,
            price: result.totalCost,
            sellerId: result.sellerId,
            sellerName: result.sellerName,
            comments: result.commentsJson || [],
        };

        if (calculationType === 'deal') {
          const [dealSpecificData] = await db
            .select({
                dealId: deal_data.dealIdString,
                status: deal_data.status,
                dealStatus: deal_data.status,
                imageLinks: deal_data.imageFileUrls,
                agreementFile: deal_data.agreementFileUrl,
            })
            .from(deal_data)
            .where(eq(deal_data.calculationId, result.id)) // Use the correct ID for the calculation
            .limit(1); // Assuming one-to-one or you only want the first

          if (dealSpecificData) {
            const imageLinks = dealSpecificData.imageLinks || [];
            if (dealSpecificData.agreementFile) {
              imageLinks.push(dealSpecificData.agreementFile);
            }
            enrichedResults.push({
                ...baseData,
                  dealId: dealSpecificData.dealId,
                dealStatus: dealSpecificData.dealStatus,
                imageLinks: imageLinks,
            });
          } else {
            enrichedResults.push({ // Add deal even if no specific deal_data found
                ...baseData,
                  dealId: undefined, // Or null
                dealStatus: undefined,   // Or null
            });
          }
        } else {
          enrichedResults.push(baseData);
        }
    }
    return enrichedResults;
  }

  async getUserDeals(userId: number, calculationType: string): Promise<any[]> {
    const initialResults = await db
      .select({
        id: calculations.id,
        customerName: sql<string>`${calculations.inputData}->>'customerName'`,
        adress: sql<string>`${calculations.inputData}->>'customerAdress'`,
        totalCost: calculations.totalCost,
        createdAt: calculations.createdAt,
        sellerId: users.id,
        sellerName: users.username,
        commentsJson: sql<AggregatedComment[] | null>`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', c.id, 
                  'text', c.text, 
                  'createdAt', NULL
                  /* map other comment fields here */
                )
              )
              FROM ${comments} AS c
              WHERE c.calculation_id = ${calculations.id}
            ),
            '[]'::json
          )
        `.as('comments_data'),
      })
      .from(calculations)
      .leftJoin(users, eq(users.id, calculations.userId))
      .where(and(eq(calculations.userId, userId), eq(calculations.calculationType, calculationType)))
      .orderBy(desc(calculations.createdAt));

    const enrichedResults = [];

    for (const result of initialResults) {
      const baseData = {
          id: result.id,
          customerName: result.customerName,
          adress: result.adress,
          date: result.createdAt,
          price: result.totalCost,
          sellerId: result.sellerId,
          sellerName: result.sellerName,
          comments: result.commentsJson || [],
      };

      if (calculationType === 'deal') {
        const [dealSpecificData] = await db
          .select({
              dealId: deal_data.dealIdString,
              dealStatus: deal_data.status,
              imageLinks: deal_data.imageFileUrls,
              agreementFile: deal_data.agreementFileUrl,
          })
          .from(deal_data)
          .where(eq(deal_data.calculationId, result.id)) // Use the correct ID for the calculation
          .limit(1); // Assuming one-to-one or you only want the first

        if (dealSpecificData) {
          const imageLinks = dealSpecificData.imageLinks || [];
          if (dealSpecificData.agreementFile) {
            imageLinks.push(dealSpecificData.agreementFile);
          }
          enrichedResults.push({
              ...baseData,
                dealId: dealSpecificData.dealId,
              dealStatus: dealSpecificData.dealStatus,
              imageLinks: imageLinks,
          });
        } else {
          enrichedResults.push({ // Add deal even if no specific deal_data found
              ...baseData,
                dealId: undefined, // Or null
              dealStatus: undefined,   // Or null
          });
        }
      } else {
        enrichedResults.push(baseData);
      }
    }
    return enrichedResults;
  }

  async updateCalculationDealStatus(calcId: number, calculationType: string, marginPrice: number, marginPercent: number): Promise<Calculation> {
    const [calculation] = await db
      .update(calculations)
      .set({ calculationType, marginPrice, marginPercent })
      .where(eq(calculations.id, calcId))
      .returning();
    if (calculationType == 'deal') {
      await db
        .insert(deal_data)
        .values({
          calculationId: calculation.id,
        })
    }
    return calculation;
  }

  async updateCalculationProcessStatus(calcId: number, processData: CalculationProcessUpdateData, marginPrice: number, marginPercent: number): Promise<any> {
    const [calculation] = await db
      .update(calculations)
      .set({ calculationType: processData.isDeal ? 'deal' : 'demo', marginPrice, marginPercent, demoRevisit: processData.revisit })
      .where(eq(calculations.id, calcId))
      .returning();
    if (processData.isDeal) {
      const [dealData] = await db
        .insert(deal_data)
        .values({
          calculationId: calculation.id,
        })
        .onConflictDoUpdate({
          target: deal_data.calculationId,
          set: {
            calculationId: calculation.id,
          },
        })
       .returning()
      return dealData;
    }
    if (processData.reasonNoDeal != null && processData.reasonNoDeal != '') {
      await db
        .insert(comments)
        .values({
          calculationId: calculation.id,
          userId: calculation.userId,
          text: processData.reasonNoDeal,
        })
    }
    return calculation;
  }

  async updateDealFiles(tempFiles: ProcessRequestFiles, projectId: string): Promise<any> {
    const finalUploadBase = path.join(__dirname, '..', 'uploads', 'projects');
    const projectSpecificPath = path.join(finalUploadBase, projectId);
    await fs.ensureDir(projectSpecificPath);

    let agreementFinalPath: string | undefined;
    const imageFinalPaths: string[] = [];

    if (tempFiles.agreementFile && tempFiles.agreementFile[0]) {
      const tempFile = tempFiles.agreementFile[0];
      const finalPath = path.join(projectSpecificPath, tempFile.filename);
      try {
        await fs.move(tempFile.path, finalPath, { overwrite: true }); // Move from temp to final
        agreementFinalPath = `/uploads/projects/${projectId}/${tempFile.filename}`; // Store relative path for client access
        console.log(`Moved agreement file to: ${finalPath}`);
      } catch (moveError) {
        console.error(`Error moving agreement file ${tempFile.filename}:`, moveError);
        // Decide how to handle move errors: throw, log, try to cleanup tempFile.path?
        // For now, we'll just mean agreementFinalPath remains undefined
        await fs.unlink(tempFile.path).catch(err => console.error("Failed to delete temp agreement file", err)); // Attempt to cleanup temp file
      }
    }

    if (tempFiles.projectFiles && tempFiles.projectFiles.length > 0) {
      for (const tempFile of tempFiles.projectFiles) {
        const finalPath = path.join(projectSpecificPath, tempFile.filename);
        try {
          await fs.move(tempFile.path, finalPath, { overwrite: true });
          imageFinalPaths.push(`/uploads/projects/${projectId}/${tempFile.filename}`);
          console.log(`Moved project file to: ${finalPath}`);
        } catch (moveError) {
          console.error(`Error moving project file ${tempFile.filename}:`, moveError);
          await fs.unlink(tempFile.path).catch(err => console.error("Failed to delete temp project file", err)); // Attempt to cleanup temp file
        }
      }
    }
    
    const [dealData] = await db
      .update(deal_data)
      .set({ agreementFileUrl: agreementFinalPath, imageFileUrls: imageFinalPaths })
      .where(eq(deal_data.dealIdString, projectId))
      .returning();
    return dealData;
  }

  async getMaterialCosts(): Promise<{name: string, materialCost: number, laborCost: number}[]> {
    const materialCosts = await db.select({
      name: material_costs.name,
      materialCost: material_costs.materialCost,
      laborCost: material_costs.laborCost,
    }).from(material_costs)
    return materialCosts;
  }

  async updateMaterialCost(input: {name: string, materialCost: number, laborCost: number}): Promise<{name: string, materialCost: number, laborCost: number}> {
    const [materialCost] = await db.update(material_costs).set(input).where(eq(material_costs.name, input.name)).returning();
    return materialCost;
  }

  async updateDealStatus(calcId: number, calculationType: string) {
    const [calculation] = await db
      .update(calculations)
      .set({ calculationType })
      .where(eq(calculations.id, calcId))
      .returning();
    return calculation;
  }

  async updateDealKanbanStatus(calcId: number, status: string) {
    console.log("updateDealKanbanStatus", calcId, status)
    
    // Update the status in deal_data table
    const [result] = await db
      .update(deal_data)
      .set({ status })
      .where(eq(deal_data.calculationId, calcId))
      .returning();
    
    return result;
  }

  async findByIdAndDelete(id: number) {
    const deleteResult = await db.delete(calculations)
    .where(eq(calculations.id, id))
    .returning({ deletedId: calculations.id });

    return deleteResult.length > 0;
  }

  async createProject(projectData: FormDataSchemaType, signature: string): Promise<{ id: number } | null> {
    try {
      log(`Creating new project with data: ${JSON.stringify(projectData)}`);
      
      // Check if a project already exists for this calculation
      const existingProject = await db
        .select()
        .from(projects)
        .where(eq(projects.calculationId, projectData.calculationId))
        .limit(1);
      
      if (existingProject.length > 0) {
        log(`Project already exists for calculation ${projectData.calculationId}, returning existing project ID: ${existingProject[0].id}`);
        return { id: existingProject[0].id };
      }
      
      // Extract tillagg fields since we need to flatten them for database storage
      const { tillagg, ...restData } = projectData;

      console.log(typeof restData.startDatum + " : " + restData.startDatum);
      
      const [project] = await db
        .insert(projects)
        .values({
          ...restData,
          malaVindskivor: tillagg.malaVindskivor,
          vaderskyddSkorsten: tillagg.vaderskyddSkorsten,
          createdAt: new Date(),
          // startDatum: new Date(restData.startDatum),
          // slutDatum: new Date(restData.slutDatum),
          signaturUrl: signature,
        })
        .returning();
        
      log(`Created project with ID: ${project.id}`);
      return { id: project.id };
    } catch (e) {
      console.error("Error creating project:", e);
      return null;
    }
  }

  async getProjects(): Promise<ProjectWithTeam[]> {
    const results = await db.select({
      project: projects,
      teamName: projectTeams.name,
      teamColor: projectTeams.color,
    })
    .from(projects)
    .leftJoin(projectTeams, eq(projects.teamId, projectTeams.id));

    return results.map(result => ({
      ...result.project,
      teamName: result.teamName,
      teamColor: result.teamColor,
    }));
  }

  async getProjectData(projectId: number): Promise<ProjectWithTeam> {
    const results = await db.select({
      project: projects,
      teamName: projectTeams.name,
      teamColor: projectTeams.color,
    })
    .from(projects)
    .leftJoin(projectTeams, eq(projects.teamId, projectTeams.id))
    .where(eq(projects.id, projectId));

    if (results.length === 0 || !results[0]) {
    throw new Error("Project not found");
    }

    const result = results[0];

    const projectWithTeam: ProjectWithTeam = {
    ...result.project,
    teamName: result.teamName,
    teamColor: result.teamColor, 
    };
    
    return projectWithTeam;
  }

  async getProjectOwnership(projectId: string): Promise<{ userId: number } | null> {
    const [project] = await db
      .select({ userId: calculations.userId })
      .from(deal_data)
      .innerJoin(calculations, eq(deal_data.calculationId, calculations.id))
      .where(eq(deal_data.dealIdString, projectId))
      .limit(1);
    
    return project || null;
  }

  async getDealByCalculationId(calcId: number): Promise<{calculation: Calculation, dealData: any}> {
    const [calculation] = await db.select().from(calculations).where(eq(calculations.id, calcId));
    if (!calculation) {
      throw new Error("Calculation not found");
    }
    const [deal] = await db.select().from(deal_data).where(eq(deal_data.calculationId, calcId));
    return {calculation: calculation, dealData: deal || null};
  }

  async getProjectByCalculationId(calcId: number): Promise<Project> {
    const [project] = await db.select().from(projects).where(eq(projects.calculationId, calcId));
    if (!project) {
      throw new Error("Project not found");
    }
    return project;
  }

  async assignProjectTeam(projectId: number, teamName: string, teamColor: string): Promise<void> {
    const teamId = await db.insert(projectTeams).values({ name: teamName, color: teamColor }).returning({ id: projectTeams.id });
    await db.update(projects).set({ teamId: teamId[0].id }).where(eq(projects.id, projectId));
  }

  // Update project workflow status methods matching Excel structure
  async updateProjectStatus(projectId: number, statusUpdate: {
    stallningStatus?: string;
    stallningCompletedDate?: Date;
    borttagningStatus?: string;
    borttagningCompletedDate?: Date;
    materialStatus?: string;
    materialCompletedDate?: Date;
    platskassa?: number;
    materialLeverans1Date?: Date;
    materialLeverans2Date?: Date;
    slutbesiktningDate?: Date;
    faktura1Status?: string;
    faktura1Date?: Date;
    overallStatus?: string;
    projektCode?: string;
    teamAssigned?: string | null;
    planningStartDate?: string | Date;
    planningEndDate?: string | Date;
    inGanttTimeline?: boolean;
  }): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set(statusUpdate)
      .where(eq(projects.id, projectId))
      .returning();
    
    if (!updatedProject) {
      throw new Error("Project not found");
    }
    
    return updatedProject;
  }

  // Gantt-specific project management
  async getGanttProjects(): Promise<Project[]> {
    const ganttProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.inGanttTimeline, true))
      .orderBy(projects.planningStartDate);
    
    return ganttProjects;
  }

  async getAllProjectsNotInGantt(): Promise<Project[]> {
    const availableProjects = await db
      .select()
      .from(projects)
      .where(or(eq(projects.inGanttTimeline, false), isNull(projects.inGanttTimeline)))
      .orderBy(projects.createdAt);
    
    return availableProjects;
  }

  async addProjectToGantt(projectId: number, ganttData: {
    planningStartDate: Date;
    planningEndDate: Date;
    teamAssigned?: string | null;
    inGanttTimeline: boolean;
  }): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...ganttData,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId))
      .returning();
    
    if (!updatedProject) {
      throw new Error("Project not found");
    }
    
    return updatedProject;
  }

  async removeProjectFromGantt(projectId: number): Promise<Project | null> {
    const [updatedProject] = await db
      .update(projects)
      .set({
        inGanttTimeline: false,
        planningStartDate: null,
        planningEndDate: null,
        teamAssigned: null,
        updatedAt: new Date()
      })
      .where(eq(projects.id, projectId))
      .returning();
    
    return updatedProject || null;
  }

  async updateProjectPhaseStatus(projectId: number, phase: 'stallning' | 'borttagning' | 'material' | 'faktura1', status: 'pending' | 'grädad' | 'completed', completedDate?: Date): Promise<Project> {
    const updates: any = {};
    
    switch (phase) {
      case 'stallning':
        updates.stallningStatus = status;
        if (completedDate) updates.stallningCompletedDate = completedDate;
        break;
      case 'borttagning':
        updates.borttagningStatus = status;
        if (completedDate) updates.borttagningCompletedDate = completedDate;
        break;
      case 'material':
        updates.materialStatus = status;
        if (completedDate) updates.materialCompletedDate = completedDate;
        break;
      case 'faktura1':
        updates.faktura1Status = status;
        if (completedDate) updates.faktura1Date = completedDate;
        break;
    }
    
    return this.updateProjectStatus(projectId, updates);
  }

  async projectDeal(dealId: number): Promise<any> {
    const [updatedDealData] = await db
      .update(deal_data)
      .set({ status: 'Klar' })
      .where(eq(deal_data.calculationId, dealId))
      .returning();
    
    if (!updatedDealData) {
      throw new Error("Deal not found");
    }
    
    return updatedDealData;
  }

  async generateDealPDF(calculation: Calculation, dealData: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Add other flags if needed, e.g., '--disable-dev-shm-usage'
      ],
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium', // Use the name Nix puts in the PATH
      headless: true, // Or 'new'
    });
    const page = await browser.newPage();

    const htmlContent = await this.createDealHtmlTemplate(calculation, dealData);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Include CSS background colors/images
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, // Adjust margins
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

    // --- Helper Function: Create HTML Template ---
  async createDealHtmlTemplate(data: Calculation, dealData: any): Promise<string> {
    const today = format(new Date(), 'PPPp', { locale: sv }); // Use imported locale

    const styles = `
      body { font-family: sans-serif; font-size: 10pt; color: #333; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
      .logo { max-width: 250px; height: auto; }
      .title { font-size: 14pt; font-weight: bold; text-align: right; margin-bottom: 4px; }
      .date { text-align: right; font-size: 9pt; color: #555; }
      .content { }
      .data-row { display: flex; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dotted #eee; page-break-inside: avoid; } /* Avoid breaking rows across pages */
      .data-label { font-weight: bold; width: 250px; flex-shrink: 0; padding-right: 10px; }
      .data-value { flex-grow: 1; }
      .value-box { background-color: #f0f4f8; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-left: 5px; }
      .signature-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; page-break-before: auto; }
      .signature-image { max-width: 250px; max-height: 80px; }
      /* Ensure Tillägg value div respects line breaks if using innerHTML */
      .html-value div { margin-bottom: 2px; }
    `;

    const [pricesData] = await db.select().from(prices).orderBy(desc(prices.updatedAt));

    const dynamicRows = Object.entries(data.inputData)
    .filter(([key, value]) => key in pricesData.priceData)
    .map(([key, quantity]) => {
      const metaInfo = pricesData.priceData[key];

      return {
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1), // Ex: "hängränna" → "Hängränna"
        value: quantity,
        unit: metaInfo.unitType == 'Antal' ? 'st' : 'm',
      };
    });

    // --- 1. Define all potential rows with their data source key ---
    const allPossibleRows = [
      { key: 'kundnummer', label: 'Kundnummer', value: dealData.dealIdString },
      { key: 'tel', label: 'Telefon', value: data.inputData.customerPhone },
      // Combine names, will filter based on the combined result later
      { key: 'kund', label: 'Kund', value: data.inputData.customerName },
      { key: 'address', label: 'Adress', value: data.inputData.customerAdress },
      { key: 'startDatum', label: 'Startdatum', value: new Intl.DateTimeFormat('sv-SE').format(data.createdAt) },
      { key: 'slutDatum', label: 'Slutdatum', value: new Intl.DateTimeFormat('sv-SE').format(addDays(new Date(data.createdAt), 7)) },
      // Combine Projektor names
      { key: 'totalYta', label: 'Total yta', value: data.inputData.area, unit: ' m²' },
      { key: 'typAvTak', label: 'Typ av tak', value: data.inputData.roofType.name, boxed: true },
      { key: 'raspont', label: 'Råspont', value: data.inputData.raspont },
      { key: 'valAvTakmaterial', label: 'Val av takmaterial', value: data.inputData.materialType.name, boxed: true },
      { key: 'skorsten', label: 'Skorsten', value: data.inputData.chimneyType.name, boxed: true }, // Show 'ingen' if selected
      ...dynamicRows,
      { key: 'ovrigt', label: 'Övrigt', value: data.inputData.extra },
      { key: 'kund2', label: 'Kund', value: data.inputData.customerName },
      // Keep ROT separate as it should likely always be shown
    ];

    const displayData = allPossibleRows.filter(row => {
      const value = row.value;

      // Basic exclusion for null/undefined
      if (value === null || value === undefined) {
        return false;
      }

      // Exclude empty strings
      if (typeof value === 'string' && value.trim() === '') {
        return false;
      }

      // Exclude 0 for specific numeric fields
      // if (typeof value === 'number' && value === 0) {
      //   return false;
      // }


      // Keep the row if no exclusion conditions met
      return true;
    })
    // --- 3. Format the kept rows ---
    .map(row => {
      let displayValue: string | number = row.value ?? ''; // Start with the value

      // Format numbers with units (only if value > 0 or if 0 is allowed for this field)
      if (typeof row.value === 'number' && row.unit) {
         if (row.value !== 0) {
           displayValue = `${row.value} ${row.unit}`;
         }
         // If value is 0 and it *should* be filtered, it won't reach here anyway.
      }

      // Handle default display for certain empty-but-filtered-in values (like optional combined names)
      if ((row.key === 'projektor' || row.key === 'projektledare' || row.key === 'kund2') && !row.value) {
           displayValue = '-'; // Use dash if names were empty
      }
       if ((row.key === 'avsatsSkorsten' || row.key === 'skorstenFarg') && !row.value) {
           displayValue = 'N/A'; // Use N/A if color was empty
       }
       if (row.key === 'skorsten' && !row.value) {
           displayValue = 'Ingen'; // Should only happen if explicitly 'Ingen' or filter failed? Defaulting is safer.
       }

       // Ensure empty strings become a dash for consistency if they somehow slipped through
       if (typeof displayValue === 'string' && displayValue.trim() === '') {
           displayValue = '-';
       }

      return {
        label: row.label,
        value: displayValue,
        isHtml: false // Default
      };
    });

    // --- 5. Handle Preliminärt ROT separately (always display) ---
    displayData.push({
      label: 'Preliminärt ROT',
      value: `ca ${data.rotAvdrag?.toLocaleString('sv-SE') ?? 0} kr`,
      isHtml: false
    });

    // --- 6. Generate HTML ---
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Affär - ${dealData.dealIdString || 'N/A'}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Lundmarks Logo" class="logo"/>` : '<!-- Logo could not be loaded -->'}
          <div>
              <div class="title">Affär</div>
              <div class="date">${today}</div>
          </div>
        </div>

        <div class="content">
          ${displayData.map(row => `
            <div class="data-row">
              <div class="data-label">${row.label}</div>
              <div class="data-value ${row.isHtml ? 'html-value' : ''}">
                ${row.isHtml ? row.value : (row.boxed ? `<span class="value-box">${row.value} ${row.unit}</span>` : row.value)}
              </div>
            </div>
          `).join('')}
        </div>

      </body>
      </html>
    `;
  }

  async generateProjectPDF(project: Project): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Add other flags if needed, e.g., '--disable-dev-shm-usage'
      ],
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium', // Use the name Nix puts in the PATH
      headless: true, // Or 'new'
    });
    const page = await browser.newPage();
    
    const htmlContent = this.createHtmlTemplate(project);

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Include CSS background colors/images
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }, // Adjust margins
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  // --- Helper Function: Create HTML Template ---
  createHtmlTemplate(data: Project): string {
    const today = format(new Date(), 'PPPp', { locale: sv }); // Use imported locale

    const styles = `
      body { font-family: sans-serif; font-size: 10pt; color: #333; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
      .logo { max-width: 250px; height: auto; }
      .title { font-size: 14pt; font-weight: bold; text-align: right; margin-bottom: 4px; }
      .date { text-align: right; font-size: 9pt; color: #555; }
      .content { }
      .data-row { display: flex; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dotted #eee; page-break-inside: avoid; } /* Avoid breaking rows across pages */
      .data-label { font-weight: bold; width: 250px; flex-shrink: 0; padding-right: 10px; }
      .data-value { flex-grow: 1; }
      .value-box { background-color: #f0f4f8; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-left: 5px; }
      .signature-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; page-break-before: auto; }
      .signature-image { max-width: 250px; max-height: 80px; }
      /* Ensure Tillägg value div respects line breaks if using innerHTML */
      .html-value div { margin-bottom: 2px; }
    `;

    // --- 1. Define all potential rows with their data source key ---
    const allPossibleRows = [
      { key: 'kundnummer', label: 'Kundnummer', value: data.kundnummer },
      { key: 'tel1', label: 'Tel 1', value: data.tel1 },
      { key: 'tel2', label: 'Tel 2', value: data.tel2 },
      // Combine names, will filter based on the combined result later
      { key: 'kund', label: 'Kund', value: `${data.kundFirstName || ''} ${data.kundLastName || ''}`.trim() },
      { key: 'address', label: 'Adress', value: data.address },
      { key: 'startDatum', label: 'Startdatum', value: data.startDatum },
      { key: 'slutDatum', label: 'Slutdatum', value: data.slutDatum },
      // Combine Projektor names
      { key: 'projektor', label: 'Projektör', value: `${data.projektorFirstName || ''} ${data.projektorLastName || ''}`.trim() },
      { key: 'projektorTel', label: 'Telefonnummer', value: data.projektorTel }, // Projektor Tel
      // Combine Projektledare names
      { key: 'projektledare', label: 'Projektledare', value: `${data.projektledareFirstName || ''} ${data.projektledareLastName || ''}`.trim() },
      { key: 'projektledareTel', label: 'Telefonnummer', value: data.projektledareTel }, // Projektledare Tel
      { key: 'takbredd', label: 'Takbredd', value: data.takbredd, unit: ' m' },
      { key: 'takfall', label: 'Takfall', value: data.takfall, unit: ' m' },
      { key: 'takfotTillMark', label: 'Takfot till mark', value: data.takfotTillMark, unit: ' m' },
      { key: 'totalYta', label: 'Total yta', value: data.totalYta, unit: ' m²' },
      { key: 'typAvTak', label: 'Typ av tak', value: data.typAvTak, boxed: true },
      { key: 'raspont', label: 'Råspont', value: data.raspont }, // Decide if 0 is meaningful here, currently filtered below if 0
      { key: 'valAvTakmaterial', label: 'Val av takmaterial', value: data.valAvTakmaterial, boxed: true },
      { key: 'farg', label: 'Färg', value: data.farg, boxed: true },
      { key: 'hangranna', label: 'Hängränna', value: data.hangranna, unit: ' m' },
      // Color fields will be filtered based on the corresponding quantity field AND if they have a value
      { key: 'hangrannaFarg', label: 'Hängränna Färg', value: data.hangrannaFarg, dependsOn: 'hangranna', boxed: true },
      { key: 'snorasskydd', label: 'Snörasskydd', value: data.snorasskydd, unit: ' m' },
      { key: 'snorasskyddFarg', label: 'Snörasskydd Färg', value: data.snorasskyddFarg, dependsOn: 'snorasskydd', boxed: true },
      { key: 'placeringSnorasskydd', label: 'Placering Snörasskydd', value: data.placeringSnorasskydd, dependsOn: 'snorasskydd' },
      { key: 'ranndalar', label: 'Ränndalar', value: data.ranndalar, unit: ' m' },
      { key: 'ranndalarFarg', label: 'Ränndalar Färg', value: data.ranndalarFarg, dependsOn: 'ranndalar', boxed: true },
      { key: 'fotplat', label: 'Fotplåt', value: data.fotplat, unit: ' m' },
      { key: 'fotplatFarg', label: 'Fotplåt Färg', value: data.fotplatFarg, dependsOn: 'fotplat', boxed: true },
      { key: 'vindskiveplat', label: 'Vindskiveplåt', value: data.vindskiveplat, unit: ' m' },
      { key: 'vindskiveplatFarg', label: 'Vindskiveplåt Färg', value: data.vindskiveplatFarg, dependsOn: 'vindskiveplat', boxed: true },
      { key: 'stupror', label: 'Stuprör', value: data.stupror, unit: ' st' },
      { key: 'stuprorFarg', label: 'Stuprör Färg', value: data.stuprorFarg, dependsOn: 'stupror', boxed: true },
      { key: 'takstege', label: 'Takstege', value: data.takstege, unit: ' m' },
      { key: 'takstegeFarg', label: 'Takstege Färg', value: data.takstegeFarg, dependsOn: 'takstege', boxed: true },
      // Skorsten fields depend on skorsten value not being 'ingen' or empty
      { key: 'avsatsSkorsten', label: 'Avsats Skorsten', value: data.avsatsSkorsten, dependsOn: 'skorsten', dependsOnValueNot: ['ingen', ''], boxed: true },
      { key: 'skorsten', label: 'Skorsten', value: data.skorsten, boxed: true }, // Show 'ingen' if selected
      { key: 'skorstenFarg', label: 'Skorsten Färg', value: data.skorstenFarg, dependsOn: 'skorsten', dependsOnValueNot: ['ingen', ''], boxed: true },
      { key: 'avluftning', label: 'Avluftning', value: data.avluftning, unit: ' st' },
      { key: 'ventilation', label: 'Ventilation', value: data.ventilation, unit: ' st' },
      { key: 'ovrigt', label: 'Övrigt', value: data.ovrigt },
      // Combine Kund 2 names
      { key: 'kund2', label: 'Kund', value: `${data.kundFirstName2 || ''} ${data.kundLastName2 || ''}`.trim() },
      // Keep ROT separate as it should likely always be shown
    ];

    // --- 2. Filter the rows based on value presence ---
    const fieldsToFilterZero = [ // Numeric fields where 0 means "don't show"
      'takbredd', 'takfall', 'takfotTillMark', 'totalYta', 'raspont', // Assuming 0 raspont is not meaningful
      'hangranna', 'snorasskydd', 'ranndalar', 'fotplat', 'vindskiveplat',
      'stupror', 'takstege', 'avluftning', 'ventilation'
    ];

    const displayData = allPossibleRows.filter(row => {
      const value = row.value;

      // Basic exclusion for null/undefined
      if (value === null || value === undefined) {
        return false;
      }

      // Exclude empty strings
      if (typeof value === 'string' && value.trim() === '') {
        // Exception: Allow 'Skorsten' row even if value is technically empty string initially
        // It will be filtered later if dependsOnValueNot matches
        if (row.key !== 'skorsten') {
           return false;
        }
      }

      // Exclude 0 for specific numeric fields
      if (typeof value === 'number' && value === 0 && fieldsToFilterZero.includes(row.key)) {
        return false;
      }

      // Exclude dependent fields if the primary field is 0 or empty/specific value
      if (row.dependsOn) {
        const primaryValue = data[row.dependsOn as keyof Project];
        if (primaryValue === 0 || primaryValue === null || primaryValue === undefined || primaryValue === '') {
          return false; // Don't show dependent field if primary is zero/empty
        }
        // Exclude if primary value IS one of the excluded values
        if (row.dependsOnValueNot && row.dependsOnValueNot.includes(primaryValue as string)) {
          return false;
        }
      }

      // Special case: if the dependent field itself is empty, don't show it
      // (e.g., hangranna > 0 but hangrannaFarg is empty string)
      if (row.dependsOn && (typeof value === 'string' && value.trim() === '')) {
          return false;
      }
       // Special case: Ensure 'Skorsten' row isn't shown if value is actually empty string
       if (row.key === 'skorsten' && typeof value === 'string' && value.trim() === '') {
           return false;
       }


      // Keep the row if no exclusion conditions met
      return true;
    })
    // --- 3. Format the kept rows ---
    .map(row => {
      let displayValue: string | number = row.value ?? ''; // Start with the value

      // Format numbers with units (only if value > 0 or if 0 is allowed for this field)
      if (typeof row.value === 'number' && row.unit) {
         if (row.value !== 0 || !fieldsToFilterZero.includes(row.key)) {
           displayValue = `${row.value}${row.unit}`;
         }
         // If value is 0 and it *should* be filtered, it won't reach here anyway.
      }

      // Handle default display for certain empty-but-filtered-in values (like optional combined names)
      if ((row.key === 'projektor' || row.key === 'projektledare' || row.key === 'kund2') && !row.value) {
           displayValue = '-'; // Use dash if names were empty
      }
       if ((row.key === 'avsatsSkorsten' || row.key === 'skorstenFarg') && !row.value) {
           displayValue = 'N/A'; // Use N/A if color was empty
       }
       if (row.key === 'skorsten' && !row.value) {
           displayValue = 'Ingen'; // Should only happen if explicitly 'Ingen' or filter failed? Defaulting is safer.
       }

       // Ensure empty strings become a dash for consistency if they somehow slipped through
       if (typeof displayValue === 'string' && displayValue.trim() === '') {
           displayValue = '-';
       }

      return {
        label: row.label,
        value: displayValue,
        boxed: row.boxed ?? false,
        isHtml: false // Default
      };
    });

    // --- 4. Handle Tillägg separately ---
    let tillaggItems = [];
    if (data.malaVindskivor) {
      tillaggItems.push(`<div>- Måla vindskivor</div>`);
    }
    if (data.vaderskyddSkorsten) {
      tillaggItems.push(`<div>- Väderskydd skorsten</div>`);
    }
    // Only add the Tillägg row if there are items
    if (tillaggItems.length > 0) {
      displayData.push({ label: 'Tillägg', value: tillaggItems.join(''), isHtml: true, boxed: false });
    }

    // --- 5. Handle Preliminärt ROT separately (always display) ---
    displayData.push({
      label: 'Preliminärt ROT',
      value: `ca ${data.preliminarROT?.toLocaleString('sv-SE') ?? 0} kr`,
      boxed: false,
      isHtml: false
    });

    // --- 6. Generate HTML ---
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Projekteringsmall - ${data.kundnummer || 'N/A'}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="header">
          ${logoBase64 ? `<img src="${logoBase64}" alt="Lundmarks Logo" class="logo"/>` : '<!-- Logo could not be loaded -->'}
          <div>
              <div class="title">Projekteringsmall</div>
              <div class="date">${today}</div>
          </div>
        </div>

        <div class="content">
          ${displayData.map(row => `
            <div class="data-row">
              <div class="data-label">${row.label}</div>
              <div class="data-value ${row.isHtml ? 'html-value' : ''}">
                ${row.isHtml ? row.value : (row.boxed ? `<span class="value-box">${row.value}</span>` : row.value)}
              </div>
            </div>
          `).join('')}
        </div>

        ${data.signaturUrl ? `
        <div class="signature-section">
          <div class="data-row">
            <div class="data-label">Signatur:</div>
            <img src="${data.signaturUrl}" alt="Signatur" class="signature-image"/>
          </div>
        </div>
        ` : ''}

      </body>
      </html>
    `;
  }

  generateRandomPassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to make the initial characters random
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  async resetUserPassword(userId: number): Promise<string> {
    const newPassword = this.generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
    return newPassword;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      return false;
    }

    const { comparePasswords } = await import('./utils');
    const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return false;
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await db.update(users).set({ password: hashedNewPassword }).where(eq(users.id, userId));
    return true;
  }

  async addImageToDeal(imageFile: Express.Multer.File, dealIdString: string): Promise<string> {
    const finalUploadBase = path.join(__dirname, '..', 'uploads', 'projects');
    const projectSpecificPath = path.join(finalUploadBase, dealIdString);
    await fs.ensureDir(projectSpecificPath);

    const finalPath = path.join(projectSpecificPath, imageFile.filename);
    
    try {
      await fs.move(imageFile.path, finalPath, { overwrite: true });
      const imageUrl = `/uploads/projects/${dealIdString}/${imageFile.filename}`;
      
      // Update the deal_data with the new image URL
      const [currentDealData] = await db
        .select({ imageFileUrls: deal_data.imageFileUrls })
        .from(deal_data)
        .where(eq(deal_data.dealIdString, dealIdString));
      
      const currentImages = currentDealData?.imageFileUrls || [];
      const updatedImages = [...currentImages, imageUrl];
      
      await db
        .update(deal_data)
        .set({ imageFileUrls: updatedImages })
        .where(eq(deal_data.dealIdString, dealIdString));
      
      return imageUrl;
    } catch (moveError) {
      console.error(`Error moving image file ${imageFile.filename}:`, moveError);
      await fs.unlink(imageFile.path).catch(err => console.error("Failed to delete temp image file", err));
      throw new Error("Failed to save image file");
    }
  }

  imageAndPdfFileFilter = (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPG, PNG, PDF allowed.') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  };

  async moveFilesToProjectFolder(
    tempFiles: { agreementFile?: Express.Multer.File[], projectFiles?: Express.Multer.File[] },
    projectId: string // The newly generated project ID (e.g., "P1240")
  ): Promise<{ agreementFinalPath?: string, projectFinalPaths: string[] }> {
    const finalUploadBase = path.join(__dirname, '..', 'uploads', 'projects'); // Base for final project folders
    const projectSpecificPath = path.join(finalUploadBase, projectId);
    await fs.ensureDir(projectSpecificPath); // Ensure project-specific directory exists

    let agreementFinalPath: string | undefined;
    const projectFinalPaths: string[] = [];

    // Move agreement file
    if (tempFiles.agreementFile && tempFiles.agreementFile[0]) {
      const tempFile = tempFiles.agreementFile[0];
      const finalPath = path.join(projectSpecificPath, tempFile.filename); // Use the unique name multer gave it
      try {
        await fs.move(tempFile.path, finalPath, { overwrite: true }); // Move from temp to final
        agreementFinalPath = `/uploads/projects/${projectId}/${tempFile.filename}`; // Store relative path for client access
        console.log(`Moved agreement file to: ${finalPath}`);
      } catch (moveError) {
        console.error(`Error moving agreement file ${tempFile.filename}:`, moveError);
        // Decide how to handle move errors: throw, log, try to cleanup tempFile.path?
        // For now, we'll just mean agreementFinalPath remains undefined
        await fs.unlink(tempFile.path).catch(err => console.error("Failed to delete temp agreement file", err)); // Attempt to cleanup temp file
      }
    }

    // Move project files
    if (tempFiles.projectFiles && tempFiles.projectFiles.length > 0) {
      for (const tempFile of tempFiles.projectFiles) {
        const finalPath = path.join(projectSpecificPath, tempFile.filename);
        try {
          await fs.move(tempFile.path, finalPath, { overwrite: true });
          projectFinalPaths.push(`/uploads/projects/${projectId}/${tempFile.filename}`);
          console.log(`Moved project file to: ${finalPath}`);
        } catch (moveError) {
          console.error(`Error moving project file ${tempFile.filename}:`, moveError);
          await fs.unlink(tempFile.path).catch(err => console.error("Failed to delete temp project file", err)); // Attempt to cleanup temp file
        }
      }
    }
    return { agreementFinalPath, projectFinalPaths };
  }

  processDealUploadMiddleware = multer({
    storage: tempDiskStorage,
    limits: {
      fileSize: FILE_SIZE_LIMIT // 10MB limit
    },
    fileFilter: this.imageAndPdfFileFilter
  }).fields([ // Configure for the fields you expect from the "Process" dialog
    { name: 'agreementFile', maxCount: 1 },
    { name: 'projectFiles', maxCount: 10 } // Array of files
  ]);

  uploadImageMiddleware = multer({
    storage: tempDiskStorage,
    limits: {
      fileSize: FILE_SIZE_LIMIT // 10MB limit
    },
    fileFilter: (req: any, file: Express.Multer.File, cb: FileFilterCallback) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        const error = new Error('Invalid file type. Only JPG, PNG allowed.') as any;
        error.code = 'INVALID_FILE_TYPE';
        cb(error);
      }
    }
  }).single('image');

  // Role-based access methods
  async getDemosByUserId(userId: number): Promise<Demo[]> {
    try {
      const allDemos = await db.select().from(deal_data).where(eq(deal_data.sellerId, userId));
      return allDemos as Demo[];
    } catch (error) {
      console.error("Error fetching user demos:", error);
      throw error;
    }
  }

  async getCalculationsByUserId(userId: number): Promise<Calculation[]> {
    try {
      const userCalcs = await db.select().from(calculations).where(eq(calculations.userId, userId)).orderBy(desc(calculations.createdAt));
      return userCalcs;
    } catch (error) {
      console.error("Error fetching user calculations:", error);
      throw error;
    }
  }

  async getAllDemos(): Promise<Demo[]> {
    try {
      const allDemos = await db.select().from(deal_data).orderBy(desc(deal_data.date));
      return allDemos as Demo[];
    } catch (error) {
      console.error("Error fetching all demos:", error);
      throw error;
    }
  }

  async getAllCalculations(): Promise<Calculation[]> {
    try {
      const allCalcs = await db.select().from(calculations).orderBy(desc(calculations.createdAt));
      return allCalcs;
    } catch (error) {
      console.error("Error fetching all calculations:", error);
      throw error;
    }
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    try {
      await db.update(users).set({ role }).where(eq(users.id, userId));
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  // Sales Dashboard Methods
  async getSalesDashboardStats(userId: number): Promise<any> {
    try {
      // Get user's calculations with deal data
      const userCalculations = await db
        .select()
        .from(calculations)
        .where(eq(calculations.userId, userId));

      // Get deal data for calculations
      const dealData = await db
        .select()
        .from(deal_data)
        .innerJoin(calculations, eq(deal_data.calculationId, calculations.id))
        .where(eq(calculations.userId, userId));

      // Calculate metrics
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const totalSales = dealData
        .filter(d => d.deal_data.status === 'Klar')
        .reduce((sum, d) => sum + (d.calculations.totalPrice || 0), 0);

      const monthlyDeals = dealData.filter(d => {
        const dealDate = new Date(d.deal_data.createdAt);
        return dealDate.getMonth() === currentMonth && 
               dealDate.getFullYear() === currentYear &&
               d.deal_data.status === 'Klar';
      });

      const monthlySales = monthlyDeals.reduce((sum, d) => sum + (d.calculations.totalPrice || 0), 0);

      // Calculate previous month for growth
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const previousMonthDeals = dealData.filter(d => {
        const dealDate = new Date(d.deal_data.createdAt);
        return dealDate.getMonth() === previousMonth && 
               dealDate.getFullYear() === previousYear &&
               d.deal_data.status === 'Klar';
      });

      const previousMonthlySales = previousMonthDeals.reduce((sum, d) => sum + (d.calculations.totalPrice || 0), 0);
      const monthlyGrowth = previousMonthlySales > 0 ? 
        Math.round(((monthlySales - previousMonthlySales) / previousMonthlySales) * 100) : 0;

      // Calculate margin (assuming 20% average margin)
      const margin = Math.round(monthlySales * 0.2);
      const previousMargin = Math.round(previousMonthlySales * 0.2);
      const marginGrowth = previousMargin > 0 ? 
        Math.round(((margin - previousMargin) / previousMargin) * 100) : 0;

      // Count demos
      const demoCount = dealData.filter(d => d.deal_data.status === 'Demo').length;
      const previousMonthDemos = dealData.filter(d => {
        const dealDate = new Date(d.deal_data.createdAt);
        return dealDate.getMonth() === previousMonth && 
               dealDate.getFullYear() === previousYear &&
               d.deal_data.status === 'Demo';
      }).length;
      const demoGrowth = previousMonthDemos > 0 ? 
        Math.round(((demoCount - previousMonthDemos) / previousMonthDemos) * 100) : 0;

      // Calculate conversion rate (deals closed vs total deals)
      const totalDeals = dealData.length;
      const closedDeals = dealData.filter(d => d.deal_data.status === 'Klar').length;
      const conversionRate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;

      // Previous month conversion for growth
      const previousTotalDeals = dealData.filter(d => {
        const dealDate = new Date(d.deal_data.createdAt);
        return dealDate.getMonth() === previousMonth && dealDate.getFullYear() === previousYear;
      }).length;
      const previousClosedDeals = dealData.filter(d => {
        const dealDate = new Date(d.deal_data.createdAt);
        return dealDate.getMonth() === previousMonth && 
               dealDate.getFullYear() === previousYear &&
               d.deal_data.status === 'Klar';
      }).length;
      const previousConversion = previousTotalDeals > 0 ? 
        Math.round((previousClosedDeals / previousTotalDeals) * 100) : 0;
      const conversionGrowth = previousConversion > 0 ? 
        Math.round(((conversionRate - previousConversion) / previousConversion) * 100) : 0;

      return {
        totalSales,
        monthlySales,
        monthlyGrowth,
        margin,
        marginGrowth,
        demoCount,
        demoGrowth,
        conversionRate,
        conversionGrowth
      };
    } catch (error) {
      console.error("Error calculating dashboard stats:", error);
      throw error;
    }
  }

  async getSalesCustomers(userId: number): Promise<any[]> {
    try {
      // Get calculations with deal data for the user
      const customerData = await db
        .select()
        .from(calculations)
        .leftJoin(deal_data, eq(deal_data.calculationId, calculations.id))
        .where(eq(calculations.userId, userId))
        .orderBy(desc(calculations.createdAt));

      // Transform data to match the expected format
      return customerData.map(row => ({
        id: row.calculations.id,
        name: row.calculations.customerName,
        address: row.calculations.customerAddress,
        status: row.deal_data?.status || 'Demo', // Default to Demo if no deal status
        calculationValue: row.calculations.totalPrice
      }));
    } catch (error) {
      console.error("Error fetching sales customers:", error);
      throw error;
    }
  }

  async getAdminDashboardStats(): Promise<any> {
    try {
      // Get all data for comprehensive analytics
      const allDeals = await db
        .select()
        .from(deal_data)
        .innerJoin(calculations, eq(deal_data.calculationId, calculations.id))
        .innerJoin(users, eq(calculations.userId, users.id));

      const allCalculations = await db
        .select()
        .from(calculations)
        .innerJoin(users, eq(calculations.userId, users.id));

      const activeProjects = await db
        .select()
        .from(projects);

      const materialRequestsData = await db
        .select()
        .from(materialRequests);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Sales Performance Analytics
      const completedDeals = allDeals.filter(d => d.deal_data.status === 'Klar');
      const totalSales = completedDeals.reduce((sum, d) => sum + (d.calculations.totalCost || 0), 0);
      
      const monthlyCompletedDeals = completedDeals.filter(d => {
        const dealDate = new Date(d.calculations.createdAt);
        return dealDate.getMonth() === currentMonth && dealDate.getFullYear() === currentYear;
      });
      const monthlySales = monthlyCompletedDeals.reduce((sum, d) => sum + (d.calculations.totalCost || 0), 0);

      const previousMonthDeals = completedDeals.filter(d => {
        const dealDate = new Date(d.calculations.createdAt);
        return dealDate.getMonth() === previousMonth && dealDate.getFullYear() === previousYear;
      });
      const previousMonthSales = previousMonthDeals.reduce((sum, d) => sum + (d.calculations.totalCost || 0), 0);
      const monthlyGrowth = previousMonthSales > 0 ? 
        Math.round(((monthlySales - previousMonthSales) / previousMonthSales) * 100) : 0;

      // Conversion Analytics
      const totalCalculations = allCalculations.length;
      const totalConversions = allDeals.length;
      const conversionRate = totalCalculations > 0 ? 
        Math.round((totalConversions / totalCalculations) * 100) : 0;

      // Deal Size Analytics
      const avgDealSize = completedDeals.length > 0 ? 
        totalSales / completedDeals.length : 0;

      // Team Performance Analytics
      const teamPerformance = await this.calculateTeamPerformance(allDeals, allCalculations);

      // Geographic Analysis
      const geographicData = this.analyzeGeographicPerformance(allDeals);

      // Financial Performance
      const totalCosts = completedDeals.reduce((sum, d) => 
        sum + (d.calculations.materialCost || 0) + (d.calculations.laborCost || 0), 0);
      const grossMargin = totalSales > 0 ? 
        Math.round(((totalSales - totalCosts) / totalSales) * 100) : 0;

      // Material Efficiency
      const materialStats = {
        totalRequests: materialRequestsData.length,
        pending: materialRequestsData.filter(r => r.status === 'pending').length,
        approved: materialRequestsData.filter(r => r.status === 'approved').length,
        totalValue: materialRequestsData.reduce((sum, r) => sum + (r.totalMaterialCost || 0), 0)
      };

      // Pipeline Analysis
      const pendingDeals = allDeals.filter(d => 
        d.deal_data.status === 'Väntande' || d.deal_data.status === 'projekterad'
      ).length;

      // Seasonal Trends (based on available data)
      const seasonalData = this.analyzeSeasonalTrends(allDeals);

      return {
        totalSales,
        monthlySales,
        monthlyGrowth,
        activeProjects: activeProjects.length,
        pendingDeals,
        conversionRate,
        avgDealSize: Math.round(avgDealSize),
        grossMargin,
        teamPerformance,
        geographicData,
        materialStats,
        seasonalData,
        financialData: {
          totalRevenue: totalSales,
          totalCosts,
          grossMargin,
          netProfit: totalSales - totalCosts,
          outstandingInvoices: pendingDeals * avgDealSize * 0.3, // Estimate
          cashFlow: monthlySales - (monthlyCompletedDeals.length * avgDealSize * 0.6)
        }
      };
    } catch (error) {
      console.error("Error calculating admin dashboard stats:", error);
      throw error;
    }
  }

  private async calculateTeamPerformance(allDeals: any[], allCalculations: any[]) {
    // Group by user for team performance
    const userStats = new Map();
    
    allCalculations.forEach(calc => {
      const userId = calc.users.id;
      const userName = calc.users.name;
      
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          name: userName,
          calculations: 0,
          deals: 0,
          revenue: 0
        });
      }
      
      const stats = userStats.get(userId);
      stats.calculations++;
    });

    allDeals.forEach(deal => {
      const userId = deal.users.id;
      if (userStats.has(userId)) {
        const stats = userStats.get(userId);
        stats.deals++;
        stats.revenue += deal.calculations.totalCost || 0;
      }
    });

    return Array.from(userStats.values()).map(stats => ({
      name: stats.name,
      deals: stats.deals,
      revenue: stats.revenue,
      conversion: stats.calculations > 0 ? 
        Math.round((stats.deals / stats.calculations) * 100) : 0
    }));
  }

  private analyzeGeographicPerformance(allDeals: any[]) {
    const cityStats = new Map();
    
    allDeals.forEach(deal => {
      const address = deal.calculations.inputData?.customerAdress || '';
      const city = this.extractCityFromAddress(address);
      
      if (!cityStats.has(city)) {
        cityStats.set(city, { deals: 0, revenue: 0 });
      }
      
      const stats = cityStats.get(city);
      stats.deals++;
      stats.revenue += deal.calculations.totalCost || 0;
    });

    return Array.from(cityStats.entries()).map(([city, stats]) => ({
      city,
      deals: stats.deals,
      revenue: stats.revenue,
      avgDealSize: stats.deals > 0 ? Math.round(stats.revenue / stats.deals) : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }

  private extractCityFromAddress(address: string): string {
    // Extract city from Swedish address format
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : 'Okänd';
  }

  private analyzeSeasonalTrends(allDeals: any[]) {
    const monthlyData = new Array(12).fill(0).map(() => ({ deals: 0, revenue: 0 }));
    
    allDeals.forEach(deal => {
      const month = new Date(deal.calculations.createdAt).getMonth();
      monthlyData[month].deals++;
      monthlyData[month].revenue += deal.calculations.totalCost || 0;
    });

    return monthlyData.map((data, index) => ({
      month: index + 1,
      deals: data.deals,
      revenue: data.revenue
    }));
  }

  // Add predictive analytics and ROI calculations
  async getAdvancedAnalytics(): Promise<any> {
    try {
      const allDeals = await db
        .select()
        .from(deal_data)
        .innerJoin(calculations, eq(deal_data.calculationId, calculations.id))
        .innerJoin(users, eq(calculations.userId, users.id));

      const materialRequestsData = await db
        .select()
        .from(materialRequests);

      // ROI Analysis for ROT deduction impact
      const totalROTSavings = allDeals.reduce((sum, d) => 
        sum + (d.calculations.rotAvdrag || 0), 0);
      
      // Material efficiency analysis
      const materialEfficiency = this.calculateMaterialEfficiency(allDeals, materialRequestsData);
      
      // Capacity utilization
      const capacityAnalysis = this.calculateCapacityUtilization(allDeals);
      
      // Risk assessment
      const riskMetrics = this.calculateRiskMetrics(allDeals);

      return {
        rotImpact: {
          totalSavings: totalROTSavings,
          avgSavingsPerDeal: allDeals.length > 0 ? totalROTSavings / allDeals.length : 0,
          conversionBoost: 15 // Estimated percentage boost from ROT eligibility
        },
        materialEfficiency,
        capacityAnalysis,
        riskMetrics
      };
    } catch (error) {
      console.error("Error calculating advanced analytics:", error);
      throw error;
    }
  }

  private calculateMaterialEfficiency(allDeals: any[], materialRequests: any[]) {
    const totalMaterialCost = allDeals.reduce((sum, d) => 
      sum + (d.calculations.materialCost || 0), 0);
    const totalRequestedCost = materialRequests.reduce((sum, r) => 
      sum + (r.totalMaterialCost || 0), 0);
    
    return {
      totalOrdered: totalRequestedCost,
      totalUsed: totalMaterialCost,
      efficiencyRate: totalRequestedCost > 0 ? 
        Math.round((totalMaterialCost / totalRequestedCost) * 100) : 100,
      wasteReduction: Math.max(0, totalRequestedCost - totalMaterialCost)
    };
  }

  private calculateCapacityUtilization(allDeals: any[]) {
    // Assuming 2-person teams working 8 hours/day, 5 days/week
    const workingDaysPerMonth = 22;
    const hoursPerDay = 8;
    const teamsAvailable = 3; // Based on current team structure
    
    const monthlyCapacityHours = workingDaysPerMonth * hoursPerDay * teamsAvailable;
    const avgProjectDuration = 2; // Days per project (estimated)
    const currentMonthProjects = allDeals.filter(d => {
      const dealDate = new Date(d.calculations.createdAt);
      const currentMonth = new Date().getMonth();
      return dealDate.getMonth() === currentMonth;
    }).length;

    const utilisedHours = currentMonthProjects * avgProjectDuration * hoursPerDay;
    const utilization = Math.round((utilisedHours / monthlyCapacityHours) * 100);

    return {
      totalCapacity: monthlyCapacityHours,
      utilisedCapacity: utilisedHours,
      utilizationRate: utilization,
      availableCapacity: monthlyCapacityHours - utilisedHours,
      recommendedTeams: utilization > 85 ? teamsAvailable + 1 : teamsAvailable
    };
  }

  private calculateRiskMetrics(allDeals: any[]) {
    const pendingDeals = allDeals.filter(d => d.deal_data.status === 'Väntande');
    const oldPendingDeals = pendingDeals.filter(d => {
      const dealDate = new Date(d.calculations.createdAt);
      const daysSinceCreated = (new Date().getTime() - dealDate.getTime()) / (1000 * 3600 * 24);
      return daysSinceCreated > 14; // Deals pending for more than 2 weeks
    });

    const avgDealValue = allDeals.length > 0 ? 
      allDeals.reduce((sum, d) => sum + (d.calculations.totalCost || 0), 0) / allDeals.length : 0;

    return {
      pendingDealsAtRisk: oldPendingDeals.length,
      potentialLostRevenue: oldPendingDeals.length * avgDealValue * 0.5, // 50% risk factor
      followUpRecommendations: oldPendingDeals.length,
      weatherRiskFactor: this.calculateWeatherRisk()
    };
  }

  private calculateWeatherRisk(): number {
    // Swedish weather risk assessment based on season
    const currentMonth = new Date().getMonth();
    const winterMonths = [11, 0, 1, 2]; // Dec, Jan, Feb, Mar
    const riskySeason = winterMonths.includes(currentMonth);
    return riskySeason ? 30 : 10; // 30% risk in winter, 10% in other seasons
  }

  // Material Requests Management
  async getMaterialRequests(): Promise<MaterialRequest[]> {
    const requests = await db
      .select()
      .from(materialRequests)
      .orderBy(desc(materialRequests.createdAt));
    return requests;
  }

  async createMaterialRequest(materialRequest: Omit<MaterialRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MaterialRequest> {
    const [request] = await db
      .insert(materialRequests)
      .values({
        ...materialRequest,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return request;
  }

  async updateMaterialRequest(id: number, updates: Partial<MaterialRequest>): Promise<MaterialRequest> {
    const [request] = await db
      .update(materialRequests)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(materialRequests.id, id))
      .returning();
    
    if (!request) {
      throw new Error("Material request not found");
    }
    
    return request;
  }

  async deleteMaterialRequest(id: number): Promise<void> {
    await db.delete(materialRequests).where(eq(materialRequests.id, id));
  }

  async getMaterialRequestStats(): Promise<{ pending: number; approved: number; ordered: number; delivered: number; totalCost: number }> {
    const requests = await db.select().from(materialRequests);
    
    const stats = {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      ordered: requests.filter(r => r.status === 'ordered').length,
      delivered: requests.filter(r => r.status === 'delivered').length,
      totalCost: requests.reduce((sum, r) => sum + (r.totalMaterialCost || 0), 0),
    };

    return stats;
  }

  async exportMaterialRequests(filters?: { status?: string; priority?: string }): Promise<string> {
    let query = db.select().from(materialRequests);
    
    if (filters?.status && filters.status !== 'all') {
      query = query.where(eq(materialRequests.status, filters.status));
    }
    
    if (filters?.priority && filters.priority !== 'all') {
      query = query.where(eq(materialRequests.priority, filters.priority));
    }
    
    const requests = await query;
    
    // Generate CSV
    const headers = [
      'ID',
      'Kund',
      'Adress',
      'Projekt ID',
      'Status',
      'Prioritet',
      'Materialkostnad',
      'Projektstart',
      'Beställt',
      'Leverans',
      'Anteckningar'
    ];
    
    const csvData = requests.map(request => [
      request.id,
      request.customerName,
      request.customerAddress,
      request.projectId || '',
      request.status,
      request.priority,
      request.totalMaterialCost,
      request.projectStartDate || '',
      request.createdAt?.toISOString().split('T')[0] || '',
      request.estimatedDelivery || request.actualDelivery || '',
      request.notes || ''
    ]);
    
    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csv;
  }

  // Employee Management Methods
  async getAllEmployees(): Promise<Employee[]> {
    return db.select().from(users).orderBy(asc(users.name));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const hashedPassword = employee.password ? await hashPassword(employee.password) : null;
    
    // Only create user account for roles that need system access
    const needsAccount = ['Projektledare', 'Ekonomi', 'Säljchef', 'Säljare'].includes(employee.role);
    
    if (needsAccount && !employee.username) {
      throw new Error("Användarnamn krävs för denna roll");
    }

    if (needsAccount && !employee.password) {
      throw new Error("Lösenord krävs för denna roll");
    }

    const userData = {
      name: employee.name,
      email: employee.email || null,
      phone: employee.phone,
      role: employee.role,
      username: needsAccount ? employee.username! : `${employee.name.replace(/\s+/g, '').toLowerCase()}_${Date.now()}`,
      password: needsAccount ? hashedPassword! : await hashPassword('temp_password_no_access'),
      isAdmin: false,
      isActive: employee.isActive,
    };

    const [created] = await db.insert(users).values(userData).returning();
    return created;
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>): Promise<Employee> {
    const updateData: any = { ...employeeData };
    
    if (employeeData.password) {
      updateData.password = await hashPassword(employeeData.password);
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    // Don't actually delete, just deactivate
    await db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, id));
  }

  async toggleEmployeeStatus(id: number): Promise<Employee> {
    const employee = await this.getUser(id);
    if (!employee) {
      throw new Error("Anställd hittades inte");
    }

    const [updated] = await db.update(users)
      .set({ isActive: !employee.isActive })
      .where(eq(users.id, id))
      .returning();
    
    return updated;
  }

  // City management methods
  async getCities(): Promise<City[]> {
    const cityList = await db.select().from(cities).orderBy(asc(cities.name));
    return cityList;
  }

  async createCity(cityData: InsertCity): Promise<City> {
    const [city] = await db
      .insert(cities)
      .values(cityData)
      .returning();
    return city;
  }

  async updateCity(id: string, cityData: Partial<InsertCity>): Promise<City> {
    const [city] = await db
      .update(cities)
      .set(cityData)
      .where(eq(cities.id, id))
      .returning();
    return city;
  }

  async deleteCity(id: string): Promise<void> {
    await db.delete(cities).where(eq(cities.id, id));
  }

  async toggleCityStatus(id: string): Promise<City> {
    const [city] = await db
      .update(cities)
      .set({ isActive: sql`NOT ${cities.isActive}` })
      .where(eq(cities.id, id))
      .returning();
    return city;
  }

  // Project Leader functionality
  async getProjectLeaderTickets(userId: number): Promise<any[]> {
    try {
      // Get all active projects with their deal data (which may contain files)
      const projectsQuery = await db
        .select({
          project: projects,
          dealData: deal_data
        })
        .from(projects)
        .leftJoin(deal_data, eq(projects.calculationId, deal_data.calculationId))
        .where(eq(projects.overallStatus, 'active'))
        .orderBy(desc(projects.createdAt));

      // If no projects exist, create some test data for demonstration
      if (projectsQuery.length === 0) {
        console.log("No projects found, creating test data for project leader dashboard...");
        await this.createTestProjectData();
        // Re-fetch after creating test data
        const newProjectsQuery = await db
          .select({
            project: projects,
            dealData: deal_data
          })
          .from(projects)
          .leftJoin(deal_data, eq(projects.calculationId, deal_data.calculationId))
          .where(eq(projects.overallStatus, 'active'))
          .orderBy(desc(projects.createdAt));
        return this.transformProjectsToTickets(newProjectsQuery);
      }

      return this.transformProjectsToTickets(projectsQuery);
    } catch (error) {
      console.error("Error fetching project leader tickets:", error);
      throw new Error("Failed to fetch project leader tickets");
    }
  }

  async updateProjectLeaderTicket(ticketId: number, updateData: any): Promise<any> {
    try {
      console.log(`Updating project ticket ${ticketId} with:`, updateData);
      
      // Update the project in the database
      const [updatedProject] = await db
        .update(projects)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(projects.id, ticketId))
        .returning();

      if (!updatedProject) {
        throw new Error('Project not found');
      }

      // Transform back to ticket format
      return this.transformProjectToTicket(updatedProject);
    } catch (error) {
      console.error("Error updating project leader ticket:", error);
      throw new Error("Failed to update project ticket");
    }
  }

  private transformProjectToTicket(project: any) {
    return {
      id: project.id,
      calculationId: project.calculationId,
      customerName: `${project.kundFirstName} ${project.kundLastName}`,
      customerPhone: project.tel1,
      customerEmail: project.tel2, // Using tel2 as email placeholder
      customerAdress: project.address,
      status: project.overallStatus === 'active' ? 'in_progress' : project.overallStatus,
      priority: 'medium', // Default priority
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      totalPrice: project.platskassa || 0,
      area: project.totalYta,
      roofType: project.typAvTak,
      materialType: project.valAvTakmaterial,
      bortforslingStatus: project.borttagningStatus,
      bortforslingStatusDate: project.borttagningStatusDate,
      bortforslingDate: project.borttagningCompletedDate,
      byggställningStatus: project.stallningStatus,
      byggställningStatusDate: project.stallningStatusDate,
      byggställningDate: project.stallningCompletedDate,
      materialStatus: project.materialStatus,
      materialStatusDate: project.materialStatusDate,
      materialDate: project.materialCompletedDate,
      materialLeverans1Date: project.materialLeverans1Date,
      materialLeverans2Date: project.materialLeverans2Date,
      teamAssigned: project.teamAssigned,
      platslare: project.platslare,
      notes: project.notes || '',
      // Project files
      imageFileUrls: project.imageFileUrls || [],
      agreementFileUrl: project.agreementFileUrl || null
    };
  }

  async updateProjectLeaderTicket(ticketId: number, updateData: any): Promise<any> {
    try {
      // Map ticket phase updates to project fields
      const projectUpdateData: any = {};
      
      if (updateData.bortforslingStatus !== undefined) {
        projectUpdateData.borttagningStatus = updateData.bortforslingStatus;
        if (updateData.bortforslingStatus === 'completed') {
          projectUpdateData.borttagningCompletedDate = new Date();
        }
      }
      
      if (updateData.byggställningStatus !== undefined) {
        projectUpdateData.stallningStatus = updateData.byggställningStatus;
        if (updateData.byggställningStatus === 'completed') {
          projectUpdateData.stallningCompletedDate = new Date();
        }
      }
      
      if (updateData.materialStatus !== undefined) {
        projectUpdateData.materialStatus = updateData.materialStatus;
        if (updateData.materialStatus === 'delivered') {
          projectUpdateData.materialCompletedDate = new Date();
        }
      }
      
      if (updateData.materialLeverans2Status !== undefined) {
        projectUpdateData.materialLeverans2Status = updateData.materialLeverans2Status;
        if (updateData.materialLeverans2Date) {
          projectUpdateData.materialLeverans2Date = updateData.materialLeverans2Date;
        }
      }

      // Update customer info if provided
      if (updateData.customerName) projectUpdateData.customerName = updateData.customerName;
      if (updateData.customerPhone) projectUpdateData.customerPhone = updateData.customerPhone;
      if (updateData.customerEmail) projectUpdateData.customerEmail = updateData.customerEmail;
      if (updateData.customerAdress) projectUpdateData.customerAdress = updateData.customerAdress;
      if (updateData.notes !== undefined) projectUpdateData.notes = updateData.notes;
      
      // Update plåtslagare info if provided
      if (updateData.platslare !== undefined) projectUpdateData.platslare = updateData.platslare;
      if (updateData.platslareCompleted !== undefined) projectUpdateData.platslareCompleted = updateData.platslareCompleted;

      projectUpdateData.updatedAt = new Date();

      const [updatedProject] = await db
        .update(projects)
        .set(projectUpdateData)
        .where(eq(projects.id, ticketId))
        .returning();

      // Transform back to ticket format
      const ticket = {
        id: updatedProject.id,
        calculationId: updatedProject.calculationId,
        customerName: updatedProject.customerName,
        customerPhone: updatedProject.customerPhone,
        customerEmail: updatedProject.customerEmail,
        customerAdress: updatedProject.customerAdress,
        totalPrice: updatedProject.totalPrice,
        area: updatedProject.area,
        roofType: updatedProject.roofType,
        materialType: updatedProject.materialType,
        status: this.getProjectTicketStatus(updatedProject),
        priority: this.getProjectTicketPriority(updatedProject),
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
        bortforslingStatus: updatedProject.borttagningStatus || 'pending',
        byggställningStatus: updatedProject.stallningStatus || 'pending',
        materialStatus: updatedProject.materialStatus || 'pending',
        bortforslingDate: updatedProject.borttagningCompletedDate,
        byggställningDate: updatedProject.stallningCompletedDate,
        materialDate: updatedProject.materialCompletedDate,
        notes: updatedProject.notes
      };

      return ticket;
    } catch (error) {
      console.error("Error updating project leader ticket:", error);
      throw new Error("Failed to update project leader ticket");
    }
  }

  private getProjectTicketStatus(project: any): string {
    const stallningDone = project.stallningStatus === 'completed';
    const borttagningDone = project.borttagningStatus === 'completed';
    const materialDone = project.materialStatus === 'delivered';

    if (stallningDone && borttagningDone && materialDone) {
      return 'completed';
    }
    if (stallningDone || borttagningDone || materialDone) {
      return 'in_progress';
    }
    if (project.stallningStatus === 'scheduled' || project.borttagningStatus === 'scheduled' || project.materialStatus === 'ordered') {
      return 'approved';
    }
    return 'review';
  }

  private getProjectTicketPriority(project: any): string {
    const createdDate = new Date(project.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreated > 7) return 'high';
    if (daysSinceCreated > 3) return 'medium';
    return 'low';
  }

  private transformProjectsToTickets(projectsWithDeal: any[]): any[] {
    return projectsWithDeal.map(({ project, dealData }) => ({
      id: project.id,
      calculationId: project.calculationId,
      customerName: `${project.kundFirstName} ${project.kundLastName}`,
      customerPhone: project.tel1,
      customerEmail: `${project.kundFirstName.toLowerCase()}.${project.kundLastName.toLowerCase()}@email.com`,
      customerAdress: project.address,
      totalPrice: 250000, // Default price for display
      area: project.totalYta,
      roofType: project.typAvTak || 'Sadel',
      materialType: project.valAvTakmaterial || 'Plåt',
      status: this.getProjectTicketStatus(project),
      priority: this.getProjectTicketPriority(project),
      createdAt: project.createdAt,
      updatedAt: project.createdAt,
      // Map project phases to ticket phases
      bortforslingStatus: project.borttagningStatus || 'pending',
      byggställningStatus: project.stallningStatus || 'pending',
      materialStatus: project.materialStatus || 'pending',
      bortforslingDate: project.borttagningCompletedDate,
      byggställningDate: project.stallningCompletedDate,
      materialDate: project.materialCompletedDate,
      materialLeverans1Date: project.materialLeverans1Date,
      materialLeverans2Date: project.materialLeverans2Date,
      materialLeverans2Status: project.materialLeverans2Status || 'pending',
      teamAssigned: project.teamAssigned,
      platslare: project.platslare,
      platslareCompleted: project.platslareCompleted || false,
      notes: project.ovrigt || '',
      // Project files - from project table or deal data
      imageFileUrls: project.imageFileUrls || dealData?.imageFileUrls || [
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400'
      ],
      agreementFileUrl: project.agreementFileUrl || dealData?.agreementFileUrl || '/uploads/test-agreement.pdf'
    }));
  }

  private async createTestProjectData(): Promise<void> {
    try {
      // Create test projects for demonstration
      const testProjects = [
        {
          kundnummer: "KN001",
          tel1: "070-123-4567",
          tel2: "",
          kundFirstName: "Anna",
          kundLastName: "Andersson", 
          address: "Storgatan 15, Skellefteå",
          startDatum: new Date(),
          totalYta: 120,
          typAvTak: "Sadel",
          valAvTakmaterial: "Plåt Sanda",
          farg: "Röd",
          signaturUrl: "/test-signature.png",
          kundFirstName2: "Anna",
          kundLastName2: "Andersson",
          overallStatus: "active",
          stallningStatus: "pending",
          borttagningStatus: "pending", 
          materialStatus: "pending",
          ovrigt: "Kund vill ha extra snörasskydd på norra sidan",
        },
        {
          kundnummer: "KN002",
          tel1: "070-987-6543",
          tel2: "",
          kundFirstName: "Erik",
          kundLastName: "Eriksson",
          address: "Parkgatan 8, Skellefteå",
          startDatum: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          totalYta: 85,
          typAvTak: "Mansard",
          valAvTakmaterial: "Tegelpannor",
          farg: "Svart",
          signaturUrl: "/test-signature.png",
          kundFirstName2: "Erik",
          kundLastName2: "Eriksson",
          overallStatus: "active",
          stallningStatus: "scheduled",
          borttagningStatus: "completed",
          materialStatus: "ordered",
          borttagningCompletedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          ovrigt: "Komplicerat tak med många hörn, extra tid behövs",
        },
        {
          kundnummer: "KN003",
          tel1: "070-555-1234",
          tel2: "",
          kundFirstName: "Maria",
          kundLastName: "Pettersson",
          address: "Lundgatan 22, Skellefteå",
          startDatum: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          totalYta: 180,
          typAvTak: "Sadel",
          valAvTakmaterial: "Plåt Coilcoating",
          farg: "Blå",
          signaturUrl: "/test-signature.png",
          kundFirstName2: "Maria",
          kundLastName2: "Pettersson",
          overallStatus: "active",
          stallningStatus: "completed",
          borttagningStatus: "scheduled",
          materialStatus: "pending",
          stallningCompletedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          ovrigt: "Stort projekt, behöver extra material leverans",
        }
      ];

      for (const project of testProjects) {
        await db.insert(projects).values(project).onConflictDoNothing();
      }

      console.log("Test project data created successfully");
    } catch (error) {
      console.error("Error creating test project data:", error);
    }
  }
  // System Settings
  async getSystemSetting(settingKey: string): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(system_settings)
        .where(eq(system_settings.settingKey, settingKey))
        .limit(1);

      if (result.length === 0) {
        // Return default value for location dropdown - disabled by default
        if (settingKey === 'location_dropdown_enabled') {
          return false;
        }
        return false;
      }

      return result[0].settingValue;
    } catch (error) {
      console.error("Error fetching system setting:", error);
      return false;
    }
  }

  async updateSystemSetting(settingKey: string, settingValue: boolean): Promise<SystemSetting> {
    try {
      const existingSetting = await db
        .select()
        .from(system_settings)
        .where(eq(system_settings.settingKey, settingKey))
        .limit(1);

      if (existingSetting.length === 0) {
        // Create new setting
        const [newSetting] = await db
          .insert(system_settings)
          .values({
            settingKey,
            settingValue,
            description: this.getSettingDescription(settingKey),
          })
          .returning();
        return newSetting;
      } else {
        // Update existing setting
        const [updatedSetting] = await db
          .update(system_settings)
          .set({
            settingValue,
            updatedAt: new Date(),
          })
          .where(eq(system_settings.settingKey, settingKey))
          .returning();
        return updatedSetting;
      }
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw new Error("Failed to update system setting");
    }
  }

  private getSettingDescription(settingKey: string): string {
    switch (settingKey) {
      case 'location_dropdown_enabled':
        return 'Controls whether the location dropdown is shown in the navbar for sales_admin and project_admin roles';
      default:
        return 'System setting';
    }
  }

  // User City Access Management
  async getUserCityAccess(userId: number): Promise<string[]> {
    try {
      const result = await db
        .select({ cityId: userCityAccess.cityId })
        .from(userCityAccess)
        .where(eq(userCityAccess.userId, userId));

      return result.map(row => row.cityId);
    } catch (error) {
      console.error("Error fetching user city access:", error);
      throw new Error("Failed to fetch user city access");
    }
  }

  async setUserCityAccess(userId: number, cityIds: string[]): Promise<void> {
    try {
      // First, remove all existing access for this user
      await db
        .delete(userCityAccess)
        .where(eq(userCityAccess.userId, userId));

      // Then add new access entries
      if (cityIds.length > 0) {
        const accessEntries = cityIds.map(cityId => ({
          userId,
          cityId,
        }));
        
        await db.insert(userCityAccess).values(accessEntries);
      }
    } catch (error) {
      console.error("Error setting user city access:", error);
      throw new Error("Failed to set user city access");
    }
  }

  async getUsersWithCityAccess(): Promise<(User & { accessibleCities: string[] })[]> {
    try {
      const allUsers = await db.select().from(users).where(eq(users.isActive, true));
      
      const usersWithAccess = await Promise.all(
        allUsers.map(async (user) => {
          const accessibleCities = await this.getUserCityAccess(user.id);
          return {
            ...user,
            accessibleCities,
          };
        })
      );

      return usersWithAccess;
    } catch (error) {
      console.error("Error fetching users with city access:", error);
      throw new Error("Failed to fetch users with city access");
    }
  }
}

export const storage = new DatabaseStorage();