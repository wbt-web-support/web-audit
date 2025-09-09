#!/usr/bin/env ts-node

/**
 * Update Scaling Configuration Script
 * Updates queue sizes and worker counts based on MAX_USERS environment variable
 */

import { dynamicScalingManager } from '../lib/saas/config/dynamic-scaling';
import { tenantManager } from '../lib/saas/core/tenant-manager';
import { tenantQueueManager } from '../lib/saas/queue/tenant-queue-manager';

async function updateScalingConfiguration() {
  try {
    console.log('🔄 Starting dynamic scaling configuration update...');

    // Validate current configuration
    const validation = dynamicScalingManager.validateScalingConfig();
    if (!validation.valid) {
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Get current scaling configuration
    const scalingConfig = dynamicScalingManager.getScalingConfig();
    const systemResources = dynamicScalingManager.getSystemResourceAllocation();

    console.log('📊 Current scaling configuration:');
    console.log(`  Max Users: ${scalingConfig.maxUsers}`);
    console.log(`  Queue Size Per User: ${scalingConfig.queueSizePerUser}`);
    console.log(`  Workers Per User: ${scalingConfig.workersPerUser}`);
    console.log(`  Concurrency Per Worker: ${scalingConfig.concurrencyPerWorker}`);
    console.log(`  Memory Per Worker: ${scalingConfig.memoryPerWorker}MB`);
    console.log(`  CPU Per Worker: ${scalingConfig.cpuPerWorker} cores`);

    console.log('\n📈 System resource allocation:');
    console.log(`  Total Workers: ${systemResources.totalWorkers}`);
    console.log(`  Total Queue Size: ${systemResources.totalQueueSize}`);
    console.log(`  Memory Allocation: ${systemResources.memoryAllocation}MB`);
    console.log(`  CPU Allocation: ${systemResources.cpuAllocation} cores`);
    console.log(`  Recommended Instances: ${systemResources.recommendedInstances}`);

    // Update tenant limits
    console.log('\n🏢 Updating tenant limits...');
    const tenantUpdateResult = await tenantManager.updateAllTenantLimits();
    console.log(`  Updated ${tenantUpdateResult.updated} tenants`);
    if (tenantUpdateResult.errors.length > 0) {
      console.warn('  Errors:');
      tenantUpdateResult.errors.forEach(error => console.warn(`    - ${error}`));
    }

    // Update queue configurations
    console.log('\n⚙️ Updating queue configurations...');
    const queueUpdateResult = await tenantQueueManager.updateQueueConfigurations();
    console.log(`  Updated ${queueUpdateResult.updated} queues`);
    if (queueUpdateResult.errors.length > 0) {
      console.warn('  Errors:');
      queueUpdateResult.errors.forEach(error => console.warn(`    - ${error}`));
    }

    // Generate environment configuration
    console.log('\n🔧 Generated environment configuration:');
    const envConfig = dynamicScalingManager.generateEnvironmentConfig();
    Object.entries(envConfig).forEach(([key, value]) => {
      console.log(`  ${key}=${value}`);
    });

    console.log('\n✅ Dynamic scaling configuration update completed successfully!');

    // Show recommendations
    console.log('\n💡 Recommendations:');
    if (systemResources.recommendedInstances > 1) {
      console.log(`  - Consider deploying ${systemResources.recommendedInstances} instances for optimal performance`);
    }
    if (systemResources.memoryAllocation > 4096) {
      console.log('  - High memory usage detected, consider optimizing worker memory allocation');
    }
    if (systemResources.cpuAllocation > 8) {
      console.log('  - High CPU usage detected, consider optimizing worker concurrency');
    }

  } catch (error) {
    console.error('❌ Error updating scaling configuration:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateScalingConfiguration();
}

export { updateScalingConfiguration };
