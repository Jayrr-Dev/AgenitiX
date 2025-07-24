/**
 * UI Overview Generator
 * 
 * Automatically generates the UI components overview HTML by scanning
 * the components/ui directory and creating component cards dynamically.
 * 
 * Features:
 * - Scans components/ui directory for all UI components
 * - Categorizes components based on their location and content
 * - Generates statistics and component cards
 * - Creates interactive HTML with search and filter functionality
 * 
 * Usage: pnpm run generate-ui-overview
 */

import fs from 'fs';
import path from 'path';

interface ComponentInfo {
  name: string;
  category: string;
  description: string;
  features: string[];
  filePath: string;
  hasDocumentation: boolean;
  hasInteractive: boolean;
}

interface CategoryStats {
  [key: string]: number;
}

const COMPONENTS_DIR = path.join(process.cwd(), 'components/ui');
const DOCUMENTATION_DIR = path.join(process.cwd(), 'documentation/ui');
const OUTPUT_FILE = path.join(process.cwd(), 'documentation/ui/overview.html');

const CATEGORY_MAPPING: { [key: string]: string } = {
  'core': 'Core',
  'interactive': 'Interactive', 
  'animation': 'Animation',
  'layout': 'Layout',
  'effects': 'Effects'
};

const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  'core': 'Essential UI components for basic functionality',
  'interactive': 'Interactive components with user interactions',
  'animation': 'Animated components with motion effects',
  'layout': 'Layout and structural components',
  'effects': 'Special visual effects and enhancements'
};

const FEATURE_MAPPING: { [key: string]: string[] } = {
  'button': ['Variants', 'Sizes', 'Accessible', 'Polymorphic'],
  'card': ['Header', 'Content', 'Footer', 'Responsive'],
  'dialog': ['Modal', 'Overlay', 'Animated', 'Accessible'],
  'accordion': ['Collapsible', 'Animated', 'Keyboard', 'Single/Multiple'],
  'tabs': ['Navigation', 'Animated', 'Keyboard', 'Responsive'],
  '3d-marquee': ['3D Rotation', 'Motion', 'Grid Layout', 'Responsive'],
  'canvas-reveal-effect': ['Canvas', 'Reveal', 'Smooth', 'Performance'],
  'scroll-area': ['Custom Scroll', 'Styled', 'Smooth', 'Cross-platform'],
  'input': ['Form', 'Accessible', 'Styled', 'Responsive'],
  'label': ['Form', 'Accessible', 'Semantic', 'Styled'],
  'checkbox': ['Form', 'Custom', 'Accessible', 'Styled'],
  'badge': ['Status', 'Labels', 'Variants', 'Compact'],
  'dropdown-menu': ['Context Menu', 'Submenus', 'Keyboard', 'Animated'],
  'navigation-menu': ['Navigation', 'Dropdowns', 'Keyboard', 'Responsive'],
  'tooltip': ['Hover', 'Positioning', 'Accessible', 'Animated'],
  'sheet': ['Slide-out', 'Overlay', 'Animated', 'Responsive'],
  'infinite-moving-cards': ['Infinite', 'Scrolling', 'Smooth', 'Performance'],
  'container-scroll-animation': ['Scroll-triggered', 'Intersection', 'Performance', 'Smooth'],
  'flip-words': ['Text', 'Flip', 'Smooth', 'Animated'],
  'logo-ticker': ['Logo', 'Scrolling', 'Continuous', 'Smooth'],
  'carousel': ['Carousel', 'Navigation', 'Controls', 'Responsive'],
  'carousel-dot-buttons': ['Dots', 'Navigation', 'Indicators', 'Controls'],
  'animated-testimonials': ['Testimonials', 'Animated', 'Smooth', 'Responsive'],
  'blur-image': ['Blur', 'Loading', 'Transitions', 'Performance'],
  'sonner': ['Toast', 'Notifications', 'Animated', 'Positioning'],
  'apple-cards-carousel': ['Carousel', 'Apple Style', 'Gestures', 'Smooth'],
  'google-gemini-effect': ['Particles', 'Gemini Style', 'Interactive', 'Performance']
};

