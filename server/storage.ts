import { 
  users, auctions, categories, bids,
  type User, type InsertUser, 
  type Auction, type InsertAuction, type AuctionWithDetails,
  type Category, type InsertCategory,
  type Bid, type InsertBid
} from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private auctions: Map<number, Auction>;
  private categories: Map<number, Category>;
  private bids: Map<number, Bid>;
  private currentUserId: number;
  private currentAuctionId: number;
  private currentCategoryId: number;
  private currentBidId: number;

  constructor() {
    this.users = new Map();
    this.auctions = new Map();
    this.categories = new Map();
    this.bids = new Map();
    this.currentUserId = 1;
    this.currentAuctionId = 1;
    this.currentCategoryId = 1;
    this.currentBidId = 1;
    
    this.initializeData();
  }

  private async initializeData() {
    await this.loadData();
    await this.initializeDefaultCategories();
    await this.initializeSampleData();
  }

  private async initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Automobiles", description: "Cars, motorcycles, and automotive items" },
      { name: "Antiques", description: "Vintage and antique collectibles" },
      { name: "Jewelry", description: "Fine jewelry and accessories" },
      { name: "Watches", description: "Luxury and vintage timepieces" },
      { name: "Home & Garden", description: "Home improvement and garden items" },
      { name: "Electronics", description: "Consumer electronics and gadgets" },
    ];

    for (const cat of defaultCategories) {
      if (this.categories.size === 0) {
        await this.createCategory(cat);
      }
    }
  }

  private async initializeSampleData() {
    // Only initialize sample data if there are no existing auctions
    if (this.auctions.size > 0) return;

    // Create sample users
    const sampleUsers = [
      {
        username: "john_collector",
        password: "password123",
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com",
        shippingAddress: "123 Main St, New York, NY 10001",
        creditCardInfo: "****-****-****-1234",
        phoneNumber: "(555) 123-4567"
      },
      {
        username: "vintage_seller",
        password: "password123",
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah@example.com",
        shippingAddress: "456 Oak Ave, Los Angeles, CA 90210",
        creditCardInfo: "****-****-****-5678",
        phoneNumber: "(555) 987-6543"
      }
    ];

    const users = [];
    for (const userData of sampleUsers) {
      const user = await this.createUser(userData);
      users.push(user);
    }

    // Create sample auctions
    const sampleAuctions = [
      {
        title: "Vintage Rolex Submariner Watch",
        description: "1960s Rolex Submariner in excellent condition. Recently serviced with original box and papers. This is a rare collector's piece with beautiful patina.",
        categoryId: 4, // Watches
        sellerId: users[0].id,
        startingBid: "2500.00",
        reservePrice: "5000.00",
        duration: 7,
        imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=400&fit=crop&crop=faces"
      },
      {
        title: "MacBook Pro M3 14-inch (2024)",
        description: "Brand new MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Still in original packaging with all accessories. Perfect for professionals and creatives.",
        categoryId: 6, // Electronics
        sellerId: users[1].id,
        startingBid: "1800.00",
        reservePrice: "2200.00",
        duration: 5,
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&crop=faces"
      },
      {
        title: "Antique Victorian Mahogany Writing Desk",
        description: "Beautiful 19th century mahogany writing desk with brass handles and secret compartments. Restored to original condition. Perfect for home office or study.",
        categoryId: 2, // Antiques
        sellerId: users[0].id,
        startingBid: "800.00",
        reservePrice: "1500.00",
        duration: 10,
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=faces"
      },
      {
        title: "Diamond Engagement Ring 2.5 Carat",
        description: "Stunning 2.5 carat diamond engagement ring in platinum setting. Certified diamond with excellent cut, clarity, and color. Comes with appraisal certificate.",
        categoryId: 3, // Jewelry
        sellerId: users[1].id,
        startingBid: "8000.00",
        reservePrice: "12000.00",
        duration: 7,
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=faces"
      },
      {
        title: "Tesla Model Y Long Range (2023)",
        description: "Like new Tesla Model Y with only 5,000 miles. Full self-driving capability, premium interior, and all latest updates. Still under warranty.",
        categoryId: 1, // Automobiles
        sellerId: users[0].id,
        startingBid: "45000.00",
        reservePrice: "52000.00",
        duration: 14,
        imageUrl: "https://images.unsplash.com/photo-1561580125-028ee3bd62eb?w=400&h=400&fit=crop&crop=faces"
      },
      {
        title: "Professional Garden Tool Set",
        description: "Complete professional-grade garden tool set with stainless steel tools, ergonomic handles, and carrying case. Perfect for serious gardeners.",
        categoryId: 5, // Home & Garden
        sellerId: users[1].id,
        startingBid: "150.00",
        reservePrice: "300.00",
        duration: 3,
        imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&crop=faces"
      }
    ];

    for (const auctionData of sampleAuctions) {
      await this.createAuction(auctionData);
    }

    // Add some sample bids
    const auctions = Array.from(this.auctions.values());
    if (auctions.length > 0) {
      // Add bids to the first few auctions
      await this.createBid({
        auctionId: auctions[0].id,
        bidderId: users[1].id,
        amount: "2600.00",
        shippingAddress: users[1].shippingAddress
      });

      await this.createBid({
        auctionId: auctions[1].id,
        bidderId: users[0].id,
        amount: "1850.00",
        shippingAddress: users[0].shippingAddress
      });

      await this.createBid({
        auctionId: auctions[0].id,
        bidderId: users[1].id,
        amount: "2750.00",
        shippingAddress: users[1].shippingAddress
      });
    }

    console.log(`Initialized sample data: ${users.length} users, ${auctions.length} auctions`);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    await this.saveData();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      id: this.currentCategoryId++,
    };
    this.categories.set(category.id, category);
    await this.saveData();
    return category;
  }

  async getAuctions(categoryId?: number, searchTerm?: string): Promise<AuctionWithDetails[]> {
    let auctionList = Array.from(this.auctions.values());
    
    if (categoryId) {
      auctionList = auctionList.filter(auction => auction.categoryId === categoryId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      auctionList = auctionList.filter(auction => 
        auction.title.toLowerCase().includes(term) ||
        auction.description.toLowerCase().includes(term)
      );
    }

    const auctionsWithDetails: AuctionWithDetails[] = [];
    
    for (const auction of auctionList) {
      const category = this.categories.get(auction.categoryId);
      const seller = this.users.get(auction.sellerId);
      
      if (category && seller) {
        const bidsForAuction = Array.from(this.bids.values())
          .filter(bid => bid.auctionId === auction.id)
          .sort((a, b) => Number(b.amount) - Number(a.amount));
        
        let highestBid;
        if (bidsForAuction.length > 0) {
          const bidder = this.users.get(bidsForAuction[0].bidderId);
          if (bidder) {
            highestBid = { ...bidsForAuction[0], bidder };
          }
        }

        auctionsWithDetails.push({
          ...auction,
          category,
          seller,
          highestBid,
        });
      }
    }

    return auctionsWithDetails.sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  }

  async getAuction(id: number): Promise<AuctionWithDetails | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;

    const category = this.categories.get(auction.categoryId);
    const seller = this.users.get(auction.sellerId);
    
    if (!category || !seller) return undefined;

    const bidsForAuction = Array.from(this.bids.values())
      .filter(bid => bid.auctionId === auction.id)
      .sort((a, b) => Number(b.amount) - Number(a.amount));
    
    let highestBid;
    if (bidsForAuction.length > 0) {
      const bidder = this.users.get(bidsForAuction[0].bidderId);
      if (bidder) {
        highestBid = { ...bidsForAuction[0], bidder };
      }
    }

    return {
      ...auction,
      category,
      seller,
      highestBid,
    };
  }

  async createAuction(auctionData: InsertAuction & { duration: number }): Promise<Auction> {
    const { duration, ...insertAuction } = auctionData;
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + duration);

    const auction: Auction = {
      ...insertAuction,
      id: this.currentAuctionId++,
      currentBid: insertAuction.startingBid,
      bidCount: 0,
      startTime: new Date(),
      endTime,
      isActive: true,
    };
    
    this.auctions.set(auction.id, auction);
    await this.saveData();
    return auction;
  }

  async updateAuctionBid(auctionId: number, newBid: number): Promise<void> {
    const auction = this.auctions.get(auctionId);
    if (auction) {
      auction.currentBid = newBid.toString() as any;
      auction.bidCount++;
      this.auctions.set(auctionId, auction);
      await this.saveData();
    }
  }

  async getBidsForAuction(auctionId: number): Promise<(Bid & { bidder: User })[]> {
    const auctionBids = Array.from(this.bids.values())
      .filter(bid => bid.auctionId === auctionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const bidsWithBidders: (Bid & { bidder: User })[] = [];
    
    for (const bid of auctionBids) {
      const bidder = this.users.get(bid.bidderId);
      if (bidder) {
        bidsWithBidders.push({ ...bid, bidder });
      }
    }

    return bidsWithBidders;
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const bid: Bid = {
      ...insertBid,
      id: this.currentBidId++,
      timestamp: new Date(),
    };
    
    this.bids.set(bid.id, bid);
    await this.updateAuctionBid(bid.auctionId, Number(bid.amount));
    return bid;
  }

  async getSoldItemsByDateRange(startDate: Date, endDate: Date): Promise<AuctionWithDetails[]> {
    const soldAuctions = Array.from(this.auctions.values()).filter(auction => 
      !auction.isActive && 
      auction.endTime >= startDate && 
      auction.endTime <= endDate &&
      auction.bidCount > 0
    );

    const soldWithDetails: AuctionWithDetails[] = [];
    
    for (const auction of soldAuctions) {
      const auctionWithDetails = await this.getAuction(auction.id);
      if (auctionWithDetails) {
        soldWithDetails.push(auctionWithDetails);
      }
    }

    return soldWithDetails;
  }

  async getActiveAuctions(): Promise<AuctionWithDetails[]> {
    const now = new Date();
    const activeAuctions = Array.from(this.auctions.values()).filter(auction => 
      auction.isActive && auction.endTime > now
    );

    const activeWithDetails: AuctionWithDetails[] = [];
    
    for (const auction of activeAuctions) {
      const auctionWithDetails = await this.getAuction(auction.id);
      if (auctionWithDetails) {
        activeWithDetails.push(auctionWithDetails);
      }
    }

    return activeWithDetails;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  private async saveData(): Promise<void> {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        auctions: Array.from(this.auctions.entries()),
        categories: Array.from(this.categories.entries()),
        bids: Array.from(this.bids.entries()),
        counters: {
          userId: this.currentUserId,
          auctionId: this.currentAuctionId,
          categoryId: this.currentCategoryId,
          bidId: this.currentBidId,
        }
      };

      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(
        path.join(dataDir, 'auction_data.json'),
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async loadData(): Promise<void> {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'auction_data.json');
      const dataStr = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(dataStr);

      this.users = new Map(data.users || []);
      this.auctions = new Map(data.auctions || []);
      this.categories = new Map(data.categories || []);
      this.bids = new Map(data.bids || []);

      if (data.counters) {
        this.currentUserId = data.counters.userId || 1;
        this.currentAuctionId = data.counters.auctionId || 1;
        this.currentCategoryId = data.counters.categoryId || 1;
        this.currentBidId = data.counters.bidId || 1;
      }
    } catch (error) {
      console.log('No existing data found, starting fresh');
    }
  }
}

export const storage = new MemStorage();
