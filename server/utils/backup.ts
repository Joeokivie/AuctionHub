import fs from 'fs/promises';
import path from 'path';

export class BackupManager {
  private backupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startAutoBackup();
  }

  private startAutoBackup(): void {
    // Auto-backup every 5 minutes
    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, 5 * 60 * 1000);
  }

  private async createBackup(): Promise<void> {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'auction_data.json');
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `auction_data_${timestamp}.json`);
      
      const data = await fs.readFile(dataPath, 'utf-8');
      await fs.writeFile(backupPath, data);
      
      console.log(`Backup created: ${backupPath}`);
      
      // Keep only the last 10 backups
      await this.cleanupOldBackups(backupDir);
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  private async cleanupOldBackups(backupDir: string): Promise<void> {
    try {
      const files = await fs.readdir(backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('auction_data_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          time: fs.stat(path.join(backupDir, file)).then(stats => stats.mtime)
        }));

      const filesWithTimes = await Promise.all(
        backupFiles.map(async file => ({
          ...file,
          time: await file.time
        }))
      );

      const sortedFiles = filesWithTimes.sort((a, b) => b.time.getTime() - a.time.getTime());

      // Delete files beyond the 10 most recent
      if (sortedFiles.length > 10) {
        const filesToDelete = sortedFiles.slice(10);
        await Promise.all(filesToDelete.map(file => fs.unlink(file.path)));
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  public stop(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }
}
