import { 
  users, auctions, categories, bids,
  type User, type InsertUser, 
  type Auction, type InsertAuction, type AuctionWithDetails,
  type Category, type InsertCategory,
  type Bid, type InsertBid
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, gt } from "drizzle-orm";
import fs from 'fs/promises';
import path from 'path';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Auction methods
  getAuctions(categoryId?: number, searchTerm?: string): Promise<AuctionWithDetails[]>;
  getAuction(id: number): Promise<AuctionWithDetails | undefined>;
  createAuction(auction: InsertAuction & { duration: number }): Promise<Auction>;
  updateAuctionBid(auctionId: number, newBid: number): Promise<void>;
  
  // Bid methods
  getBidsForAuction(auctionId: number): Promise<(Bid & { bidder: User })[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  
  // Report methods
  getSoldItemsByDateRange(startDate: Date, endDate: Date): Promise<AuctionWithDetails[]>;
  getActiveAuctions(): Promise<AuctionWithDetails[]>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    await this.initializeDefaultCategories();
    await this.initializeSampleData();
  }

  private async initializeDefaultCategories() {
    const existingCategories = await this.getCategories();
    if (existingCategories.length > 0) return;

    const defaultCategories = [
      { name: "Automobiles", description: "Cars, motorcycles, and automotive items" },
      { name: "Antiques", description: "Vintage and antique collectibles" },
      { name: "Jewelry", description: "Fine jewelry and accessories" },
      { name: "Watches", description: "Luxury and vintage timepieces" },
      { name: "Home & Garden", description: "Home improvement and garden items" },
      { name: "Electronics", description: "Consumer electronics and gadgets" },
    ];

    for (const cat of defaultCategories) {
      await this.createCategory(cat);
    }
  }

  private async initializeSampleData() {
    // Check if data already exists
    const existingUsers = await this.getAllUsers();
    if (existingUsers.length > 0) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }

    console.log('Initializing sample data...');

    // Create sample users
    const johnCollector = await this.createUser({
      username: "john_collector",
      email: "john@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Collector",
      shippingAddress: "123 Main St, New York, NY 10001",
      creditCardInfo: "****-****-****-1234",
      phoneNumber: "555-0123",
    });

    const vintageSeller = await this.createUser({
      username: "vintage_seller",
      email: "vintage@example.com",
      password: "password123",
      firstName: "Vintage",
      lastName: "Seller",
      shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
      creditCardInfo: "****-****-****-5678",
      phoneNumber: "555-0456",
    });

    // Get categories for sample auctions
    const categories = await this.getCategories();
    const automobilesCat = categories.find(c => c.name === "Automobiles");
    const antiquesCat = categories.find(c => c.name === "Antiques");
    const jewelryCat = categories.find(c => c.name === "Jewelry");
    const watchesCat = categories.find(c => c.name === "Watches");
    const electronicsCat = categories.find(c => c.name === "Electronics");

    // Create sample auctions
  
    const auctionsData = [
      {
        title: "Classic 1967 Ford Mustang Fastback",
        description: "Classic 1967 Ford Mustang Fastback with a 289 V8 engine and 4-speed manual transmission. Restored to original condition with new paint and interior.",
        startingBid: "25000",
        categoryId: automobilesCat!.id,
        sellerId: vintageSeller.id,
        duration: 7,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Victorian Era Silver Tea Set",
        description: "Exquisite Victorian era sterling silver tea set, circa 1890. Four-piece set including teapot, cream pitcher, sugar bowl, and serving tray. Hallmarked and in excellent condition.",
        startingBid: "1200",
        categoryId: antiquesCat!.id,
        sellerId: vintageSeller.id,
        duration: 5,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Diamond Engagement Ring - 2.5 Carat",
        description: "Stunning 2.5 carat diamond engagement ring in platinum setting. GIA certified diamond with excellent cut, VS1 clarity, and F color grade. Size 6, can be resized.",
        startingBid: "8500",
        categoryId: jewelryCat!.id,
        sellerId: johnCollector.id,
        duration: 3,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Rolex Submariner Date - Black",
        description: "Pre-owned Rolex Submariner Date (ref. 116610LN) in excellent condition. Black dial and bezel, automatic movement. Complete with box and papers. Purchased in 2020.",
        startingBid: "12000",
        categoryId: watchesCat!.id,
        sellerId: johnCollector.id,
        duration: 10,
        endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Apple MacBook Pro 16-inch M1 Max",
        description: "Like-new Apple MacBook Pro 16-inch with M1 Max chip, 32GB RAM, 1TB SSD. Space Gray color. Perfect for professional work. Includes original charger and box.",
        startingBid: "2800",
        categoryId: electronicsCat!.id,
        sellerId: vintageSeller.id,
        duration: 2,
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Antique Grandfather Clock - Working",
        description: "Beautiful antique grandfather clock from the early 1900s. Westminster chimes, working pendulum, and original key. Solid oak construction with beveled glass. Recently serviced.",
        startingBid: "3500",
        categoryId: antiquesCat!.id,
        sellerId: johnCollector.id,
        duration: 8,
        endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
    ];

    const createdAuctions: Auction[] = [];
    for (const auction of auctionsData) {
      const created = await this.createAuction(auction);
      createdAuctions.push(created);
    }

    // Add some sample bids
    const bidsData = [
      { auctionId: createdAuctions[0].id, bidderId: johnCollector.id, amount: "15500", shippingAddress: "123 Main St, New York, NY 10001" },
      { auctionId: createdAuctions[0].id, bidderId: vintageSeller.id, amount: "16000", shippingAddress: "456 Oak Ave, Los Angeles, CA 90210" },
      { auctionId: createdAuctions[1].id, bidderId: johnCollector.id, amount: "1350", shippingAddress: "123 Main St, New York, NY 10001" },
      { auctionId: createdAuctions[2].id, bidderId: vintageSeller.id, amount: "9000", shippingAddress: "456 Oak Ave, Los Angeles, CA 90210" },
      { auctionId: createdAuctions[3].id, bidderId: vintageSeller.id, amount: "12500", shippingAddress: "456 Oak Ave, Los Angeles, CA 90210" },
      { auctionId: createdAuctions[4].id, bidderId: johnCollector.id, amount: "2900", shippingAddress: "123 Main St, New York, NY 10001" },
    ];

    for (const bid of bidsData) {
      await this.createBid(bid);
    }

    const users = await this.getAllUsers();
    const auctions = await this.getAuctions();

    console.log(`Initialized sample data: ${users.length} users, ${auctions.length} auctions`);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async getAuctions(categoryId?: number, searchTerm?: string): Promise<AuctionWithDetails[]> {
    let query = db
      .select({
        auction: auctions,
        category: categories,
        seller: users,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .innerJoin(users, eq(auctions.sellerId, users.id));

    if (categoryId) {
      query = query.where(eq(auctions.categoryId, categoryId)) as any;
    }

    const results = await query;
    
    let filteredResults = results;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredResults = results.filter(result => 
        result.auction.title.toLowerCase().includes(term) ||
        result.auction.description.toLowerCase().includes(term)
      );
    }

    const auctionsWithDetails: AuctionWithDetails[] = [];
    
    for (const result of filteredResults) {
      // Get highest bid for this auction
      const bidResults = await db
        .select({
          bid: bids,
          bidder: users,
        })
        .from(bids)
        .innerJoin(users, eq(bids.bidderId, users.id))
        .where(eq(bids.auctionId, result.auction.id))
        .orderBy(desc(bids.amount))
        .limit(1);

      let highestBid;
      if (bidResults.length > 0) {
        highestBid = { ...bidResults[0].bid, bidder: bidResults[0].bidder };
      }

      auctionsWithDetails.push({
        ...result.auction,
        category: result.category,
        seller: result.seller,
        highestBid,
      });
    }

    return auctionsWithDetails.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  }

  async getAuction(id: number): Promise<AuctionWithDetails | undefined> {
    const results = await db
      .select({
        auction: auctions,
        category: categories,
        seller: users,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .innerJoin(users, eq(auctions.sellerId, users.id))
      .where(eq(auctions.id, id))
      .limit(1);

    if (results.length === 0) return undefined;

    const result = results[0];

    // Get highest bid for this auction
    const bidResults = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .innerJoin(users, eq(bids.bidderId, users.id))
      .where(eq(bids.auctionId, id))
      .orderBy(desc(bids.amount))
      .limit(1);

    let highestBid;
    if (bidResults.length > 0) {
      highestBid = { ...bidResults[0].bid, bidder: bidResults[0].bidder };
    }

    return {
      ...result.auction,
      category: result.category,
      seller: result.seller,
      highestBid,
    };
  }

  async createAuction(auctionData: InsertAuction & { duration: number }): Promise<Auction> {
    const { duration, ...insertAuction } = auctionData;
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + duration);

    const [auction] = await db
      .insert(auctions)
      .values({
        ...insertAuction,
        currentBid: insertAuction.startingBid,
        bidCount: 0,
        startTime: new Date(),
        endTime,
        isActive: true,
      })
      .returning();
    
    return auction;
  }

  async updateAuctionBid(auctionId: number, newBid: number): Promise<void> {
    // Get current auction to increment bid count
    const [auction] = await db.select().from(auctions).where(eq(auctions.id, auctionId));
    if (auction) {
      await db
        .update(auctions)
        .set({
          currentBid: newBid.toString(),
          bidCount: auction.bidCount + 1,
        })
        .where(eq(auctions.id, auctionId));
    }
  }

  async getBidsForAuction(auctionId: number): Promise<(Bid & { bidder: User })[]> {
    const results = await db
      .select({
        bid: bids,
        bidder: users,
      })
      .from(bids)
      .innerJoin(users, eq(bids.bidderId, users.id))
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.timestamp));

    return results.map(result => ({ ...result.bid, bidder: result.bidder }));
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const [bid] = await db
      .insert(bids)
      .values({
        ...insertBid,
        timestamp: new Date(),
      })
      .returning();
    
    await this.updateAuctionBid(bid.auctionId, Number(bid.amount));
    return bid;
  }

  async getSoldItemsByDateRange(startDate: Date, endDate: Date): Promise<AuctionWithDetails[]> {
    const results = await db
      .select({
        auction: auctions,
        category: categories,
        seller: users,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .innerJoin(users, eq(auctions.sellerId, users.id))
      .where(
        and(
          eq(auctions.isActive, false),
          gte(auctions.endTime, startDate),
          lte(auctions.endTime, endDate),
          gt(auctions.bidCount, 0) // Greater than 0
        )
      );

    const soldWithDetails: AuctionWithDetails[] = [];
    
    for (const result of results) {
      // Get highest bid for this auction
      const bidResults = await db
        .select({
          bid: bids,
          bidder: users,
        })
        .from(bids)
        .innerJoin(users, eq(bids.bidderId, users.id))
        .where(eq(bids.auctionId, result.auction.id))
        .orderBy(desc(bids.amount))
        .limit(1);

      let highestBid;
      if (bidResults.length > 0) {
        highestBid = { ...bidResults[0].bid, bidder: bidResults[0].bidder };
      }

      soldWithDetails.push({
        ...result.auction,
        category: result.category,
        seller: result.seller,
        highestBid,
      });
    }

    return soldWithDetails;
  }

  async getActiveAuctions(): Promise<AuctionWithDetails[]> {
    const now = new Date();
    const results = await db
      .select({
        auction: auctions,
        category: categories,
        seller: users,
      })
      .from(auctions)
      .innerJoin(categories, eq(auctions.categoryId, categories.id))
      .innerJoin(users, eq(auctions.sellerId, users.id))
      .where(
        and(
          eq(auctions.isActive, true),
          gte(auctions.endTime, now)
        )
      );

    const activeWithDetails: AuctionWithDetails[] = [];
    
    for (const result of results) {
      // Get highest bid for this auction
      const bidResults = await db
        .select({
          bid: bids,
          bidder: users,
        })
        .from(bids)
        .innerJoin(users, eq(bids.bidderId, users.id))
        .where(eq(bids.auctionId, result.auction.id))
        .orderBy(desc(bids.amount))
        .limit(1);

      let highestBid;
      if (bidResults.length > 0) {
        highestBid = { ...bidResults[0].bid, bidder: bidResults[0].bidder };
      }

      activeWithDetails.push({
        ...result.auction,
        category: result.category,
        seller: result.seller,
        highestBid,
      });
    }

    return activeWithDetails;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
}

export const storage = new DatabaseStorage();