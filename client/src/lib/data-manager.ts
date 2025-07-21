// Client-side data management utilities
export class DataManager {
  private static instance: DataManager;
  
  private constructor() {
    this.setupAutoSave();
  }
  
  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }
  
  private setupAutoSave(): void {
    // Save important client state to localStorage periodically
    setInterval(() => {
      this.saveClientState();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  private saveClientState(): void {
    try {
      const clientState = {
        timestamp: new Date().toISOString(),
        // Add any client-specific state that should persist
      };
      localStorage.setItem('auctionhub_client_state', JSON.stringify(clientState));
    } catch (error) {
      console.error('Failed to save client state:', error);
    }
  }
  
  public exportUserData(): void {
    // Export user's auction history, bids, etc.
    const userData = {
      exportedAt: new Date().toISOString(),
      // This would be populated with user's data from the server
    };
    
    this.downloadAsJSON(userData, 'my_auction_data');
  }
  
  private downloadAsJSON(data: any, filename: string): void {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

// Initialize the data manager
export const dataManager = DataManager.getInstance();
