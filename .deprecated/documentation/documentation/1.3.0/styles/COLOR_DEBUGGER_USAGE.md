# 🎨 Color Debugger Usage Guide

⚠️ **DEVELOPMENT ONLY**: The Color Debugger is only available when `NODE_ENV=development` for security and performance reasons.

The Color Debugger is a powerful tool to help you understand what colors your CSS variables actually represent in both light and dark themes. Here's how to use it effectively.

## 🚀 Quick Access Methods

### 1. **Theme Switcher Integration** (Easiest)
- Click on the theme switcher icon (sun/moon) in your app
- Select "Color Debugger" from the dropdown menu *(only visible in development)*
- The visual debugger will open immediately

### 2. **Keyboard Shortcut** (Fastest)
- Press `Ctrl + Shift + C` (Windows/Linux) or `Cmd + Shift + C` (Mac) *(only works in development)*
- Press `Escape` to close the debugger

### 3. **Browser Console** (For Developers)
Open your browser's developer console and type *(only works in development)*:
```javascript
// Show the visual debugger
showColorDebugger()

// Debug specific component colors
debugColors("actionToolbar")

// See all available commands
debugColors()
```

### 4. **Programmatic Access** (In Code)
```tsx
import { useColorDebugger } from '@/features/business-logic-modern/infrastructure/theming/components/ColorDebugger';

function MyComponent() {
  const colorDebugger = useColorDebugger();
  
  return (
    // Only shows button in development
    <button onClick={colorDebugger.show}>
      Show Color Debugger
    </button>
  );
}
```

## 🔒 **Development Mode Security**

The Color Debugger includes several safety measures:

- **Environment Check**: Only renders when `NODE_ENV=development`
- **Production Safety**: In production, all debug functions show helpful messages instead of errors
- **Bundle Optimization**: The debugger code is excluded from production builds
- **Console Warnings**: Attempts to use debug functions in production show clear warnings

## 🎯 **What You Can Do (Development Only)**

### **Color Reference Tab**
- **View actual colors**: See what `bg-card`, `text-foreground`, etc. actually look like
- **Switch themes**: Toggle between light and dark to see color differences
- **Get color info**: Each swatch shows:
  - CSS variable name (e.g., `bg-card`)
  - Hex color code (e.g., `#ffffff`)
  - Color name (e.g., "Pure White")
  - Usage description (e.g., "Card/panel backgrounds")

### **Component Themes Tab**
- **See component colors**: View all colors used in each component theme
- **Debug in console**: Click "Debug in Console" to get detailed color info
- **Compare themes**: See how different components use colors

## 🔍 Understanding Color Information

### **Light Theme Colors**
```
🌞 bg-background: #ffffff (Pure White) - Main app background
🌞 bg-card: #ffffff (Pure White) - Card/panel backgrounds  
🌞 bg-muted: #f1f5f9 (Very Light Gray) - Subtle backgrounds
🌞 text-foreground: #0f172a (Very Dark Blue) - Primary text
🌞 border-border: #e2e8f0 (Light Gray) - Default borders
```

### **Dark Theme Colors**
```
🌙 bg-background: #0f172a (Very Dark Blue) - Main app background
🌙 bg-card: #1e293b (Dark Gray-Blue) - Card/panel backgrounds
🌙 bg-muted: #1e293b (Dark Gray-Blue) - Subtle backgrounds
🌙 text-foreground: #f8fafc (Almost White) - Primary text
🌙 border-border: #334155 (Dark Gray) - Default borders
```

## 🛠️ Debugging Workflow (Development Only)

### **1. Understanding a CSS Variable**
1. Open Color Debugger (`Ctrl + Shift + C`)
2. Go to "Color Reference" tab
3. Find your CSS variable (e.g., `bg-muted`)
4. See the actual color, name, and usage

### **2. Debugging Component Colors**
1. Open Color Debugger
2. Go to "Component Themes" tab
3. Find your component (e.g., "Action Toolbar")
4. Click "Debug in Console" for detailed info
5. Check browser console for complete color breakdown

