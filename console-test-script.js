// Browser Console Load Test Script for /api/audit-projects
// Run this in your browser's developer console after logging in

console.log('🚀 Starting API Load Test Script...');

// Configuration
const CONFIG = {
    apiEndpoint: '/api/audit-projects',
    websiteUrl: 'https://njdesignpark.com/',
    totalRequests: 500,
    batchSize: 50,
    batchDelay: 100, // ms between batches
    maxConcurrent: 10 // Max concurrent requests at once
};

// Test results tracking
const testResults = {
    total: 0,
    successful: 0,
    errors: 0,
    rateLimited: 0,
    responseTimes: [],
    details: [],
    startTime: null,
    endTime: null
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
}

function updateStats() {
    const avgTime = testResults.responseTimes.length > 0 
        ? Math.round(testResults.responseTimes.reduce((a, b) => a + b, 0) / testResults.responseTimes.length)
        : 0;
    
    const duration = testResults.startTime ? Math.round((Date.now() - testResults.startTime) / 1000) : 0;
    const progress = testResults.total > 0 ? ((testResults.successful + testResults.errors) / testResults.total * 100).toFixed(1) : 0;
    
    console.log(`📊 Progress: ${progress}% | Total: ${testResults.total} | Success: ${testResults.successful} | Errors: ${testResults.errors} | Rate Limited: ${testResults.rateLimited} | Avg Time: ${avgTime}ms | Duration: ${duration}s`);
}

