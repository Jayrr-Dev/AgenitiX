# 🏷️ NODE CATEGORY SYSTEM STANDARDS v1.1.0

**Updated:** June 2025 v1.1.0
**Summary:** Complete standards for the node category system covering classification, theming, sidebar organization, validation rules, and extension patterns for the modern workflow system.

## 📋 OVERVIEW

The Node Category System provides a comprehensive classification framework that organizes nodes by functional purpose, applies consistent theming, manages sidebar presentation, and enforces business rules throughout the workflow platform.

## 🎯 CATEGORY TAXONOMY

### **Core Categories** (Production Ready)

#### **CREATE Category**

- **Purpose**: Content generation and data input
- **Function**: Source nodes that produce new content or data
- **Theme**: Blue color scheme for clarity and trust
- **Examples**: Text creation, data input, content templates
- **Characteristics**: Minimal inputs, rich outputs, source-oriented

#### **VIEW Category**

- **Purpose**: Data visualization and output display
- **Function**: Terminal nodes that present processed results
- **Theme**: Gray color scheme for neutral presentation
- **Examples**: Data viewers, output formatters, display components
- **Characteristics**: Rich inputs, presentation-focused, terminal-oriented

#### **TRIGGER Category**

- **Purpose**: Workflow activation and control flow
- **Function**: Control nodes that initiate or manage workflow execution
- **Theme**: Purple color scheme for action and automation
- **Examples**: Manual triggers, boolean toggles, event listeners
- **Characteristics**: Control logic, conditional flow, activation-oriented

#### **TEST Category**

- **Purpose**: Debugging, testing, and development support
- **Function**: Development tools for workflow validation and debugging
- **Theme**: Yellow/Orange color scheme for attention and caution
- **Examples**: Error generators, data validators, debug viewers
- **Characteristics**: Development tools, debugging aids, validation-oriented

### **Reserved Categories** (Future Development)

#### **CYCLE Category**

- **Purpose**: Automation and recurring operations
- **Function**: Time-based and iterative processing nodes
- **Theme**: Green color scheme for continuous operation
- **Examples**: Scheduled tasks, loops, batch processing
- **Characteristics**: Time-based, iterative, automation-oriented

## 🎨 CATEGORY THEMING STANDARDS

### **Color Scheme Allocation**

#### **Light Mode Themes**

- **CREATE**: Blue palette (bg-blue-50, border-blue-300, text-blue-900)
- **VIEW**: Gray palette (bg-gray-50, border-gray-300, text-gray-900)
- **TRIGGER**: Purple palette (bg-purple-50, border-purple-300, text-purple-900)
- **TEST**: Yellow palette (bg-yellow-50, border-yellow-300, text-yellow-900)
- **CYCLE**: Green palette (bg-green-50, border-green-300, text-green-900)

#### **Dark Mode Themes**

- **CREATE**: Blue dark (bg-blue-900, border-blue-800, text-blue-100)
- **VIEW**: Gray dark (bg-gray-900, border-gray-800, text-gray-100)
- **TRIGGER**: Purple dark (bg-purple-900, border-purple-800, text-purple-100)
- **TEST**: Yellow dark (bg-yellow-900, border-yellow-800, text-yellow-100)
- **CYCLE**: Green dark (bg-green-900, border-green-800, text-green-100)

### **Theme Application Rules**

#### **Automatic Theming**

- All nodes automatically inherit category-based theming
- Theme applied to backgrounds, borders, text, and interactive elements
- Consistent hover states and focus indicators per category
- Fallback to default blue theme for invalid or missing categories

#### **Theme Hierarchy**

- Category theme overrides generic node styling
- State-specific themes (error, loading, active) take precedence
- User accessibility preferences respected across all themes
- High contrast mode automatically adjusts all category themes

## 📁 SIDEBAR ORGANIZATION STANDARDS

### **Folder Mapping System**

#### **Folder Taxonomy**

- **MAIN**: Core production nodes (CREATE category primary)
- **AUTOMATION**: Workflow control nodes (TRIGGER category primary)
- **TESTING**: Development and debug nodes (TEST category primary)
- **VISUALIZATION**: Data display nodes (VIEW category primary)

#### **Category-to-Folder Mapping**

- **CREATE nodes** → **MAIN folder** (primary) + others as needed
- **TRIGGER nodes** → **AUTOMATION folder** (primary) + others as needed
- **TEST nodes** → **TESTING folder** (exclusive)
- **VIEW nodes** → **VISUALIZATION folder** (primary) + others as needed
- **CYCLE nodes** → **AUTOMATION folder** (when implemented)

### **Sidebar Presentation Rules**

#### **Tab Organization**

- Categories group nodes by functional purpose
- Folders organize nodes by usage context
- Multiple tab variants support different workflow patterns
- Auto-generation from category registry ensures consistency

#### **Default Visibility**

- All production categories shown by default
- Reserved categories hidden until implementation
- Custom labels override category display names
- Priority-based ordering ensures logical grouping

## 🔧 CATEGORY METADATA STANDARDS

### **Required Metadata Properties**

#### **Core Identification**

- **Category ID**: Unique system identifier (lowercase)
- **Display Name**: Human-readable category name
- **Description**: Clear purpose and usage explanation
- **Icon**: Visual identifier for UI representation

