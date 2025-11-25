# Figma Component Templates for Bridgy

## Quick Copy-Paste Component Specs

### 🎨 Color System (Already Imported)
You already have these as variables, use them!

### 📦 Component Templates

#### Button Component
```
Primary Button
├── Auto Layout: Horizontal, Center align
├── Size: Hug contents
├── Padding: 12px vertical, 24px horizontal  
├── Corner Radius: 10px
├── Fill: Linear gradient 135° (#8b5cf6 → #a855f7)
├── Effect: Drop shadow
│   ├── Color: #8b5cf6 30%
│   ├── X: 0, Y: 4
│   ├── Blur: 15
│   └── Spread: 0
└── Text Layer
    ├── Font: Inter Semibold
    ├── Size: 14px
    ├── Line Height: 20px
    └── Color: #FFFFFF
```

#### Input Field Component
```
Input Container
├── Auto Layout: Horizontal, Left align
├── Size: Fixed width (100%), Height 40px
├── Padding: 12px all sides
├── Corner Radius: 8px
├── Fill: #000000 20%
├── Stroke: #FFFFFF 10%, 1px, Inside
└── Text Layer (Placeholder)
    ├── Font: Inter Regular
    ├── Size: 14px
    ├── Color: #e5e5e5 60%
    └── Text: "Enter value..."

States (as Variants):
- Default: Stroke #FFFFFF 10%
- Hover: Stroke #FFFFFF 20%
- Focus: Stroke #8b5cf6, Add focus ring effect
- Error: Stroke #ef4444
- Disabled: Opacity 50%
```

#### Card Component  
```
Card Container
├── Auto Layout: Vertical, 16px gap
├── Padding: 16px all sides
├── Corner Radius: 12px
├── Fill: #000000 10%
├── Stroke: #FFFFFF 5%, 1px, Inside
├── Effect: Background blur 15px
└── Content Area
    ├── Auto Layout: Vertical, 12px gap
    └── Clip content: Yes
```

#### Modal Component
```
Modal Overlay (Full screen)
├── Fill: #000000 50%
└── Modal Container
    ├── Position: Center
    ├── Width: 500px, Height: Auto
    ├── Auto Layout: Vertical
    ├── Corner Radius: 15px
    ├── Fill: #1a1a3a 98%
    ├── Stroke: #FFFFFF 10%, 1px
    ├── Effects:
    │   ├── Drop shadow: #000000 30%, Y: 8, Blur: 32
    │   └── Background blur: 20px
    ├── Modal Header
    │   ├── Height: 60px
    │   ├── Padding: 24px
    │   ├── Border bottom: #FFFFFF 5%, 1px
    │   └── Contains: Title + Close button
    ├── Modal Body
    │   ├── Padding: 24px
    │   └── Auto Layout: Vertical, 16px gap
    └── Modal Footer
        ├── Padding: 16px 24px
        ├── Border top: #FFFFFF 5%, 1px
        └── Auto Layout: Horizontal, Right, 12px gap
```

#### Tab Navigation
```
Tab Container
├── Auto Layout: Horizontal, 0px gap
├── Height: 48px
└── Tab Item
    ├── Auto Layout: Horizontal, Center
    ├── Padding: 12px 24px
    ├── Text: Inter Medium, 14px
    ├── Default State:
    │   ├── Text color: #a3a3a3
    │   └── Background: Transparent
    └── Active State (Variant):
        ├── Text color: #FFFFFF
        ├── Background: #8b5cf6 20%
        └── Border bottom: #8b5cf6, 2px
```

#### Notification Toast
```
Notification Container
├── Auto Layout: Horizontal, 12px gap
├── Padding: 16px
├── Corner Radius: 8px
├── Min width: 320px
├── Success Variant:
│   ├── Fill: #22c55e 20%
│   ├── Stroke: #22c55e 40%, 1px
│   └── Icon: ✓ (Green)
├── Error Variant:
│   ├── Fill: #ef4444 20%
│   ├── Stroke: #ef4444 40%, 1px
│   └── Icon: ✕ (Red)
└── Content
    ├── Title: Inter Semibold, 14px
    └── Message: Inter Regular, 13px
```

### 🎯 Quick Start Process

1. **Create a Component Set**
   - Select your component frame
   - Click "Create component" (Ctrl/Cmd + Alt + K)
   - Add variants for different states

2. **Use Your Imported Variables**
   - Apply color variables: `color/primary/400`
   - Apply spacing variables: `spacing/4`
   - Apply radius variables: `border-radius/button`

3. **Enable Auto Layout** (Shift + A)
   - Set padding using spacing variables
   - Set gap between items
   - Configure alignment

4. **Add Interactive States**
   - Create variants for: Default, Hover, Active, Disabled
   - Use Figma's prototyping to show interactions

### 🔥 Pro Tips

1. **Use Base Components**
   - Create a base button, then variants
   - Create a base input, then variants
   - This ensures consistency

2. **Follow 8px Grid**
   - All spacing should be multiples of 4px or 8px
   - This matches your spacing system

3. **Glass Effect Technique**
   ```
   Background: #000000 10-20%
   + Background blur effect
   + Subtle border (#FFFFFF 5-10%)
   ```

4. **Purple Gradient Variations**
   ```
   Light: 135° #c4b5fd → #8b5cf6
   Medium: 135° #8b5cf6 → #a855f7  
   Dark: 135° #7c3aed → #9333ea
   ```

### 📱 Responsive Considerations

- Use **Auto Layout** for all components
- Set constraints properly:
  - Buttons: Hug contents
  - Inputs: Fill container (horizontal)
  - Cards: Fill container
  - Modals: Fixed width, auto height

### 🚀 Next Steps

1. Start with core components:
   - Button (3 variants)
   - Input (5 states)
   - Card
   - Modal

2. Build composite components:
   - Form (labels + inputs)
   - Navigation (header + tabs)
   - Notification system

3. Create templates:
   - Settings panel
   - Variable list
   - Component grid