// Create a single project request
async function createProjectRequest(index) {
    const startTime = Date.now();
    
    const payload = {
        base_url: CONFIG.websiteUrl,
        crawlType: 'full',
        services: ['seo', 'performance', 'accessibility'],
        companyDetails: {
            companyName: `NJ Design Park Test ${index}`,
            phoneNumber: '+91 9301969082',
            email: 'naren@njdesignpark.com',
            address: 'KK Tower, 2nd floor, street 36, Smriti nagar, Bhilai – 490020'
        },
        instructions: [`Test project ${index} for load testing`],
        custom_urls: [],
        stripe_key_urls: []
    };

    try {
        const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const responseTime = Date.now() - startTime;
        testResults.responseTimes.push(responseTime);

        const responseData = await response.json();

        if (response.ok) {
            testResults.successful++;
            log(`Request ${index}: SUCCESS (${responseTime}ms) - Project ID: ${responseData.project?.id || 'N/A'}`, 'success');
        } else {
            testResults.errors++;
            if (response.status === 429) {
                testResults.rateLimited++;
                log(`Request ${index}: RATE LIMITED (${responseTime}ms) - ${responseData.error}`, 'warning');
            } else {
                log(`Request ${index}: ERROR (${responseTime}ms) - ${responseData.error || 'Unknown error'}`, 'error');
            }
        }

        testResults.details.push({
            index,
            status: response.status,
            responseTime,
            success: response.ok,
            error: responseData.error,
            projectId: responseData.project?.id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        const responseTime = Date.now() - startTime;
        testResults.responseTimes.push(responseTime);
        testResults.errors++;
        log(`Request ${index}: NETWORK ERROR (${responseTime}ms) - ${error.message}`, 'error');
        
        testResults.details.push({
            index,
            status: 0,
            responseTime,
            success: false,
            error: error.message,
            projectId: null,
            timestamp: new Date().toISOString()
        });
    }

    testResults.total++;
    
    // Update stats every 10 requests
    if (testResults.total % 10 === 0) {
        updateStats();
    }
}

// Process requests in batches with controlled concurrency
async function processBatch(requests) {
    const results = [];
    
    for (let i = 0; i < requests.length; i += CONFIG.maxConcurrent) {
        const batch = requests.slice(i, i + CONFIG.maxConcurrent);
        const batchPromises = batch.map(requestIndex => createProjectRequest(requestIndex));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between concurrent groups
        if (i + CONFIG.maxConcurrent < requests.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    
    return results;
}

// Main load test function
async function runLoadTest() {
    log('Starting load test...', 'info');
    log(`Configuration: ${CONFIG.totalRequests} requests, ${CONFIG.batchSize} per batch, ${CONFIG.batchDelay}ms delay`, 'info');
    log(`Website: ${CONFIG.websiteUrl}`, 'info');
    log(`API Endpoint: ${CONFIG.apiEndpoint}`, 'info');
    
    testResults.startTime = Date.now();
    
    try {
        // Create array of request indices
        const allRequests = Array.from({ length: CONFIG.totalRequests }, (_, i) => i + 1);
        
        // Process in batches
        for (let i = 0; i < allRequests.length; i += CONFIG.batchSize) {
            const batch = allRequests.slice(i, i + CONFIG.batchSize);
            const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;
            const totalBatches = Math.ceil(CONFIG.totalRequests / CONFIG.batchSize);
            
            log(`Processing batch ${batchNumber}/${totalBatches} (requests ${i + 1}-${Math.min(i + CONFIG.batchSize, CONFIG.totalRequests)})`, 'info');
            
            await processBatch(batch);
            
            // Delay between batches (except for the last batch)
            if (i + CONFIG.batchSize < allRequests.length && CONFIG.batchDelay > 0) {
                log(`Waiting ${CONFIG.batchDelay}ms before next batch...`, 'info');
                await new Promise(resolve => setTimeout(resolve, CONFIG.batchDelay));
            }
        }
        
        testResults.endTime = Date.now();
        
        // Final results
        log('🎉 Load test completed!', 'success');
        log(`📊 Final Results:`, 'info');
        log(`   Total Requests: ${testResults.total}`, 'info');
        log(`   Successful: ${testResults.successful}`, 'success');
        log(`   Errors: ${testResults.errors}`, 'error');
        log(`   Rate Limited: ${testResults.rateLimited}`, 'warning');
        
        const avgResponseTime = testResults.responseTimes.length > 0 
            ? Math.round(testResults.responseTimes.reduce((a, b) => a + b, 0) / testResults.responseTimes.length)
            : 0;
        log(`   Average Response Time: ${avgResponseTime}ms`, 'info');
        
        const successRate = testResults.total > 0 ? (testResults.successful / testResults.total * 100).toFixed(2) : 0;
        log(`   Success Rate: ${successRate}%`, 'info');
        
        const totalDuration = Math.round((testResults.endTime - testResults.startTime) / 1000);
        log(`   Total Duration: ${totalDuration}s`, 'info');
        
        // Rate limiting analysis
        if (testResults.rateLimited > 0) {
            log(`⚠️  Rate limiting kicked in after ${testResults.successful + testResults.rateLimited} requests`, 'warning');
            log(`   This is expected behavior for BASIC tier users (200 requests/minute limit)`, 'info');
        }
        
        // Performance analysis
        const minTime = Math.min(...testResults.responseTimes);
        const maxTime = Math.max(...testResults.responseTimes);
        log(`   Response Time Range: ${minTime}ms - ${maxTime}ms`, 'info');
        
        // Store results globally for inspection
        window.loadTestResults = testResults;
        log('💾 Results stored in window.loadTestResults for inspection', 'info');
        
    } catch (error) {
        log(`❌ Test failed: ${error.message}`, 'error');
        console.error('Full error:', error);
    }
}

// Helper functions for analysis
function analyzeResults() {
    if (!window.loadTestResults) {
        console.log('❌ No test results found. Run runLoadTest() first.');
        return;
    }
    
    const results = window.loadTestResults;
    console.log('📈 Detailed Analysis:');
    
    // Group by status codes
    const statusGroups = {};
    results.details.forEach(detail => {
        const status = detail.status;
        if (!statusGroups[status]) statusGroups[status] = 0;
        statusGroups[status]++;
    });
    
    console.log('Status Code Distribution:', statusGroups);
    
    // Response time percentiles
    const sortedTimes = [...results.responseTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p90 = sortedTimes[Math.floor(sortedTimes.length * 0.9)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    console.log('Response Time Percentiles:');
    console.log(`  P50: ${p50}ms`);
    console.log(`  P90: ${p90}ms`);
    console.log(`  P95: ${p95}ms`);
    console.log(`  P99: ${p99}ms`);
    
    // Error analysis
    const errors = results.details.filter(d => !d.success);
    if (errors.length > 0) {
        console.log('Error Analysis:');
        const errorTypes = {};
        errors.forEach(error => {
            const type = error.status === 429 ? 'Rate Limited' : 
                        error.status === 0 ? 'Network Error' : 
                        `HTTP ${error.status}`;
            if (!errorTypes[type]) errorTypes[type] = 0;
            errorTypes[type]++;
        });
        console.log(errorTypes);
    }
}

function exportResults() {
    if (!window.loadTestResults) {
        console.log('❌ No test results found. Run runLoadTest() first.');
        return;
    }
    
    const results = {
        config: CONFIG,
        results: window.loadTestResults,
        summary: {
            totalRequests: window.loadTestResults.total,
            successful: window.loadTestResults.successful,
            errors: window.loadTestResults.errors,
            rateLimited: window.loadTestResults.rateLimited,
            successRate: window.loadTestResults.total > 0 ? 
                (window.loadTestResults.successful / window.loadTestResults.total * 100).toFixed(2) + '%' : '0%',
            averageResponseTime: window.loadTestResults.responseTimes.length > 0 
                ? Math.round(window.loadTestResults.responseTimes.reduce((a, b) => a + b, 0) / window.loadTestResults.responseTimes.length) + 'ms'
                : '0ms',
            testDuration: window.loadTestResults.startTime ? 
                Math.round((window.loadTestResults.endTime - window.loadTestResults.startTime) / 1000) + 's' : '0s'
        }
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `load-test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Results exported successfully');
}

// Quick test functions
async function quickTest(count = 10) {
    log(`Running quick test with ${count} requests...`, 'info');
    CONFIG.totalRequests = count;
    CONFIG.batchSize = count;
    CONFIG.batchDelay = 0;
    await runLoadTest();
}

async function rateLimitTest() {
    log('Running rate limit test (sending requests as fast as possible)...', 'info');
    CONFIG.totalRequests = 100;
    CONFIG.batchSize = 100;
    CONFIG.batchDelay = 0;
    CONFIG.maxConcurrent = 20;
    await runLoadTest();
}

// Display available commands
console.log('🎯 Available Commands:');
console.log('  runLoadTest()           - Run full 500 request load test');
console.log('  quickTest(10)           - Run quick test with 10 requests');
console.log('  rateLimitTest()         - Test rate limiting with 100 fast requests');
console.log('  analyzeResults()        - Analyze test results');
console.log('  exportResults()         - Export results as JSON file');
console.log('  window.loadTestResults  - Access raw test results');
console.log('');
console.log('⚙️  Configuration:');
console.log(`  Total Requests: ${CONFIG.totalRequests}`);
console.log(`  Batch Size: ${CONFIG.batchSize}`);
console.log(`  Batch Delay: ${CONFIG.batchDelay}ms`);
console.log(`  Max Concurrent: ${CONFIG.maxConcurrent}`);
console.log(`  Website URL: ${CONFIG.websiteUrl}`);
console.log('');
console.log('🚀 Ready to test! Make sure you are logged in, then run: runLoadTest()');
