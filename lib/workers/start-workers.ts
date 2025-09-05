import { startCrawlerWorker } from '@/lib/queue/crawler-queue';

// Start all workers
export async function startAllWorkers() {
  try {
    console.log('🚀 Starting optimized crawler workers...');
    
    // Start crawler worker
    await startCrawlerWorker();
    
    console.log('✅ All workers started successfully');
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Auto-start workers if this file is run directly
if (require.main === module) {
  startAllWorkers();
}
