# Theme System Documentation

## Overview

The Web Audit application now uses a centralized theme management system with CSS variables that allows for easy customization of colors, spacing, typography, and other design tokens across the entire site.

## Features

- **Centralized Theme Configuration**: All design tokens are defined in one place
- **CSS Variables**: Easy to modify and maintain
- **Dynamic Color Schemes**: Switch between different color palettes on the fly
- **Dark/Light Mode Support**: Automatic theme switching with CSS variable overrides
- **Consistent Design**: Pre-built component classes that use the theme variables

## File Structure

```
lib/
  theme.ts          # Theme configuration and utilities
app/
  globals.css       # CSS variables and component styles
components/
  theme-switcher.tsx # Theme and color scheme switcher
```

## How to Use

### 1. Changing Colors

To change the primary color scheme, simply modify the CSS variables in `app/globals.css`:

```css
:root {
  --color-primary-500: hsl(215, 100%, 50%); /* Change this value */
  --color-primary-600: hsl(215, 100%, 45%); /* And this one */
}
```

### 2. Using Pre-built Classes

The system provides several utility classes:

```tsx
// Primary button with gradient
<Button className="btn-primary">Click me</Button>

// Secondary button with border
<Button className="btn-secondary">Click me</Button>

// Card component
<div className="card">Content</div>

// Input field
<Input className="input-field" />

// Text with gradient
<span className="text-gradient">Gradient Text</span>

// Background gradients
<div className="bg-gradient-primary">Primary gradient background</div>
<div className="bg-gradient-secondary">Secondary gradient background</div>
```

### 3. Using CSS Variables Directly

You can use CSS variables directly in your components:

```tsx
<div className="bg-[var(--color-primary-500)] text-[var(--color-text-inverse)]">
  Custom styled content
</div>
```

### 4. Dynamic Color Schemes

The theme switcher allows users to choose from different color schemes:

- **Blue** (default): Professional, trustworthy
- **Green**: Growth, success, nature
- **Purple**: Creative, innovative
- **Orange**: Energy, enthusiasm
- **Red**: Passion, urgency

## Theme Configuration

### Colors

The theme system includes:

- **Primary Colors**: Main brand colors (50-950 shades)
- **Secondary Colors**: Accent colors (50-950 shades)
- **Semantic Colors**: Success, warning, error (50-950 shades)
- **Neutral Colors**: Grays and whites (50-950 shades)
- **Background Colors**: Light and dark mode backgrounds
- **Text Colors**: Primary, secondary, muted text
- **Border Colors**: Light and dark mode borders

### Spacing

Consistent spacing scale from `xs` (4px) to `5xl` (128px):

```css
--spacing-xs: 0.25rem;    /* 4px */
--spacing-sm: 0.5rem;     /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
--spacing-3xl: 4rem;      /* 64px */
--spacing-4xl: 6rem;      /* 96px */
--spacing-5xl: 8rem;      /* 128px */
```

### Border Radius

Consistent border radius scale:

```css
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px */
--radius-md: 0.25rem;     /* 4px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-3xl: 1.5rem;     /* 24px */
--radius-full: 9999px;
```

### Shadows

Predefined shadow values:

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### Transitions

Consistent transition timing:

```css
--transition-fast: 150ms ease-in-out;
--transition-normal: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
```

### Typography

Font sizes, weights, and line heights:

```css
--font-size-xs: 0.75rem;      /* 12px */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-lg: 1.125rem;     /* 18px */
--font-size-xl: 1.25rem;      /* 20px */
--font-size-2xl: 1.5rem;      /* 24px */
--font-size-3xl: 1.875rem;    /* 30px */
--font-size-4xl: 2.25rem;     /* 36px */
--font-size-5xl: 3rem;        /* 48px */
--font-size-6xl: 3.75rem;     /* 60px */
--font-size-7xl: 4.5rem;      /* 72px */

--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;

--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

## Customization Examples

### 1. Change Primary Color

```css
:root {
  --color-primary-500: hsl(280, 100%, 50%); /* Purple */
  --color-primary-600: hsl(280, 100%, 45%);
}
```

### 2. Add New Color Scheme

```typescript
// In theme-switcher.tsx
case 'teal':
  root.style.setProperty('--color-primary-500', 'hsl(180, 100%, 50%)');
  root.style.setProperty('--color-primary-600', 'hsl(180, 100%, 45%)');
  root.style.setProperty('--color-secondary-500', 'hsl(200, 100%, 50%)');
  root.style.setProperty('--color-secondary-600', 'hsl(200, 100%, 45%)');
  break;
```

### 3. Create Custom Component Class

```css
@layer components {
  .btn-custom {
    @apply bg-[var(--color-success-500)] 
           text-[var(--color-text-inverse)] 
           shadow-[var(--shadow-lg)] 
           transition-all duration-[var(--transition-normal)];
  }
}
```

## Best Practices

1. **Always use CSS variables** instead of hardcoded values
2. **Use the pre-built component classes** when possible
3. **Test in both light and dark modes** when making changes
4. **Keep color schemes accessible** with proper contrast ratios
5. **Use semantic color names** (success, warning, error) for their intended purposes

## Migration Guide

To migrate existing components to use the theme system:

1. Replace hardcoded colors with CSS variables
2. Use pre-built component classes where applicable
3. Update custom components to use theme tokens
4. Test in both light and dark modes

## Browser Support

The theme system uses CSS custom properties (CSS variables) which are supported in:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

For older browsers, consider using a CSS-in-JS solution or fallback values.
