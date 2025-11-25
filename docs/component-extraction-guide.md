# Bridgy Component Extraction Guide for Figma

## Overview
This guide helps you extract UI components from the Bridgy plugin into Figma design components.

## Component Inventory

### 1. **Buttons**
- Primary Button (purple gradient)
- Secondary Button (outlined)
- Icon Button (settings, refresh, help)
- Link Button (repository link)
- Large Action Button (commit, export)

### 2. **Cards**
- Variable Card
- Component Card
- Settings Card
- Feedback Card

### 3. **Form Elements**
- Text Input
- Password Input
- Textarea
- Select Dropdown
- Checkbox with Label
- Form Group Container

### 4. **Modals**
- Standard Modal
- Settings Modal
- Error Modal
- Success Modal

### 5. **Navigation**
- Tab Navigation (Variables/Components)
- Sub-tabs
- Header Navigation

### 6. **Feedback & Status**
- Success Notification
- Error Notification
- Loading States
- Progress Bar
- Beta Badge

### 7. **Layout Components**
- Container
- Header
- Section
- List Container

## Step-by-Step Extraction Process

### Step 1: Create Component Library Structure in Figma
1. Create a new Figma file called "Bridgy Design System"
2. Create pages:
   - ✦ Foundations (Colors, Typography, Spacing)
   - ✦ Components
   - ✦ Patterns
   - ✦ Templates

### Step 2: Import Design Tokens (Already Done ✓)
You've already imported the CSS variables, which gives you:
- Color system (primary, neutral, semantic colors)
- Spacing system
- Typography scale
- Border radius values
- Shadow styles

### Step 3: Create Base Components

#### Button Component
1. Create a frame: 40px height
2. Apply styles:
   - Background: `var(--gradient-button)` → Use gradient paint style
   - Padding: `var(--space-4) var(--space-6)` → 16px 24px
   - Border Radius: `var(--radius-button)` → 10px
   - Text: 14px, semibold, white
   - Shadow: `var(--shadow-purple-medium)`

3. Create variants:
   - Primary (gradient background)
   - Secondary (outlined)
   - Disabled (opacity 50%)
   - Hover state (darker gradient)

#### Input Component
1. Create a frame: 40px height
2. Apply styles:
   - Background: `var(--glass-dark-medium)`
   - Border: 1px solid `var(--glass-white-medium)`
   - Padding: `var(--space-3) var(--space-4)` → 12px 16px
   - Border Radius: `var(--radius-md)` → 8px
   - Text: 14px, regular, `var(--neutral-200)`

3. Create states:
   - Default
   - Focused (purple border)
   - Error (red border)
   - Disabled

#### Card Component
1. Create auto-layout frame
2. Apply styles:
   - Background: `var(--glass-dark-light)`
   - Border: 1px solid `var(--glass-white-light)`
   - Padding: `var(--space-4)` → 16px
   - Border Radius: `var(--radius-card)` → 12px
   - Backdrop blur effect (if supported)

### Step 4: Extract Complex Components

#### Modal Component Structure
```
Modal Container
├── Backdrop (dark overlay)
└── Modal Content
    ├── Modal Header
    │   ├── Title
    │   └── Close Button
    ├── Modal Body
    └── Modal Footer
        └── Action Buttons
```

### Step 5: Create Component Documentation

For each component, document:
1. Component name and purpose
2. Props/Variants available
3. Usage guidelines
4. Accessibility notes

## Automation Options

### Option 1: Manual Recreation (Recommended)
Best for accuracy and Figma-native features:
1. Use the imported color variables
2. Manually create each component
3. Apply auto-layout for responsive behavior
4. Use Figma's variant system

### Option 2: HTML/CSS to Figma Tools
Tools that can help:
- **Figma HTML to Design** plugin
- **Design System Manager** plugin
- **Tokens Studio** plugin

### Option 3: Screenshot & Trace Method
1. Take screenshots of each component state
2. Import into Figma
3. Trace over with native Figma elements
4. Apply your imported variables

## Component Mapping Reference

### CSS Classes to Figma Components

| CSS Class | Figma Component | Notes |
|-----------|-----------------|-------|
| `.btn-primary` | Button/Primary | Use gradient paint style |
| `.modal` | Modal/Default | Use auto-layout |
| `.form-group` | Form/Field Group | Vertical auto-layout |
| `.tab` | Navigation/Tab | Use variants for active state |
| `.notification-container` | Feedback/Notification | Use variants for success/error |
| `.header` | Layout/Header | Fixed height, horizontal auto-layout |

## Best Practices

1. **Use Auto Layout** - Makes components responsive
2. **Create Variants** - For different states and types
3. **Use Your Variables** - Link to imported color/spacing variables
4. **Name Consistently** - Follow naming convention: `Category/ComponentName/Variant`
5. **Document Usage** - Add descriptions to components

## Quick Start Components

Start with these essential components:
1. Button (Primary, Secondary)
2. Input Field
3. Card Container
4. Modal
5. Tab Navigation

These cover 80% of the UI and establish your design patterns.