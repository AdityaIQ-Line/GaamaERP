# Design System

This document outlines the design system, including design tokens, colors, typography, spacing, and other design guidelines.

## Colors

The application uses a color system based on CSS variables defined in the theme.

### Color Palette

- **Primary**: Main brand color
- **Secondary**: Secondary brand color
- **Accent**: Accent color for highlights
- **Muted**: Muted colors for subtle elements
- **Destructive**: Error and destructive actions
- **Background**: Background colors
- **Foreground**: Text and foreground colors

### Using Colors

Colors are accessed via Tailwind classes:

```tsx
<div className="bg-primary text-primary-foreground">
  Primary background
</div>

<div className="bg-destructive text-destructive-foreground">
  Destructive action
</div>

<div className="bg-muted text-muted-foreground">
  Muted content
</div>
```

## Typography

### Font Families

The application uses system fonts with fallbacks:

- **Sans**: System UI fonts
- **Mono**: Monospace fonts for code

### Font Sizes

Standard font size scale:

- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Font Weights

- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

### Typography Examples

```tsx
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-medium">Heading 3</h3>
<p className="text-base">Body text</p>
<p className="text-sm text-muted-foreground">Small muted text</p>
```

## Spacing

The application uses a consistent spacing scale based on multiples of 4px:

- `space-1`: 0.25rem (4px)
- `space-2`: 0.5rem (8px)
- `space-3`: 0.75rem (12px)
- `space-4`: 1rem (16px)
- `space-6`: 1.5rem (24px)
- `space-8`: 2rem (32px)
- `space-12`: 3rem (48px)
- `space-16`: 4rem (64px)

### Spacing Utilities

- `p-{size}`: Padding all sides
- `px-{size}`: Horizontal padding
- `py-{size}`: Vertical padding
- `m-{size}`: Margin all sides
- `mx-{size}`: Horizontal margin
- `my-{size}`: Vertical margin
- `gap-{size}`: Gap for flex/grid

## Border Radius

Standard border radius values:

- `rounded-none`: 0
- `rounded-sm`: 0.125rem (2px)
- `rounded`: 0.25rem (4px)
- `rounded-md`: 0.375rem (6px)
- `rounded-lg`: 0.5rem (8px)
- `rounded-xl`: 0.75rem (12px)
- `rounded-2xl`: 1rem (16px)
- `rounded-full`: 9999px

## Shadows

Elevation system using shadows:

- `shadow-sm`: Small shadow
- `shadow`: Default shadow
- `shadow-md`: Medium shadow
- `shadow-lg`: Large shadow
- `shadow-xl`: Extra large shadow

## Breakpoints

Responsive breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Dark Mode

The application supports dark mode. Colors automatically adapt based on the theme.

### Using Dark Mode

Dark mode classes:

```tsx
<div className="bg-white dark:bg-gray-900">
  Content that adapts to dark mode
</div>
```

## Animation

Standard animation durations:

- `duration-75`: 75ms
- `duration-100`: 100ms
- `duration-150`: 150ms
- `duration-200`: 200ms
- `duration-300`: 300ms
- `duration-500`: 500ms

Common transitions:

```tsx
<div className="transition-colors duration-200">
  Smooth color transitions
</div>
```

## Best Practices

1. **Consistency**: Use design tokens consistently across the application
2. **Accessibility**: Ensure sufficient color contrast
3. **Responsive**: Design for all screen sizes
4. **Performance**: Use CSS variables for theming
5. **Maintainability**: Document custom design decisions




