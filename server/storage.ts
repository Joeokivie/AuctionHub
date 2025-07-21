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
    
    this.initializeDefaultCategories();
    this.loadData();
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
