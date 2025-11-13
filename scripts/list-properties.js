/**
 * List All Properties Script
 * Fetches and displays all properties from the mobile API
 * 
 * Usage: node list-properties.js [baseUrl] [options]
 * Example: node list-properties.js http://localhost:3000
 * Example: node list-properties.js http://localhost:3000 --filter=Trending
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const args = process.argv.slice(2);
const filterArg = args.find(arg => arg.startsWith('--filter='));
const statusArg = args.find(arg => arg.startsWith('--status='));
const cityArg = args.find(arg => arg.startsWith('--city='));
const minROIArg = args.find(arg => arg.startsWith('--minROI='));
const limitArg = args.find(arg => arg.startsWith('--limit='));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatPercentage(num) {
  return `${num.toFixed(2)}%`;
}

function displayProperty(property, index) {
  log(`\n${index + 1}. ${property.title}`, 'bright');
  log(`   ${'─'.repeat(76)}`, 'gray');
  
  log(`   Display Code: ${property.displayCode}`, 'gray');
  log(`   ID: ${property.id}`, 'gray');
  
  if (property.location) {
    log(`   Location: ${property.location}`, 'cyan');
  } else if (property.city || property.country) {
    log(`   Location: ${[property.city, property.country].filter(Boolean).join(', ')}`, 'cyan');
  }
  
  log(`   Status: ${property.status}`, property.status === 'active' ? 'green' : 'yellow');
  
  log(`\n   Financial Details:`, 'bright');
  log(`   • Valuation: ${formatCurrency(property.valuation)}`, 'green');
  log(`   • Token Price: ${formatCurrency(property.tokenPrice)}`, 'green');
  log(`   • Min Investment: ${formatCurrency(property.minInvestment || property.tokenPrice)}`, 'green');
  log(`   • Estimated ROI: ${formatPercentage(property.estimatedROI)}`, 'green');
  log(`   • Estimated Yield: ${formatPercentage(property.estimatedYield || property.estimatedROI)}`, 'green');
  
  log(`\n   Token Information:`, 'bright');
  log(`   • Total Tokens: ${formatNumber(property.totalTokens)}`, 'blue');
  log(`   • Sold Tokens: ${formatNumber(property.soldTokens || 0)}`, 'blue');
  log(`   • Available Tokens: ${formatNumber(property.availableTokens || property.totalTokens)}`, 'blue');
  
  const soldPercentage = property.totalTokens > 0 
    ? ((property.soldTokens || 0) / property.totalTokens * 100).toFixed(1)
    : 0;
  log(`   • Sold: ${soldPercentage}%`, 'blue');
  
  if (property.completionDate) {
    log(`   • Completion Date: ${property.completionDate}`, 'magenta');
  }
  
  if (property.builder && property.builder.name) {
    log(`\n   Builder: ${property.builder.name}`, 'yellow');
    if (property.builder.rating) {
      log(`   Builder Rating: ${property.builder.rating}/5`, 'yellow');
    }
  }
  
  if (property.amenities && property.amenities.length > 0) {
    log(`\n   Amenities: ${property.amenities.join(', ')}`, 'gray');
  }
  
  if (property.description) {
    const desc = property.description.length > 150 
      ? property.description.substring(0, 150) + '...'
      : property.description;
    log(`\n   Description: ${desc}`, 'gray');
  }
  
  if (property.images && property.images.length > 0) {
    log(`\n   Images: ${property.images.length} image(s)`, 'gray');
  }
  
  log(`   Created: ${new Date(property.createdAt).toLocaleDateString()}`, 'gray');
}

async function fetchAllProperties() {
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;
  let page = 1;
  let allProperties = [];
  let hasMore = true;
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (filterArg) {
    const filter = filterArg.split('=')[1];
    params.append('filter', filter);
  }
  
  if (statusArg) {
    const status = statusArg.split('=')[1];
    params.append('status', status);
  }
  
  if (cityArg) {
    const city = cityArg.split('=')[1];
    params.append('city', city);
  }
  
  if (minROIArg) {
    const minROI = minROIArg.split('=')[1];
    params.append('minROI', minROI);
  }
  
  logSection('Fetching Properties from Mobile API');
  log(`Base URL: ${BASE_URL}`, 'gray');
  
  if (filterArg || statusArg || cityArg || minROIArg) {
    log('Filters:', 'yellow');
    if (filterArg) log(`  • Filter: ${filterArg.split('=')[1]}`, 'gray');
    if (statusArg) log(`  • Status: ${statusArg.split('=')[1]}`, 'gray');
    if (cityArg) log(`  • City: ${cityArg.split('=')[1]}`, 'gray');
    if (minROIArg) log(`  • Min ROI: ${minROIArg.split('=')[1]}%`, 'gray');
  }
  
  log('', 'reset');
  
  try {
    // Fetch all pages
    while (hasMore) {
      params.set('page', page.toString());
      const url = `${BASE_URL}/api/mobile/properties?${params.toString()}`;
      
      log(`Fetching page ${page}...`, 'gray');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        allProperties = allProperties.concat(data.data);
        log(`  ✓ Retrieved ${data.data.length} properties (Total: ${allProperties.length})`, 'green');
        
        // Check if there are more pages
        if (data.meta && page < data.meta.totalPages) {
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    return allProperties;
  } catch (error) {
    log(`\n❌ Error fetching properties: ${error.message}`, 'red');
    if (error.message.includes('fetch')) {
      log('   Make sure the backend server is running!', 'yellow');
    }
    process.exit(1);
  }
}

async function displaySummary(properties) {
  logSection('Summary Statistics');
  
  const totalValuation = properties.reduce((sum, p) => sum + (p.valuation || 0), 0);
  const totalTokens = properties.reduce((sum, p) => sum + (p.totalTokens || 0), 0);
  const soldTokens = properties.reduce((sum, p) => sum + (p.soldTokens || 0), 0);
  const avgROI = properties.length > 0
    ? properties.reduce((sum, p) => sum + (p.estimatedROI || 0), 0) / properties.length
    : 0;
  
  const statusCounts = {};
  properties.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  log(`Total Properties: ${properties.length}`, 'bright');
  log(`Total Valuation: ${formatCurrency(totalValuation)}`, 'green');
  log(`Total Tokens: ${formatNumber(totalTokens)}`, 'blue');
  log(`Sold Tokens: ${formatNumber(soldTokens)}`, 'blue');
  log(`Average ROI: ${formatPercentage(avgROI)}`, 'green');
  
  log(`\nProperties by Status:`, 'bright');
  Object.entries(statusCounts).forEach(([status, count]) => {
    log(`  • ${status}: ${count}`, 'gray');
  });
  
  const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];
  if (cities.length > 0) {
    log(`\nCities: ${cities.join(', ')}`, 'cyan');
  }
}

async function main() {
  try {
    const properties = await fetchAllProperties();
    
    if (properties.length === 0) {
      log('\n⚠ No properties found', 'yellow');
      process.exit(0);
    }
    
    logSection(`All Properties (${properties.length} total)`);
    
    properties.forEach((property, index) => {
      displayProperty(property, index);
    });
    
    await displaySummary(properties);
    
    log('\n' + '='.repeat(80), 'cyan');
    log(`\n✅ Successfully displayed ${properties.length} properties`, 'green');
    log('', 'reset');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ with native fetch support.');
  console.error('Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node list-properties.js [baseUrl] [options]

Options:
  --filter=<filter>     Filter by: Trending, High Yield, New Listings, Completed
  --status=<status>     Filter by status: active, funding, soldout, etc.
  --city=<city>         Filter by city name
  --minROI=<number>     Minimum ROI percentage
  --limit=<number>      Items per page (default: 100)
  --help, -h            Show this help message

Examples:
  node list-properties.js
  node list-properties.js http://localhost:3000
  node list-properties.js http://localhost:3000 --filter=Trending
  node list-properties.js http://localhost:3000 --status=active --city=Karachi
  node list-properties.js http://localhost:3000 --minROI=10 --limit=50
`);
  process.exit(0);
}

// Run the script
main();