### **3. Comparing Light vs Dark**
1. Open Color Debugger
2. Switch between "🌞 Light" and "🌙 Dark" themes
3. Watch how colors change
4. Understand the color relationships

## 💡 Pro Tips (Development Mode)

### **Quick Console Commands**
```javascript
// Quick color lookup (development only)
debugColors("sidePanel")

// Show all available components (development only)
debugColors()

// Open visual debugger (development only)
showColorDebugger()
```

### **Understanding Color Patterns**
- **Background colors**: `bg-background` (main) → `bg-card` (panels) → `bg-muted` (subtle)
- **Text colors**: `text-foreground` (primary) → `text-muted-foreground` (secondary)
- **Border colors**: `border-border` (default) → `border-accent` (highlights)

### **Theme-Aware Development**
1. Use the debugger to understand color relationships
2. Check both light and dark themes
3. Ensure proper contrast ratios
4. Test hover and active states

## 🎨 Color Categories Explained

### **Backgrounds**
- `bg-background`: Main app background
- `bg-card`: Card and panel backgrounds
- `bg-muted`: Subtle, secondary backgrounds
- `bg-accent`: Accent and highlight backgrounds
- `bg-primary`: Primary action backgrounds
- `bg-secondary`: Secondary action backgrounds

### **Text Colors**
- `text-foreground`: Primary text color
- `text-card-foreground`: Text on card backgrounds
- `text-muted-foreground`: Secondary/muted text
- `text-primary-foreground`: Text on primary backgrounds
- `text-secondary-foreground`: Text on secondary backgrounds

### **Borders**
- `border-border`: Default border color
- `border-accent`: Accent border color
- `border-primary`: Primary border color

## 🚨 Common Issues & Solutions

### **"I can't see the Color Debugger option"**
- Make sure you're in development mode (`NODE_ENV=development`)
- Check that you're looking in the theme switcher dropdown
- Restart your development server if needed

### **"The keyboard shortcut doesn't work"**
- Ensure you're in development mode
- Try `Ctrl + Shift + C` (Windows/Linux) or `Cmd + Shift + C` (Mac)
- Check browser console for any error messages

### **"Console commands don't work"**
- Verify you're in development mode
- Try typing `debugColors()` to see available commands
- In production, you'll see a helpful message instead

### **"I want to debug in production"**
- The Color Debugger is intentionally disabled in production for security
- Use the inline color comments in the theme store for reference
- Check the CSS variable documentation in the code

## 📚 Integration Examples

### **Adding to Your Component (Development Only)**
```tsx
import { ColorDebugger, useColorDebugger } from './ColorDebugger';

function MyApp() {
  const colorDebugger = useColorDebugger();
  
  return (
    <div>
      {/* Your app content */}
      
      {/* Debug button automatically hidden in production */}
      <button 
        onClick={colorDebugger.show}
        className="fixed bottom-4 right-4 bg-primary text-primary-foreground p-2 rounded"
      >
        🎨 Debug Colors
      </button>
      
      {/* Color Debugger Modal - automatically hidden in production */}
      <ColorDebugger 
        isVisible={colorDebugger.isVisible}
        onVisibilityChange={colorDebugger.setIsVisible}
      />
    </div>
  );
}
```

### **Environment-Aware Usage**
```tsx
// Safe to use - automatically handles production mode
const colorDebugger = useColorDebugger();

// In development: opens debugger
// In production: shows warning message
colorDebugger.show();
```

### **Console Debugging Script (Development Only)**
```javascript
// Add this to your browser bookmarks for quick access
javascript:(function(){
  if(process.env.NODE_ENV === 'development' && window.showColorDebugger) {
    window.showColorDebugger();
  } else {
    console.log('Color debugger only available in development mode');
  }
})();
```

## 🔧 Development Setup

To ensure the Color Debugger works properly:

1. **Development Environment**: Make sure `NODE_ENV=development`
2. **Build Process**: The debugger is automatically excluded from production builds
3. **Console Access**: Debug functions are available in browser console during development
4. **Keyboard Shortcuts**: Work only in development mode

---

**Happy debugging! 🎨** The Color Debugger makes development easier while staying secure in production. 