/**
 * DATABASE SCHEMA DEFINITIONS
 * 
 * This file contains all database table definitions for the Swedish roofing management system.
 * 
 * Key Business Entities:
 * - Users: Four-tier role system (head_admin, sales_admin, project_admin, sales_person)
 * - Calculations: Roofing cost estimates created by sales personnel
 * - Projects: Work orders with Gantt scheduling for carpenter teams
 * - Deals: Sales pipeline tracking customer responses
 * - Configuration: Material prices, roof types, system settings
 * 
 * Swedish Business Context:
 * - ROT tax deduction: 50% of labor costs can be deducted by property owners
 * - Material distributors: Partnership with "Beijer Bygg" for supply chain
 * - Two-person carpenter teams: Standard crew size for roofing projects
 */

import {
  pgTable,
  date,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { number, z } from "zod";

// Define the cost structure type that will be used for all fields
const costSchema = z.object({
  material: z.number(),
  arbete: z.number(),
  unitType: z.enum(["Antal", "Antal Meter"]).default("Antal"),
});

// Define the city schema
export const citySchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

// Define the chimney covering types
export const chimneyCoveringSchema = z.object({
  id: z.string(),
  name: z.string(),
  materialCost: z.number(),
  laborCost: z.number(),
  sortOrder: z.number(),
});

// Define the roof type options
export const roofTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  materialCost: z.number(),
  sortOrder: z.number(),
});

export const materialTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  costPerKvm: z.number(),
  sortOrder: z.number(),
});

export const scaffoldingSizeSchema = z.object({
  id: z.string(),
  name: z.string(),
  cost: z.number(),
  sortOrder: z.number(),
});

