// Simple test script to verify queue system
const { getQueueStats, addCrawlerJob } = require('./lib/queue/crawler-queue');

async function testQueue() {
  try {
    console.log('🧪 Testing queue system...');
    
    // Test queue stats
    const stats = await getQueueStats();
    console.log('📊 Queue stats:', stats);
    
    // Test adding a job
    const jobResult = await addCrawlerJob({
      projectId: 'test-project-123',
      baseUrl: 'https://example.com',
      userId: 'test-user-123',
      crawlType: 'single',
      scraperOptions: {
        maxPages: 1,
        maxDepth: 0,
        followExternal: false,
        respectRobotsTxt: true,
      },
      priority: 1,
    });
    
    console.log('✅ Job added:', jobResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testQueue();