const COMPONENT_DESCRIPTIONS: { [key: string]: string } = {
  'button': 'Versatile button component with multiple variants, sizes, and accessibility features.',
  'card': 'Flexible container component for displaying content in a structured layout.',
  'dialog': 'Modal dialog component with overlay, animations, and accessibility features.',
  'accordion': 'Collapsible content component with smooth animations and keyboard navigation.',
  'tabs': 'Tabbed content navigation with smooth transitions and accessibility.',
  '3d-marquee': 'Sophisticated 3D rotating image gallery with motion effects and grid overlays.',
  'canvas-reveal-effect': 'Animated reveal component with canvas-based effects and smooth transitions.',
  'scroll-area': 'Custom scrollable container with styled scrollbars and smooth scrolling.',
  'input': 'Form input component with consistent styling and accessibility features.',
  'label': 'Form label component with proper accessibility and styling.',
  'checkbox': 'Checkbox input component with custom styling and accessibility.',
  'badge': 'Status and label badge component with various styles and colors.',
  'dropdown-menu': 'Context menu component with submenus and keyboard navigation.',
  'navigation-menu': 'Navigation component with dropdowns and keyboard accessibility.',
  'tooltip': 'Hover tooltip component with positioning and accessibility.',
  'sheet': 'Slide-out panel component with overlay and animations.',
  'infinite-moving-cards': 'Continuously scrolling cards with smooth infinite animation.',
  'container-scroll-animation': 'Scroll-triggered animations with intersection observer.',
  'flip-words': 'Text flip animation component with smooth transitions.',
  'logo-ticker': 'Scrolling logo display with smooth continuous animation.',
  'carousel': 'Image/content carousel with navigation and controls.',
  'carousel-dot-buttons': 'Carousel navigation with dot indicators and controls.',
  'animated-testimonials': 'Animated testimonial display with smooth transitions and effects.',
  'blur-image': 'Blur effect image component with loading states and transitions.',
  'sonner': 'Toast notification component with smooth animations and positioning.',
  'apple-cards-carousel': 'Apple-style card carousel with smooth animations and gesture support.',
  'google-gemini-effect': 'Google Gemini-style visual effect with particle animations and interactions.'
};

function getComponentCategory(filePath: string): string {
  const fileName = path.basename(filePath, '.tsx');
  
  // Check if it's in a specific category folder
  const relativePath = path.relative(COMPONENTS_DIR, filePath);
  const parts = relativePath.split(path.sep);
  
  if (parts.length > 1) {
    const category = parts[0];
    if (CATEGORY_MAPPING[category]) {
      return category;
    }
  }
  
  // Default categorization based on component name
  if (fileName.includes('button') || fileName.includes('input') || fileName.includes('card') || 
      fileName.includes('dialog') || fileName.includes('label') || fileName.includes('checkbox') || 
      fileName.includes('badge')) {
    return 'core';
  }
  
  if (fileName.includes('accordion') || fileName.includes('tabs') || fileName.includes('dropdown') || 
      fileName.includes('navigation') || fileName.includes('tooltip') || fileName.includes('sheet')) {
    return 'interactive';
  }
  
  if (fileName.includes('marquee') || fileName.includes('animation') || fileName.includes('scroll') || 
      fileName.includes('flip') || fileName.includes('ticker') || fileName.includes('moving')) {
    return 'animation';
  }
  
  if (fileName.includes('carousel') || fileName.includes('scroll-area')) {
    return 'layout';
  }
  
  if (fileName.includes('testimonials') || fileName.includes('blur') || fileName.includes('sonner') || 
      fileName.includes('apple') || fileName.includes('gemini')) {
    return 'effects';
  }
  
  return 'core'; // Default to core
}

function getComponentFeatures(componentName: string): string[] {
  return FEATURE_MAPPING[componentName] || ['Responsive', 'Accessible', 'Styled', 'Modern'];
}

function getComponentDescription(componentName: string): string {
  return COMPONENT_DESCRIPTIONS[componentName] || 
    'Modern UI component with responsive design and accessibility features.';
}

function scanComponents(): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  
  function scanDirectory(dir: string, category: string = 'core') {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath, file);
      } else if (file.endsWith('.tsx') && !file.startsWith('.')) {
        const componentName = path.basename(file, '.tsx');
        const componentCategory = getComponentCategory(filePath);
        
        // Check if documentation exists
        const docPath = path.join(DOCUMENTATION_DIR, componentCategory, `${componentName}.md`);
        const interactivePath = path.join(DOCUMENTATION_DIR, componentCategory, `${componentName}.html`);
        
        components.push({
          name: componentName,
          category: componentCategory,
          description: getComponentDescription(componentName),
          features: getComponentFeatures(componentName),
          filePath,
          hasDocumentation: fs.existsSync(docPath),
          hasInteractive: fs.existsSync(interactivePath)
        });
      }
    }
  }
  
  scanDirectory(COMPONENTS_DIR);
  return components;
}

function generateStats(components: ComponentInfo[]): CategoryStats {
  const stats: CategoryStats = {
    total: components.length
  };
  
  components.forEach(component => {
    stats[component.category] = (stats[component.category] || 0) + 1;
  });
  
  return stats;
}

function generateComponentCard(component: ComponentInfo): string {
  const categoryClass = `category-${component.category}`;
  const searchTerms = [component.name, ...component.features].join(' ').toLowerCase();
  
  return `
      <div class="component-card" data-category="${component.category}" data-search="${searchTerms}">
        <div class="component-header">
          <div class="component-title">${component.name.charAt(0).toUpperCase() + component.name.slice(1)}</div>
          <div class="component-category ${categoryClass}">${CATEGORY_MAPPING[component.category]}</div>
        </div>
        <div class="component-description">
          ${component.description}
        </div>
        <div class="component-features">
          ${component.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('\n          ')}
        </div>
        <div class="component-actions">
          ${component.hasDocumentation ? `<a href="./${component.category}/${component.name}.md" class="action-btn">Documentation</a>` : ''}
          ${component.hasInteractive ? `<a href="./${component.category}/${component.name}.html" class="action-btn primary">Interactive</a>` : ''}
        </div>
      </div>`;
}

