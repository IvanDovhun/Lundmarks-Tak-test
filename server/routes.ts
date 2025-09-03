import express, { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage, ProcessRequestFiles } from "./storage";
import { calculationSchema, insertUserSchema, pricesSchema, roofTypeSchema, materialTypeSchema, scaffoldingSizeSchema, chimneyCoveringSchema, formDataSchema, CalculationProcess, employeeSchema } from "@shared/schema";
import { ZodError } from "zod";
import { hashPassword } from "./utils";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = console.log; // Add a simple logging function



export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Protected route middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Ej auktoriserad" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Förbjuden" });
    }
    next();
  };

  const requireRole = (role: string) => (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== role) {
      return res.status(403).json({ message: "Förbjuden" });
    }
    next();
  };

  const multerApiDealsMiddleware: RequestHandler = (req, res, next) => {
    storage.processDealUploadMiddleware(req, res, (err: any) => {
      if (err) {
        console.error('File upload error in /api/deals middleware:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large.', code: err.code });
        }
        return res.status(400).json({ message: err.message || 'File upload failed.', code: err.code });
      }
      next();
    });
  };

  // Protected file access for project files
  app.get("/uploads/projects/:projectId/:filename", requireAuth, async (req, res) => {
    try {
      const { projectId, filename } = req.params;
      
      // Check if user is admin or owns the project
      const projectOwnership = await storage.getProjectOwnership(projectId);
      
      if (!projectOwnership) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const isOwner = projectOwnership.userId === req.user!.id;
      const isAdmin = req.user!.isAdmin;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Serve the file if authorized
      const filePath = path.join(__dirname, '..', 'uploads', 'projects', projectId, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving protected file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Allow public access to other uploads (non-project files)
  app.use('/uploads', (req, res, next) => {
    if (!req.path.startsWith('/projects/')) {
      const uploadsDirectory = path.join(__dirname, '..', 'uploads');
      express.static(uploadsDirectory)(req, res, next);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Roof Types Management (Users)
  app.get("/api/roof-types", requireAuth, async (req, res) => {
    const types = await storage.userGetRoofTypes();
    res.json(types);
  });

  // Roof Types Management (Admin only)
  app.get("/api/admin/roof-types", requireAdmin, async (req, res) => {
    const types = await storage.getRoofTypes();
    res.json(types);
  });

  // Get detailed roof types with pricing (for admin price display)
  app.get("/api/admin/roof-types-detailed", requireAdmin, async (req, res) => {
    const types = await storage.getRoofTypes();
    res.json(types);
  });

  app.post("/api/admin/roof-types", requireAdmin, async (req, res) => {
    try {
      const input = roofTypeSchema.parse(req.body);
      const roofType = await storage.createRoofType(input);
      res.status(201).json(roofType);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.put("/api/admin/roof-types/:id", requireAdmin, async (req, res) => {
    try {
      const input = roofTypeSchema.parse(req.body);
      log(`Updating roof type ${req.params.id} with sort order ${input.sortOrder}`);
      const roofType = await storage.updateRoofType(req.params.id, input);
      log(`Successfully updated roof type ${req.params.id}`);
      res.json(roofType);
    } catch (error) {
      log(`Error updating roof type ${req.params.id}:`, error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.delete("/api/admin/roof-types/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteRoofType(id);
      res.sendStatus(204);
    } catch (error) {
      log(`Error deleting roof type ${req.params.id}:`, error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Material Types Management (Users)
  app.get("/api/material-types", requireAuth, async (req, res) => {
    const types = await storage.userGetMaterialTypes();
    res.json(types);
  });

  // Get detailed material types with pricing (for admin price display) 
  app.get("/api/admin/material-types-detailed", requireAdmin, async (req, res) => {
    const types = await storage.getMaterialTypes();
    res.json(types);
  });

  // Material Types Management (Admin only)
  app.get("/api/admin/material-types", requireAdmin, async (req, res) => {
    const types = await storage.getMaterialTypes();
    res.json(types);
  });

  app.post("/api/admin/material-types", requireAdmin, async (req, res) => {
    try {
      const input = materialTypeSchema.parse(req.body);
      const materialType = await storage.createMaterialType(input);
      res.status(201).json(materialType);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.put("/api/admin/material-types/:id", requireAdmin, async (req, res) => {
    try {
      const input = materialTypeSchema.parse(req.body);
      log(`Updating material type ${req.params.id} with sort order ${input.sortOrder}`);
      const materialType = await storage.updateMaterialType(req.params.id, input);
      log(`Successfully updated material type ${req.params.id}`);
      res.json(materialType);
    } catch (error) {
      log(`Error updating material type ${req.params.id}:`, error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.delete("/api/admin/material-types/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteMaterialType(id);
      res.sendStatus(204);
    } catch (error) {
      log(`Error deleting material type ${req.params.id}:`, error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Scaffolding Sizes (Users)
  app.get("/api/scaffolding-sizes", requireAuth, async (req, res) => {
    const types = await storage.userGetScaffoldingSizes();
    res.json(types);
  });

  // Scaffolding Sizes Management (Admin only)
  app.get("/api/admin/scaffolding-sizes", requireAdmin, async (req, res) => {
    const sizes = await storage.getScaffoldingSizes();
    res.json(sizes);
  });

  // Get detailed scaffolding sizes with pricing (for admin price display)
  app.get("/api/admin/scaffolding-sizes-detailed", requireAdmin, async (req, res) => {
    const sizes = await storage.getScaffoldingSizes();
    res.json(sizes);
  });

  app.post("/api/admin/scaffolding-sizes", requireAdmin, async (req, res) => {
    try {
      const input = scaffoldingSizeSchema.parse(req.body);
      const scaffoldingSize = await storage.createScaffoldingSize(input);
      res.status(201).json(scaffoldingSize);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.put("/api/admin/scaffolding-sizes/:id", requireAdmin, async (req, res) => {
    try {
      const input = scaffoldingSizeSchema.parse(req.body);
      log(`Updating scaffolding size ${req.params.id} with sort order ${input.sortOrder}`);
      const scaffoldingSize = await storage.updateScaffoldingSize(req.params.id, input);
      log(`Successfully updated scaffolding size ${req.params.id}`);
      res.json(scaffoldingSize);
    } catch (error) {
      log(`Error updating scaffolding size ${req.params.id}:`, error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.delete("/api/admin/scaffolding-sizes/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteScaffoldingSize(id);
      res.sendStatus(204);
    } catch (error) {
      log(`Error deleting scaffolding size ${req.params.id}:`, error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Chimney Types Management (Users)
  app.get("/api/chimney-types", requireAuth, async (req, res) => {
    const types = await storage.userGetChimneyTypes();
    res.json(types);
  });

  // Chimney Types Management (Admin only)
  app.get("/api/admin/chimney-types", requireAdmin, async (req, res) => {
    const types = await storage.getChimneyTypes();
    res.json(types);
  });

  // Get detailed chimney types with pricing (for admin price display)
  app.get("/api/admin/chimney-types-detailed", requireAdmin, async (req, res) => {
    const types = await storage.getChimneyTypes();
    res.json(types);
  });

  app.post("/api/admin/chimney-types", requireAdmin, async (req, res) => {
    try {
      const input = chimneyCoveringSchema.parse(req.body);
      const chimneyType = await storage.createChimneyType(input);
      res.status(201).json(chimneyType);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.put("/api/admin/chimney-types/:id", requireAdmin, async (req, res) => {
    try {
      const input = chimneyCoveringSchema.parse(req.body);
      log(`Updating chimney type ${req.params.id} with sort order ${input.sortOrder}`);
      const chimneyType = await storage.updateChimneyType(req.params.id, input);
      log(`Successfully updated chimney type ${req.params.id}`);
      res.json(chimneyType);
    } catch (error) {
      log(`Error updating chimney type ${req.params.id}:`, error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.delete("/api/admin/chimney-types/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteChimneyType(id);
      res.sendStatus(204);
    } catch (error) {
      log(`Error deleting chimney type ${req.params.id}:`, error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Existing routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const userInput = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userInput.username);

      if (existingUser) {
        return res.status(400).json({ message: "Användarnamnet finns redan" });
      }

      const hashedPassword = await hashPassword(userInput.password);
      const user = await storage.createUser({
        ...userInput,
        password: hashedPassword,
      });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Användaren hittades inte" });
      }

      if (user.isAdmin) {
        return res.status(403).json({ message: "Kan inte ta bort admin-användare" });
      }

      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.patch("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "Användaren hittades inte" });
      }

      if (user.isAdmin) {
        return res.status(403).json({ message: "Kan inte återställa lösenord på admin-användare" });
      }

      const newPassword = await storage.resetUserPassword(user.id);
      
      res.status(200).json({ message: "Lösenord återställt", newPassword: newPassword });
    } catch (error) {
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.get("/api/categories", requireAuth, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/admin/prices", requireAdmin, async (req, res) => {
    const prices = await storage.getPrices();
    res.json(prices);
  });

  app.put("/api/admin/prices", requireAdmin, async (req, res) => {
    try {
      const prices = pricesSchema.parse(req.body);
      const updatedPrices = await storage.updatePrices(prices);
      res.json(updatedPrices);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internt serverfel" });
      }
    }
  });

  app.get("/api/admin/calculation-details", requireAdmin, async (req, res) => {
    const calculationDetails = await storage.getCalculationDetails();
    res.json(calculationDetails);
  });

  app.put("/api/admin/calculation-details", requireAdmin, async (req, res) => {
    try {
      const updatedDetail = await storage.updateCalculationDetail(req.body);
      res.json(updatedDetail);
    } catch (error) {
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.get("/api/admin/material-costs", requireAdmin, async (req, res) => {
    const materialCosts = await storage.getMaterialCosts();
    res.json(materialCosts);
  });

  app.put("/api/admin/material-costs", requireAdmin, async (req, res) => {
    try {
      const updatedCost = await storage.updateMaterialCost(req.body);
      res.json(updatedCost);
    } catch (error) {
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.post("/api/calculations", requireAuth, async (req, res) => {
    try {
      console.log("Received calculation request:", req.body);
      const calculation = await storage.createCalculation(req.user!.id, req.body);
      console.log("Calculation created:", calculation);
      res.json(calculation);
    } catch (error) {
      console.error("Calculation error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Ogiltig inmatning",
          errors: error.errors,
          details: error.flatten()
        });
      } else {
        console.error("Detailed error:", error);
        res.status(500).json({
          message: "Internt serverfel",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.get("/api/calculations", requireAuth, async (req, res) => {
    try {
      const calculations = await storage.getUserCalculations(req.user!.id);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.get("/api/admin/calculations", requireAdmin, async (req, res) => {
    const calculations = await storage.getAllCalculations();
    const projectIDs = (await storage.getProjects()).map(project => project.calculationId);
    res.json({calculations: calculations, projectIDs: projectIDs});
  });

  app.post("/api/deals", requireAuth, multerApiDealsMiddleware, async (req, res) => {
    try {
      
      console.log("Received deal request: ", req.body);
      const files = req.files as ProcessRequestFiles;
      console.log("Files:", files);
      
      const calculationIdNum = parseInt(req.body.calculationId, 10);
      const calculation = await storage.getCalculation(calculationIdNum);
      if (!calculation) {
        return res.status(404).json({ message: "Beräkning hittades inte" });
      }
      
      const isDeal = req.body.isDeal === 'true';
      
      const marginPrice = parseFloat(req.body.payMarginPrice);
      const marginPercent = parseFloat(req.body.payMarginPercent);

      const calculationProcessData = {
        isDeal,
        reasonNoDeal: req.body.reasonNoDeal,
        revisit: req.body.revisit === 'true',
        processNotes: req.body.processNotes,
      };
      
      const updatedCalculation = await storage.updateCalculationProcessStatus(calculation.id, calculationProcessData, marginPrice, marginPercent);

      if (isDeal) {
        const newProjectId = updatedCalculation.dealIdString;
        await storage.updateDealFiles(files, newProjectId);
      }
      
      res.json(updatedCalculation);
    } catch (error) {
      console.error("Error updating deal status:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.get("/api/deals", requireAuth, async (req, res) => {
    try {
      if (req.user?.isAdmin) {
        const deals = await storage.getAllDeals('deal');
        res.json(deals);
      } else {
        const deals = await storage.getUserDeals(req.user!.id, 'deal');
        res.json(deals);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Get individual deal with full data
  app.get("/api/deals/:id", requireAuth, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Ogiltigt affärs-ID" });
      }

      const calculation = await storage.getCalculation(dealId);
      if (!calculation) {
        return res.status(404).json({ message: "Affär hittades inte" });
      }

      // Check permissions
      if (!req.user?.isAdmin && calculation.userId !== req.user?.id) {
        return res.status(403).json({ message: "Åtkomst nekad" });
      }

      // Get deal data if it exists
      try {
        const dealData = await storage.getDealByCalculationId(dealId);
        res.json({
          ...calculation,
          dealData: dealData?.dealData || null
        });
      } catch (error) {
        // If no deal data exists, just return the calculation
        res.json({
          ...calculation,
          dealData: null
        });
      }
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Update deal status for Kanban board
  app.patch("/api/deals/:id/status", requireAuth, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status krävs" });
      }

      // Check if user can access this deal
      const deal = await storage.getCalculation(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Affär hittades inte" });
      }

      // Check permissions
      if (!req.user?.isAdmin && deal.userId !== req.user?.id) {
        return res.status(403).json({ message: "Åtkomst nekad" });
      }

      // Update the deal status in deal_data table
      await storage.updateDealKanbanStatus(dealId, status);
      
      res.json({ message: "Status uppdaterad", dealId, status });
    } catch (error) {
      console.error("Error updating deal status:", error);
      res.status(500).json({ message: "Misslyckades med att uppdatera affärstatus" });
    }
  });

  app.get("/api/root-deduction", requireAuth, async (req, res) => {
    try {
      const rootDeduction = await storage.getRootDeduction();
      res.json(rootDeduction);
    } catch (error) {
      console.error("Error fetching root deduction:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.get("/api/demos", requireAuth, async (req, res) => {
    try {
      if (req.user?.isAdmin) {
        const deals = await storage.getAllDeals('demo');
        res.json(deals);
      } else {
        const deals = await storage.getUserDeals(req.user!.id, 'demo');
        res.json(deals);
      }
    } catch (error) {
      console.error("Error fetching demos:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.patch("/api/deals/:id/change-type", requireAdmin, async (req, res) =>{
    try {
      if (isNaN(+req.params.id)) {
        return res.status(404).json({ message: "Id måste vara ett nummer" });
      }
      const deal = await storage.getCalculation(+req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal hittades inte" });
      }
      const newStatus = req.body.calculationType;
      console.log(newStatus);
      if (newStatus != 'demo' && newStatus != 'deal' && newStatus != 'calc' && newStatus != 'project') {
        return res.status(400).json({ message: "Ogiltig status" });
      }
      const updatedDeal = await storage.updateDealStatus(deal.id, newStatus);
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error changing deal type:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.delete('/api/deals/:id', requireAdmin, async (req, res) => {
    const { id } = req.params; // Get the deal ID from the URL path

    try {
      console.log(`Received DELETE request for deal ID: ${id}`);
      const deletedDeal = await storage.findByIdAndDelete(+id);

      if (!deletedDeal) {
        return res.status(404).json({ message: 'Deal not found' });
      }
      
      res.status(200).json({ message: 'Deal deleted successfully' });

    } catch (error) {
      console.error(`Error deleting deal ${id}:`, error);
      res.status(500).json({ message: 'Internal server error while deleting deal' });
    }
  });

  app.get("/api/other-users", requireAuth, async (req, res) => {
    try {
      const otherUsers = await storage.getOtherUsers(req.user!.id);
      res.json(otherUsers);
    } catch (error) {
      console.error("Error fetching other users:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.post("/api/project-form/submit", requireAdmin, async (req, res) => {
    try {
      console.log(req.body);
      const input = formDataSchema.parse(req.body);
      const signature = req.body.signature;
      const project = await storage.createProject(input, signature);
      console.log("Projektering submitted:", project);
      if (!project) {
        return res.status(400).json({
          message: "Projektets formulär har redan fyllts i",
        });
      }
      res.json({ projectId: project.id, success: true });
    } catch (error) {
      console.error("Calculation error:", error);
      if (error instanceof ZodError) {
        res.status(400).json({
          message: "Ogiltig inmatning",
          errors: error.errors,
          details: error.flatten()
        });
      } else {
        console.error("Detailed error:", error);
        res.status(500).json({
          message: "Internt serverfel",
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.get('/api/project/:id/pdf', requireAuth, async (req, res) => {
    try {
      const calcId = req.params.id; // Or use kundnummer if that's the identifier

      const project = await storage.getProjectByCalculationId(+calcId);

      if (!project) {
        console.log("Project " + calcId + " not found");
        return res.status(404).send('Project not found');
      }

      const pdfBuffer = await storage.generateProjectPDF(project);

      res.setHeader('Content-Type', 'application/pdf');
      
      res.setHeader('Content-Disposition', `inline; filename="projektering-${project.kundnummer || project.calculationId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send('Error generating PDF');
    }
  });

  app.get('/api/deals/:id/pdf', requireAuth, async (req, res) => {
    try {
      const calcId = req.params.id; // Or use kundnummer if that's the identifier

      const {calculation, dealData} = await storage.getDealByCalculationId(+calcId);

      if (!dealData || (req.user?.isAdmin && req.user?.id != calculation.userId)) {
        console.log("Deal " + calcId + " not found");
        return res.status(404).send('Deal not found');
      }

      const pdfBuffer = await storage.generateDealPDF(calculation, dealData);

      res.setHeader('Content-Type', 'application/pdf');

      res.setHeader('Content-Disposition', `inline; filename="affär-${dealData.dealIdString || dealData.calculationId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send('Error generating PDF');
    }
  });

  app.post('/api/deals/:id/upload-image', requireAuth, storage.uploadImageMiddleware, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const imageFile = req.file;
      
      if (!imageFile) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Get the deal to verify it exists and user has access
      const deal = await storage.getCalculation(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Check if user owns the deal or is admin
      if (!req.user?.isAdmin && deal.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the deal data to get the dealIdString
      const { dealData } = await storage.getDealByCalculationId(dealId);
      if (!dealData) {
        return res.status(404).json({ message: "Deal data not found" });
      }

      // Move file and update database
      const imageUrl = await storage.addImageToDeal(imageFile, dealData.dealIdString);
      
      res.json({ message: "Image uploaded successfully", imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/montage/projects", requireAdmin, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).send('Error fetching projects');
    }
  });

  // Get all projects for project management V2 page
  // Get projects that are in Gantt timeline
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getGanttProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching Gantt projects:", error);
      res.status(500).json({ message: "Failed to fetch Gantt projects" });
    }
  });

  // Get all projects (for adding to Gantt)
  app.get("/api/all-projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getAllProjectsNotInGantt();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching all projects:", error);
      res.status(500).json({ message: "Failed to fetch all projects" });
    }
  });

  // Add project to Gantt timeline
  app.post("/api/planning/add-project", requireAuth, async (req, res) => {
    try {
      const { projectId, startDate, endDate, teamAssigned } = req.body;
      
      if (!projectId || !startDate || !endDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await storage.addProjectToGantt(projectId, {
        planningStartDate: new Date(startDate),
        planningEndDate: new Date(endDate),
        teamAssigned: teamAssigned || null,
        inGanttTimeline: true
      });

      res.json(result);
    } catch (error) {
      console.error("Error adding project to Gantt:", error);
      res.status(500).json({ message: "Failed to add project to Gantt timeline" });
    }
  });

  // Remove project from Gantt timeline
  app.delete("/api/planning/remove-project/:id", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const result = await storage.removeProjectFromGantt(projectId);
      
      if (!result) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json({ message: "Project removed from Gantt timeline" });
    } catch (error) {
      console.error("Error removing project from Gantt:", error);
      res.status(500).json({ message: "Failed to remove project from Gantt timeline" });
    }
  });

  // Get single project data for project management page
  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProjectData(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is admin or owns the project
      if (!req.user!.isAdmin && project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update project fields (general update endpoint)
  app.patch("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProjectData(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is admin or owns the project
      if (!req.user!.isAdmin && project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedProject = await storage.updateProjectStatus(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update project status (Excel workflow tracking)
  app.patch("/api/projects/:id/status", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProjectData(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is admin or owns the project
      if (!req.user!.isAdmin && project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedProject = await storage.updateProjectStatus(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update project phase status (scaffolding, removal, material, invoice)
  app.patch("/api/projects/:id/phase/:phase", requireAuth, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const phase = req.params.phase as 'stallning' | 'borttagning' | 'material' | 'faktura1';
      const { status, completedDate } = req.body;

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProjectData(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is admin or owns the project
      if (!req.user!.isAdmin && project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const date = completedDate ? new Date(completedDate) : undefined;
      const updatedProject = await storage.updateProjectPhaseStatus(projectId, phase, status, date);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project phase:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects/assign-team", requireAdmin, async (req, res) => {
    try {
      const { projectId, teamName, teamColor } = req.body;
      await storage.assignProjectTeam(projectId, teamName, teamColor);
      res.json({ message: "Team tilldelat" });
    } catch (error) {
      console.error("Fel vid tilldelning av team:", error);
      res.status(500).json({ message: 'Fel vid tilldelning av team' });
    }
  });

  app.post("/api/admin/project-deal/:id", requireAdmin, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Ogiltigt deal ID" });
      }

      const updatedDeal = await storage.projectDeal(dealId);
      res.json(updatedDeal);
    } catch (error) {
      console.error("Fel vid projektering av affär:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // Sales Dashboard API Routes
  app.get("/api/sales/dashboard-stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getSalesDashboardStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  app.get("/api/sales/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getSalesCustomers(req.user!.id);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Admin Dashboard API Routes
  app.get("/api/admin/dashboard-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard statistics" });
    }
  });

  // Advanced Analytics API Route
  app.get("/api/analytics/advanced", requireAdmin, async (req, res) => {
    try {
      const analytics = await storage.getAdvancedAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      res.status(500).json({ message: "Failed to fetch advanced analytics" });
    }
  });

  // Material Requests API Routes
  app.get("/api/material-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getMaterialRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching material requests:", error);
      res.status(500).json({ message: "Failed to fetch material requests" });
    }
  });

  app.post("/api/material-requests", requireAuth, async (req, res) => {
    try {
      const request = await storage.createMaterialRequest(req.body);
      res.json(request);
    } catch (error) {
      console.error("Error creating material request:", error);
      res.status(500).json({ message: "Failed to create material request" });
    }
  });

  app.put("/api/material-requests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.updateMaterialRequest(id, req.body);
      res.json(request);
    } catch (error) {
      console.error("Error updating material request:", error);
      res.status(500).json({ message: "Failed to update material request" });
    }
  });

  app.delete("/api/material-requests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterialRequest(id);
      res.json({ message: "Material request deleted" });
    } catch (error) {
      console.error("Error deleting material request:", error);
      res.status(500).json({ message: "Failed to delete material request" });
    }
  });

  app.get("/api/material-requests/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getMaterialRequestStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching material request stats:", error);
      res.status(500).json({ message: "Failed to fetch material request statistics" });
    }
  });

  app.post("/api/material-requests/export", requireAuth, async (req, res) => {
    try {
      const csv = await storage.exportMaterialRequests(req.body);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="material-requests.csv"');
      res.send(csv);
    } catch (error) {
      console.error("Error exporting material requests:", error);
      res.status(500).json({ message: "Failed to export material requests" });
    }
  });

  // System Settings routes (Tech Admin only)
  app.get("/api/admin/settings/:settingKey", requireAuth, async (req, res) => {
    try {
      // Only tech admin (head_admin) can access system settings
      if (req.user?.role !== 'head_admin') {
        return res.status(403).json({ message: "Förbjuden" });
      }
      
      const { settingKey } = req.params;
      const settingValue = await storage.getSystemSetting(settingKey);
      res.json(settingValue);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.put("/api/admin/settings/:settingKey", requireAuth, async (req, res) => {
    try {
      // Only tech admin (head_admin) can modify system settings
      if (req.user?.role !== 'head_admin') {
        return res.status(403).json({ message: "Förbjuden" });
      }
      
      const { settingKey } = req.params;
      const { settingValue } = req.body;
      
      if (typeof settingValue !== 'boolean') {
        return res.status(400).json({ message: "Inställningsvärdet måste vara sant eller falskt" });
      }
      
      const updatedSetting = await storage.updateSystemSetting(settingKey, settingValue);
      res.json(updatedSetting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  // User City Access Management (Head Admin only)
  app.get("/api/admin/user-city-access/:userId", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== 'head_admin') {
        return res.status(403).json({ message: "Förbjuden" });
      }
      
      const userId = parseInt(req.params.userId);
      const cityIds = await storage.getUserCityAccess(userId);
      res.json(cityIds);
    } catch (error) {
      console.error("Error fetching user city access:", error);
      res.status(500).json({ message: "Failed to fetch user city access" });
    }
  });

  app.put("/api/admin/user-city-access/:userId", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== 'head_admin') {
        return res.status(403).json({ message: "Förbjuden" });
      }
      
      const userId = parseInt(req.params.userId);
      const { cityIds } = req.body;
      
      if (!Array.isArray(cityIds)) {
        return res.status(400).json({ message: "City IDs must be an array" });
      }

      await storage.setUserCityAccess(userId, cityIds);
      res.json({ message: "City access updated successfully" });
    } catch (error) {
      console.error("Error updating user city access:", error);
      res.status(500).json({ message: "Failed to update user city access" });
    }
  });

  app.get("/api/admin/users-city-access", requireAuth, async (req, res) => {
    try {
      if (req.user?.role !== 'head_admin') {
        return res.status(403).json({ message: "Förbjuden" });
      }
      
      const usersWithAccess = await storage.getUsersWithCityAccess();
      res.json(usersWithAccess);
    } catch (error) {
      console.error("Error fetching users with city access:", error);
      res.status(500).json({ message: "Failed to fetch users with city access" });
    }
  });

  // Get user's accessible cities (for current user)
  app.get("/api/user/accessible-cities", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Head admin has access to all cities
      if (req.user?.role === 'head_admin') {
        const allCities = await storage.getCities();
        res.json(allCities.map(city => city.id));
        return;
      }

      const cityIds = await storage.getUserCityAccess(userId);
      res.json(cityIds);
    } catch (error) {
      console.error("Error fetching accessible cities:", error);
      res.status(500).json({ message: "Failed to fetch accessible cities" });
    }
  });

  // Employee Management API Routes
  app.get("/api/admin/employees", requireAdmin, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/admin/employees", requireAdmin, async (req, res) => {
    try {
      const employeeData = employeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create employee" });
      }
    }
  });

  app.put("/api/admin/employees/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ogiltigt anställd ID" });
      }

      const employeeData = employeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, employeeData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Ogiltig inmatning", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update employee" });
      }
    }
  });

  app.delete("/api/admin/employees/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ogiltigt anställd ID" });
      }

      await storage.deleteEmployee(id);
      res.json({ message: "Anställd inaktiverad" });
    } catch (error) {
      console.error("Error deactivating employee:", error);
      res.status(500).json({ message: "Failed to deactivate employee" });
    }
  });

  app.patch("/api/admin/employees/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ogiltigt anställd ID" });
      }

      const employee = await storage.toggleEmployeeStatus(id);
      res.json(employee);
    } catch (error) {
      console.error("Error toggling employee status:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to toggle employee status" });
    }
  });

  // City management routes
  app.get('/api/cities', requireAuth, async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.post('/api/admin/cities', requireAdmin, async (req, res) => {
    try {
      const city = await storage.createCity(req.body);
      res.json(city);
    } catch (error) {
      console.error("Error creating city:", error);
      res.status(500).json({ message: "Failed to create city" });
    }
  });

  app.put('/api/admin/cities/:id', requireAdmin, async (req, res) => {
    try {
      const city = await storage.updateCity(req.params.id, req.body);
      res.json(city);
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(500).json({ message: "Failed to update city" });
    }
  });

  app.delete('/api/admin/cities/:id', requireAdmin, async (req, res) => {
    try {
      await storage.deleteCity(req.params.id);
      res.json({ message: "City deleted successfully" });
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ message: "Failed to delete city" });
    }
  });

  app.patch('/api/admin/cities/:id/toggle', requireAdmin, async (req, res) => {
    try {
      const city = await storage.toggleCityStatus(req.params.id);
      res.json(city);
    } catch (error) {
      console.error("Error toggling city status:", error);
      res.status(500).json({ message: "Failed to toggle city status" });
    }
  });

  // Project Leader API Routes
  app.get("/api/project-leader/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getProjectLeaderTickets(req.user!.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching project leader tickets:", error);
      res.status(500).json({ message: "Failed to fetch project tickets" });
    }
  });

  app.patch("/api/project-leader/tickets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const ticket = await storage.updateProjectLeaderTicket(id, updateData);
      res.json(ticket);
    } catch (error) {
      console.error("Error updating project leader ticket:", error);
      res.status(500).json({ message: "Failed to update project ticket" });
    }
  });

  // Get individual calculation for project leader
  app.get("/api/calculations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const calculation = await storage.getCalculation(id);
      if (!calculation) {
        return res.status(404).json({ message: "Calculation not found" });
      }
      res.json(calculation);
    } catch (error) {
      console.error("Error fetching calculation:", error);
      res.status(500).json({ message: "Failed to fetch calculation" });
    }
  });

  // City management routes
  app.post("/api/admin/cities", requireAdmin, async (req, res) => {
    try {
      const cityData = req.body;
      const city = await storage.createCity(cityData);
      res.json(city);
    } catch (error) {
      console.error("Error creating city:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.put("/api/admin/cities/:id", requireAdmin, async (req, res) => {
    try {
      const cityId = req.params.id;
      const updates = req.body;
      const city = await storage.updateCity(cityId, updates);
      res.json(city);
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  app.delete("/api/admin/cities/:id", requireAdmin, async (req, res) => {
    try {
      const cityId = req.params.id;
      await storage.deleteCity(cityId);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ message: "Internt serverfel" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}