#### **Visual Configuration**

- **Theme Colors**: Primary, secondary, accent color definitions
- **Background/Border**: Light and dark mode specifications
- **Priority**: Ordering value for sidebar and UI arrangement
- **Enabled Status**: Active/inactive category state

#### **Sidebar Integration**

- **Default Folder**: Primary sidebar folder assignment
- **Show by Default**: Visibility in standard UI configurations
- **Custom Label**: Override display name for specific contexts

### **Business Rules Configuration**

#### **Connection Rules**

- **Allowed Connections**: Which categories can connect to this category
- **Incompatible Categories**: Explicit connection restrictions
- **Duplication Policy**: Whether nodes can be duplicated
- **Deletion Policy**: Whether nodes can be removed from workflows

#### **Behavioral Settings**

- **Default Timeout**: Processing time limits
- **Auto-save Policy**: Automatic state persistence
- **Cache Strategy**: Data caching approach
- **Debounce Timing**: UI update throttling

## 🔗 INTEGRATION STANDARDS

### **Registry Integration**

#### **Automatic Registration**

- All nodes automatically inherit category properties
- Category metadata validates node configurations
- Invalid categories trigger fallback behaviors
- Category changes propagate to all dependent systems

#### **Type Safety**

- TypeScript types enforce category validity
- Runtime validation prevents invalid category assignments
- Branded types ensure category consistency
- Compile-time checks catch category mismatches

### **Inspector Integration**

#### **Category-Aware Controls**

- Inspector controls automatically adapt to category themes
- Category-specific UI elements and layouts
- Validation rules based on category business logic
- Error handling customized per category

#### **Theme Inheritance**

- Inspector panels inherit category color schemes
- Button styling matches category themes
- Input field theming follows category standards
- Error states use category-appropriate colors

## 🚀 EXTENSION STANDARDS

### **Adding New Categories**

#### **Requirements Checklist**

- Unique category identifier with clear naming
- Complete theme specification for light/dark modes
- Business rules definition for connections and behavior
- Sidebar folder assignment and organization
- Icon selection following visual consistency standards

#### **Integration Steps**

- Add category to TypeScript type definitions
- Define complete metadata in category registry
- Update theme system with new color schemes
- Configure sidebar folder mappings
- Add validation rules and connection policies

### **Category Lifecycle Management**

#### **Versioning Standards**

- Category changes trigger appropriate version bumps
- Backward compatibility maintained for existing workflows
- Migration paths defined for breaking changes
- Documentation updated with each category modification

#### **Deprecation Process**

- Gradual deprecation with clear timeline
- Migration tools for affected workflows
- Legacy support during transition periods
- Clear communication to users and developers

## 🛡️ VALIDATION STANDARDS

### **Category Connection Rules**

#### **Universal Allowances**

- CREATE nodes can connect to any category
- VIEW nodes can receive from any category
- TRIGGER nodes can initiate any category
- Cross-category connections validated at runtime

#### **Specific Restrictions**

- TEST nodes restricted to development contexts
- CYCLE nodes require automation folder context
- Invalid connections prevented with clear error messages
- Fallback behaviors for edge cases

### **Business Logic Enforcement**

#### **Runtime Validation**

- Category assignments validated on node creation
- Connection attempts checked against category rules
- Invalid configurations automatically corrected
- Error handling provides clear user feedback

#### **Development Safeguards**

- TypeScript compilation prevents invalid category usage
- Runtime checks validate category registry integrity
- Debug mode provides detailed category validation logs
- Performance monitoring tracks category-related operations

## 📊 CATEGORY ANALYTICS

### **Usage Metrics**

#### **Statistical Tracking**

- Node count per category across all workflows
- Most popular category combinations
- Category-specific error rates and performance
- User interaction patterns by category

#### **Performance Monitoring**

- Category-specific rendering performance
- Theme application efficiency
- Sidebar organization effectiveness
- Category validation overhead

### **Health Monitoring**

#### **System Validation**

- Regular category registry integrity checks
- Theme consistency verification
- Sidebar mapping validation
- Connection rule enforcement testing

#### **Quality Assurance**

- Category coverage completeness
- Theme accessibility compliance
- Performance benchmarks by category
- User experience metrics per category

## 🔮 FUTURE CATEGORY PLANNING

### **Planned Expansions**

#### **Advanced Categories** (Roadmap)

- **DATA**: Database and storage operations
- **AI**: Machine learning and AI processing
- **API**: External service integrations
- **MEDIA**: File and media processing

#### **Specialized Categories** (Consideration)

- **SECURITY**: Authentication and authorization
- **ANALYTICS**: Data analysis and reporting
- **NOTIFICATION**: Communication and alerts
- **WORKFLOW**: Meta-workflow management

### **Category Evolution**

#### **Enhancement Patterns**

- Category-specific node templates
- Advanced theme customization options
- Dynamic category creation capabilities
- User-defined category extensions

#### **Integration Opportunities**

- External plugin category support
- Category-based permissions systems
- Workflow templates by category
- Category-specific optimization strategies

---

**This category system provides a robust, extensible framework for organizing and managing nodes while maintaining consistency, usability, and technical integrity across the entire workflow platform. All future development must adhere to these standards to ensure system coherence and user experience quality.**