function generateHTML(components: ComponentInfo[], stats: CategoryStats): string {
  const componentCards = components.map(generateComponentCard).join('\n');
  
  const categoryStats = Object.entries(stats)
    .filter(([key]) => key !== 'total')
    .map(([category, count]) => `
      <div class="stat-card">
        <span class="stat-number">${count}</span>
        <div class="stat-label">${CATEGORY_MAPPING[category]} Components</div>
      </div>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Components Overview - Agenitix-2</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f8fafc;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #1e40af;
      display: block;
    }

    .stat-label {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .search-controls {
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-input {
      flex: 1;
      min-width: 300px;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
    }

    .search-input:focus {
      outline: none;
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .filter-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .filter-btn.active {
      background: #1e40af;
      color: white;
      border-color: #1e40af;
    }

    .components-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .component-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .component-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .component-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .component-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .component-category {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .category-core { background: #dbeafe; color: #1e40af; }
    .category-interactive { background: #fef3c7; color: #92400e; }
    .category-animation { background: #e0e7ff; color: #3730a3; }
    .category-layout { background: #d1fae5; color: #065f46; }
    .category-effects { background: #fce7f3; color: #be185d; }

    .component-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .component-features {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .feature-tag {
      padding: 0.25rem 0.5rem;
      background: #f3f4f6;
      color: #374151;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .component-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      font-size: 0.75rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .action-btn.primary {
      background: #1e40af;
      color: white;
      border-color: #1e40af;
    }

    .action-btn.primary:hover {
      background: #1d4ed8;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state h3 {
      margin-bottom: 1rem;
      color: #374151;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .header h1 {
        font-size: 2rem;
      }

      .search-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .search-input {
        min-width: auto;
      }

      .components-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 UI Components</h1>
      <p>Comprehensive documentation for all UI components in Agenitix-2</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span class="stat-number">${stats.total}</span>
        <div class="stat-label">Total Components</div>
      </div>${categoryStats}
    </div>

    <div class="search-controls">
      <input 
        type="text" 
        class="search-input" 
        placeholder="Search components..."
        id="searchInput"
      >
      <div class="filter-buttons">
        <button class="filter-btn active" data-category="all">All</button>
        ${Object.keys(CATEGORY_MAPPING).map(category => 
          `<button class="filter-btn" data-category="${category}">${CATEGORY_MAPPING[category]}</button>`
        ).join('\n        ')}
      </div>
    </div>

    <div class="components-grid" id="componentsGrid">
${componentCards}
    </div>

    <div class="empty-state" id="emptyState" style="display: none;">
      <h3>No components found</h3>
      <p>Try adjusting your search or filter criteria.</p>
    </div>
  </div>

  <script>
    // Search and filter functionality
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const componentCards = document.querySelectorAll('.component-card');
    const emptyState = document.getElementById('emptyState');
    const componentsGrid = document.getElementById('componentsGrid');

    function filterComponents() {
      const searchTerm = searchInput.value.toLowerCase();
      const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
      
      let visibleCount = 0;

      componentCards.forEach(card => {
        const category = card.dataset.category;
        const searchText = card.dataset.search.toLowerCase();
        const matchesSearch = searchText.includes(searchTerm);
        const matchesCategory = activeCategory === 'all' || category === activeCategory;
        
        if (matchesSearch && matchesCategory) {
          card.style.display = 'block';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Show/hide empty state
      if (visibleCount === 0) {
        emptyState.style.display = 'block';
        componentsGrid.style.display = 'none';
      } else {
        emptyState.style.display = 'none';
        componentsGrid.style.display = 'grid';
      }
    }

    // Event listeners
    searchInput.addEventListener('input', filterComponents);

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        // Filter components
        filterComponents();
      });
    });

    // Initialize
    filterComponents();
  </script>
</body>
</html>`;
}

function main() {
  console.log('🔍 Scanning UI components...');
  
  const components = scanComponents();
  const stats = generateStats(components);
  
  console.log(`📊 Found ${components.length} components:`);
  Object.entries(stats).forEach(([category, count]) => {
    if (category !== 'total') {
      console.log(`  - ${CATEGORY_MAPPING[category]}: ${count}`);
    }
  });
  
  console.log('📝 Generating overview HTML...');
  const html = generateHTML(components, stats);
  
  // Ensure documentation directory exists
  const docDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, html);
  
  console.log(`✅ Generated overview at: ${OUTPUT_FILE}`);
  console.log(`📈 Statistics: ${stats.total} total components`);
}

if (require.main === module) {
  main();
}

export { main as generateUIOverview }; 