// Cities table
export const cities = pgTable("cities", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User city access table - many-to-many relationship
export const userCityAccess = pgTable("user_city_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  cityId: text("city_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Database tables for options
export const roofTypes = pgTable("roof_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  materialCost: real("material_cost").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const materialTypes = pgTable("material_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  costPerKvm: real("cost_per_kvm").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const scaffoldingSizes = pgTable("scaffolding_sizes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cost: real("cost").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

// Add new table for chimney coverings
export const chimneyTypes = pgTable("chimney_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  materialCost: real("material_cost").notNull(),
  laborCost: real("labor_cost").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

// Dynamic prices schema
export const pricesSchema = z.record(z.string(), costSchema);

// Dynamic calculation schema
export const calculationSchema = z.object({
  customerName: z.string().min(1, "Kundens namn krävs"),
  customerPhone: z.string().min(1, "Kundens telefonnummer krävs"),
  customerEmail: z.string().min(1, "Kundens mail krävs"),
  customerAdress: z.string().min(1, "Kundens adress krävs"),
  customerOwnerAmount: z.number().min(1, "Antal ägare krävs"),
  roofType: z.object({
    id: z.string(),
    name: z.string(),
  }),
  materialType: z.object({
    id: z.string(),
    name: z.string(),
  }),
  scaffoldingSize: z.object({
    id: z.string(),
    name: z.string(),
  }),
  chimneyType: z.object({
    id: z.string(),
    name: z.string(),
  }),
  dukType: z.string(),
  twoFloorScaffolding: z.boolean(),
  advancedScaffolding: z.boolean(),
  area: z.number().min(1, "Area krävs"),
  raspont: z.number().min(0, "Area krävs"),
  raspontRivning: z.boolean(),
  // Other numeric fields
  snörasskydd: z.number().default(0),
  hängränna: z.number().default(0),
  ränndalar: z.number().default(0),
  fotplåt: z.number().default(0),
  vindskivor: z.number().default(0),
  takstege: z.number().default(0),
  fönster: z.number().default(0),
  stuprör: z.number().default(0),
  ventilation: z.number().default(0),
  avluftning: z.number().default(0),
  extra: z.string().optional(),
  milage: z.number().min(0, "Milersättning måste vara minst 0").default(0),
});

export const demoSchema = z.object({
  id: z.number().min(1, "Id krävs"),
  customerName: z.string().min(1, "Kundens namn krävs"),
  adress: z.string().min(1, "Kundens adress krävs"),
  date: z.date(),
  price: z.number().min(1, "Pris krävs"),
  sellerId: z.number().optional(),
  sellerName: z.string().optional(),
  comments: z.array(z.string()).optional(),
});

export const dealSchema = z.object({
  id: z.number().min(1, "Id krävs"),
  dealId: z.string().min(1, "Affärs Id krävs"),
  dealStatus: z.string().min(1, "Affärs status krävs"),
  customerName: z.string().min(1, "Kundens namn krävs"),
  adress: z.string().min(1, "Kundens adress krävs"),
  date: z.date(),
  price: z.number().min(1, "Pris krävs"),
  sellerId: z.number().optional(),
  sellerName: z.string().optional(),
  comments: z.array(z.string()).optional(),
  imageLinks: z.array(z.string()).optional(),
});

export const calculationProcess = z.object({
  isDeal: z.boolean(),
  reasonNoDeal: z.string().optional(),
  revisit: z.boolean().optional(),
  agreementFile: z.instanceof(File).optional(),
  projectImages: z.array(z.instanceof(File)).optional(),
  processNotes: z.string().optional(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("sales_person"), // sales_admin, project_admin, sales_person
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  cityId: text("city_id").references(() => cities.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  priceData: jsonb("price_data")
    .notNull()
    .$type<
      Record<
        string,
        { material: number; arbete: number; unitType: "Antal" | "Antal Meter" }
      >
    >(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalCost: integer("total_cost").notNull(),
  laborCost: integer("labor_cost").notNull(),
  materialCost: integer("material_cost").notNull(),
  marginPrice: integer("margin_price"),
  marginPercent: integer("margin_percent"),
  rotAvdrag: integer("rot_avdrag"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  calculationType: text("calculation_type").notNull(),
  demoRevisit: boolean("demo_revisit"),
  inputData: jsonb("input_data")
    .notNull()
    .$type<z.infer<typeof calculationSchema>>(),
});

export const calculation_details = pgTable("calculation_details", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: integer("value").notNull(),
  valueSuffix: text("value_suffix").notNull(),
});

export const material_costs = pgTable("material_costs", {
  name: text("name").primaryKey(),
  materialCost: integer("material_cost").notNull(),
  laborCost: integer("labor_cost").notNull(),
});

export const system_settings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: boolean("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  calculationId: integer("calculation_id").notNull(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
});

export const deal_data = pgTable('deal_data', {
  calculationId: integer('calculation_id').references(() => calculations.id).unique().notNull(), 
  dealIdString: text('deal_id'),
  agreementFileUrl: text('agreement_file_url'),
  imageFileUrls: text('image_file_urls').array(),
  status: text('deal_status'),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  calculationId: serial("calculation_id").unique().notNull(),
  kundnummer: text("kundnummer").notNull(),
  tel1: text("tel1").notNull(),
  tel2: text("tel2").default(''),
  kundFirstName: text("kund_first_name").notNull(),
  kundLastName: text("kund_last_name").notNull(),
  address: text("address").notNull(),
  startDatum: date("start_datum"),
  slutDatum: date("slut_datum"),

  // Project workflow status tracking (matching Excel structure)
  projektCode: text("projekt_code"), // P101, P103, etc.
  stallningStatus: text("stallning_status").default("pending"), // scaffolding status
  stallningStatusDate: timestamp("stallning_status_date"),
  stallningCompletedDate: date("stallning_completed_date"),
  borttagningStatus: text("borttagning_status").default("pending"), // removal status  
  borttagningStatusDate: timestamp("borttagning_status_date"),
  borttagningCompletedDate: date("borttagning_completed_date"),
  materialStatus: text("material_status").default("pending"), // material status
  materialStatusDate: timestamp("material_status_date"),
  materialCompletedDate: date("material_completed_date"),
  platskassa: real("platskassa").default(0), // cash/payment tracking
  materialLeverans1Date: date("material_leverans1_date"), // material delivery 1
  materialLeverans2Date: date("material_leverans2_date"), // material delivery 2
  materialLeverans2Status: text("material_leverans2_status").default("pending"), // material delivery 2 status
  teamAssigned: text("team_assigned").default("Team A"), // assigned carpenter team
  platslare: text("platslare").default("Isab/Ske plåt"), // plåtslagare company
  platslareCompleted: boolean("platslare_completed").default(false), // plåtslagare completion status
  slutbesiktningDate: date("slutbesiktning_date"), // final inspection
  faktura1Status: text("faktura1_status").default("pending"), // invoice status
  faktura1Date: date("faktura1_date"),
  overallStatus: text("overall_status").default("active"), // active, completed, on_hold

  // Contact persons
  projektorFirstName: text("projektor_first_name"),
  projektorLastName: text("projektor_last_name"),
  projektorTel: text("projektor_tel"),
  projektledareFirstName: text("projektledare_first_name"),
  projektledareLastName: text("projektledare_last_name"),
  projektledareTel: text("projektledare_tel"),

  // Roof details
  lutning: real("lutning").notNull().default(0),
  takbredd: real("takbredd").notNull().default(0),
  takfall: real("takfall").notNull().default(0),
  takfotTillMark: real("takfot_till_mark").notNull().default(0),
  totalYta: real("total_yta").notNull(),
  typAvTak: text("typ_av_tak").notNull(),
  raspont: real("raspont").notNull().default(0),

  // Materials
  valAvTakmaterial: text("val_av_takmaterial").notNull(),
  farg: text("farg").notNull(),

  // Accessories
  snorasskydd: real("snorasskydd").default(0),
  placeringSnorasskydd: text("placering_snorasskydd"),
  snorasskyddFarg: text("snorasskydd_farg"),

  hangranna: real("hangranna").default(0),
  hangrannaFarg: text("hangranna_farg"),

  ranndalar: real("ranndalar").default(0),
  ranndalarFarg: text("ranndalar_farg"),

  fotplat: real("fotplat").default(0),
  fotplatFarg: text("fotplat_farg"),

  vindskiveplat: real("vindskiveplat").default(0),
  vindskiveplatFarg: text("vindskiveplat_farg"),

  // Gantt timeline fields
  inGanttTimeline: boolean("in_gantt_timeline").default(false),
  planningStartDate: date("planning_start_date"),
  planningEndDate: date("planning_end_date"),

  stupror: real("stupror").default(0),
  stuprorFarg: text("stupror_farg"),

  takstege: real("takstege").default(0),
  takstegeFarg: text("takstege_farg"),

  // Chimney/Vents
  avsatsSkorsten: text("avsats_skorsten"),
  skorsten: text("skorsten"),
  skorstenFarg: text("skorsten_farg"),

  avluftning: real("avluftning").default(0),
  ventilation: real("ventilation").default(0),

  // Additions
  malaVindskivor: boolean("mala_vindskivor").default(false),
  vaderskyddSkorsten: boolean("vaderskydd_skorsten").default(false),

  // Other notes
  ovrigt: text("ovrigt"),

  // Customer 2
  kundFirstName2: text("kund_first_name2").notNull(),
  kundLastName2: text("kund_last_name2").notNull(),

  preliminarROT: real("preliminar_rot").default(0),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),

  signaturUrl: text("signatur_url").notNull(),
  teamId: integer(),
  
  // Project files
  imageFileUrls: text("image_file_urls").array().default([]),
  agreementFileUrl: text("agreement_file_url"),
});

export const projectTeams = pgTable("project_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// Material requests table for distributor management
export const materialRequests = pgTable("material_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  calculationId: integer("calculation_id").references(() => calculations.id, {
    onDelete: "cascade",
  }),
  requestedBy: integer("requested_by").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerAddress: text("customer_address").notNull(),
  projectStartDate: date("project_start_date"),
  materialList: jsonb("material_list").notNull(), // JSON array of materials with quantities
  totalMaterialCost: real("total_material_cost").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, ordered, delivered, cancelled
  priority: text("priority").notNull().default("normal"), // urgent, high, normal, low
  notes: text("notes"),
  distributorNotes: text("distributor_notes"),
  orderReference: text("order_reference"),
  estimatedDelivery: date("estimated_delivery"),
  actualDelivery: date("actual_delivery"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
});

export const employeeSchema = z.object({
  name: z.string().min(1, "Namn krävs"),
  email: z.string().email("Ogiltig e-postadress").optional(),
  phone: z.string().min(1, "Telefonnummer krävs"),
  role: z.enum(["sales_admin", "project_admin", "sales_person"], {
    errorMap: () => ({ message: "Välj en giltig roll" })
  }),
  username: z.string().min(3, "Användarnamn måste vara minst 3 tecken").optional(),
  password: z.string().min(6, "Lösenord måste vara minst 6 tecken").optional(),
  isActive: z.boolean().default(true),
});

export const formDataSchema = z.object({
  // --- Customer Info ---
  calculationId: z.number(),
  kundnummer: z.string().min(1, "Kundnummer är obligatoriskt"),
  tel1: z.string().min(5, "Telefonnummer är obligatoriskt"), // Example min length
  tel2: z.string().optional(),
  kundFirstName: z.string().min(1, "Kundens förnamn är obligatoriskt"),
  kundLastName: z.string().min(1, "Kundens efternamn är obligatoriskt"),
  address: z.string().min(5, "Adress är obligatorisk"),
  startDatum: z.preprocess((arg) => {
      if (typeof arg == "string") {
        const date = new Date(arg);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return arg;
    }, z.date({
      required_error: "Startdatum krävs",
      invalid_type_error: "Start date must be a valid date string (ISO 8601 format preferred)",
    })),
  slutDatum: z.preprocess((arg) => {
      if (typeof arg == "string") {
        const date = new Date(arg);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return arg;
    }, z.date({
      required_error: "Slutdatum krävs",
      invalid_type_error: "End date must be a valid date string (ISO 8601 format preferred)",
    })).optional(),

  // Contact Persons (Make required if needed)
  projektorFirstName: z.string().optional(), // Or .min(1, "...") if required
  projektorLastName: z.string().optional(),
  projektorTel: z.string().optional(),
  projektledareFirstName: z.string().optional(),
  projektledareLastName: z.string().optional(),
  projektledareTel: z.string().optional(),

  // Roof Details
  lutning: z.number({ invalid_type_error: "Lutning måste vara ett nummer"}).positive("Lutning måste vara större än 0"),
  takbredd: z.number({ invalid_type_error: "Takbredd måste vara ett nummer"}).positive("Takbredd måste vara större än 0"),
  takfall: z.number({ invalid_type_error: "Takfall måste vara ett nummer"}).positive("Takfall måste vara större än 0"),
  takfotTillMark: z.number({ invalid_type_error: "Takfot till mark måste vara ett nummer"}).min(0, "Takfot till mark måste anges"),
  totalYta: z.number({ invalid_type_error: "Total yta måste vara ett nummer"}).positive("Total yta måste vara större än 0"),
  typAvTak: z.string().nonempty("Typ av tak måste väljas"), // <--- Ensures not ""
  raspont: z.number({ invalid_type_error: "Råspont måste vara ett nummer"}).min(0, "Råspont måste anges"),

  // Material/Color
  valAvTakmaterial: z.string().nonempty("Takmaterial måste väljas"), // <--- Ensures not ""
  farg: z.string().nonempty("Färg måste väljas"), // <--- Ensures not ""

  // Accessories (Numbers - Decide if 0 is allowed or if >0 is needed)
  snorasskydd: z.number({ invalid_type_error: "Snörasskydd (meter) måste vara ett nummer"}).min(0, "Snörasskydd (meter) måste anges"),
  placeringSnorasskydd: z.string().optional(),
  snorasskyddFarg: z.string().optional(), // Or .nonempty("...") if required when snorasskydd > 0

  hangranna: z.number({ invalid_type_error: "Hängränna (meter) måste vara ett nummer"}).min(0, "Hängränna (meter) måste anges"),
  hangrannaFarg: z.string().optional(), // Or .nonempty("...") if required

  ranndalar: z.number({ invalid_type_error: "Ränndalar (meter) måste vara ett nummer"}).min(0, "Ränndalar (meter) måste anges"),
  ranndalarFarg: z.string().optional(),

  fotplat: z.number({ invalid_type_error: "Fotplåt (meter) måste vara ett nummer"}).min(0, "Fotplåt (meter) måste anges"),
  fotplatFarg: z.string().optional(),

  vindskiveplat: z.number({ invalid_type_error: "Vindskiveplåt (meter) måste vara ett nummer"}).min(0, "Vindskiveplåt (meter) måste anges"),
  vindskiveplatFarg: z.string().optional(),

  stupror: z.number({ invalid_type_error: "Stuprör (antal) måste vara ett nummer"}).min(0, "Stuprör (antal) måste anges"),
  stuprorFarg: z.string().optional(),

  takstege: z.number({ invalid_type_error: "Takstege (meter) måste vara ett nummer"}).min(0, "Takstege (meter) måste anges"),
  takstegeFarg: z.string().optional(),

  // Chimney/Vents
  avsatsSkorsten: z.string().optional(), // Or .nonempty("...") if required
  skorsten: z.string().nonempty("Skorstenstyp måste väljas"), // <--- Ensures not "" (for radios/selects mapping to string)
  skorstenFarg: z.string().optional(), // Or .nonempty("...") if required

  avluftning: z.number({ invalid_type_error: "Avluftning (antal) måste vara ett nummer"}).min(0, "Avluftning (antal) måste anges"),
  ventilation: z.number({ invalid_type_error: "Ventilation (antal) måste anges"}),

  // Additions
  tillagg: z.object({
    malaVindskivor: z.boolean(),
    vaderskyddSkorsten: z.boolean(),
  }),

  // Other
  ovrigt: z.string().optional(),

  kundFirstName2: z.string().min(1, "Kundens förnamn är obligatoriskt"),
  kundLastName2: z.string().min(1, "Kundens efternamn är obligatoriskt"),

  preliminarROT: z.number({ invalid_type_error: "Preliminärt ROT måste vara ett nummer"}).min(0, "Preliminärt ROT-avdrag måste anges"),
});

export type ProjectWithTeam = Project & {
  teamName: string | null;
  teamColor: string | null;
};

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Calculation = typeof calculations.$inferSelect;
export type CalculationInput = z.infer<typeof calculationSchema>;
export type Demo = z.infer<typeof demoSchema>;
export type Deal = z.infer<typeof dealSchema>;
export type CalculationProcess = z.infer<typeof calculationProcess>;
export type Prices = z.infer<typeof pricesSchema>;
export type RoofType = typeof roofTypes.$inferSelect;
export type MaterialType = typeof materialTypes.$inferSelect;
export type ScaffoldingSize = typeof scaffoldingSizes.$inferSelect;
export type ChimneyCovering = typeof chimneyTypes.$inferSelect;
export type FormDataSchemaType = z.infer<typeof formDataSchema>;
export type Project = typeof projects.$inferSelect;
export type MaterialRequest = typeof materialRequests.$inferSelect;
export type InsertEmployee = z.infer<typeof employeeSchema>;
export type Employee = typeof users.$inferSelect;

// City types
export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;
export const insertCitySchema = createInsertSchema(cities);
export type CityFormData = z.infer<typeof insertCitySchema>;

// User city access types
export type UserCityAccess = typeof userCityAccess.$inferSelect;
export type InsertUserCityAccess = typeof userCityAccess.$inferInsert;

// System settings types
export type SystemSetting = typeof system_settings.$inferSelect;
export type InsertSystemSetting = typeof system_settings.$inferInsert;