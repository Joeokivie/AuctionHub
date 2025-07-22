import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertAuctionSchema, 
  insertBidSchema,
  loginSchema 
} from "@shared/schema";
import { BackupManager } from "./utils/backup";

let currentUser: any = null;

export async function registerRoutes(app: Express): Promise<Server> {
  const backupManager = new BackupManager();
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));
  
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!currentUser) {
      return res.status(401).json({ message: "Authentication required" });
    }
    req.user = currentUser;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, message: "Registration successful" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      currentUser = user;
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    currentUser = null;
    res.json({ message: "Logout successful" });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!currentUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = currentUser;
    res.json({ user: userWithoutPassword });
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Auction routes
  app.get("/api/auctions", async (req, res) => {
    try {
      const { categoryId, search } = req.query;
      const auctions = await storage.getAuctions(
        categoryId ? Number(categoryId) : undefined,
        search as string
      );
      res.json(auctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/auctions/:id", async (req, res) => {
    try {
      const auction = await storage.getAuction(Number(req.params.id));
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      res.json(auction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Image upload endpoint
  app.post("/api/upload", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error: any) {
      console.error('Image upload error:', error);
      res.status(400).json({ message: error.message || "Failed to upload image" });
    }
  });

  app.post("/api/auctions", requireAuth, upload.single('image'), async (req, res) => {
    try {
      // Parse form data and convert types
      const { 
        title, 
        description, 
        categoryId, 
        startingBid, 
        duration, 
        reservePrice, 
        imageUrl 
      } = req.body;
      
      // Convert string values to proper types
      const parsedData = {
        title,
        description,
        categoryId: parseInt(categoryId),
        startingBid,
        duration: parseInt(duration || "7"),
        reservePrice: reservePrice && reservePrice.trim() !== "" ? reservePrice : null,
        imageUrl: imageUrl || ""
      };
      
      // Calculate end time based on duration
      const endTime = new Date(Date.now() + parsedData.duration * 24 * 60 * 60 * 1000);
      
      // Handle image upload - file upload takes priority over URL
      let finalImageUrl = parsedData.imageUrl;
      if (req.file) {
        finalImageUrl = `/uploads/${req.file.filename}`;
      }
      
      const auctionData = insertAuctionSchema.parse({
        title: parsedData.title,
        description: parsedData.description,
        categoryId: parsedData.categoryId,
        startingBid: parsedData.startingBid,
        reservePrice: parsedData.reservePrice,
        duration: parsedData.duration,
        imageUrl: finalImageUrl,
        sellerId: currentUser.id,
        endTime
      });
      
      const auction = await storage.createAuction(auctionData);
      res.json(auction);
    } catch (error: any) {
      console.error('Auction creation error:', error);
      res.status(400).json({ message: error.message || "Failed to create auction" });
    }
  });

  // Bid routes
  app.get("/api/auctions/:id/bids", async (req, res) => {
    try {
      const bids = await storage.getBidsForAuction(Number(req.params.id));
      res.json(bids);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auctions/:id/bids", requireAuth, async (req, res) => {
    try {
      const auctionId = Number(req.params.id);
      const auction = await storage.getAuction(auctionId);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      if (new Date() > auction.endTime) {
        return res.status(400).json({ message: "Auction has ended" });
      }

      if (auction.sellerId === currentUser.id) {
        return res.status(400).json({ message: "Cannot bid on your own auction" });
      }

      const bidData = insertBidSchema.parse({
        ...req.body,
        auctionId,
        bidderId: currentUser.id
      });

      const currentBid = Number(auction.currentBid);
      const newBidAmount = Number(bidData.amount);

      if (newBidAmount <= currentBid) {
        return res.status(400).json({ message: "Bid must be higher than current bid" });
      }

      const bid = await storage.createBid(bidData);
      res.json(bid);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to place bid" });
    }
  });

  // Admin/Report routes
  app.get("/api/admin/reports/sales", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();
      
      const sales = await storage.getSoldItemsByDateRange(start, end);
      res.json(sales);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/reports/active-auctions", requireAuth, async (req, res) => {
    try {
      const activeAuctions = await storage.getActiveAuctions();
      res.json(activeAuctions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/reports/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const activeAuctions = await storage.getActiveAuctions();
      const allUsers = await storage.getAllUsers();
      const allAuctions = await storage.getAuctions();
      
      const totalRevenue = allAuctions
        .filter(auction => !auction.isActive && auction.bidCount > 0)
        .reduce((sum, auction) => sum + Number(auction.currentBid), 0);

      const totalBids = allAuctions.reduce((sum, auction) => sum + auction.bidCount, 0);

      res.json({
        activeAuctions: activeAuctions.length,
        totalRevenue,
        registeredUsers: allUsers.length,
        totalBids
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
