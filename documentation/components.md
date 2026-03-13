# Components Documentation

This document provides guidance on using UI components in the application.

## Component Library

This project uses [shadcn/ui](https://ui.shadcn.com/) components built on top of Radix UI primitives.

## Available Components

See [COMPONENTS.md](./COMPONENTS.md) for a complete list of available components and their installation status.

## Using Components

### Import Pattern

Components are imported from the `@/components/ui` path:

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

### Basic Usage

```tsx
import { Button } from "@/components/ui/button"

export function MyComponent() {
  return (
    <Button variant="default" size="lg">
      Click me
    </Button>
  )
}
```

## Component Patterns

### Form Components

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function FormExample() {
  return (
    <form className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Card Components

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CardExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  )
}
```

### Dialog/Modal Components

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  )
}
```

## Styling Components

### Using Variants

Many components support variants:

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Custom Styling

Components can be styled using Tailwind classes:

```tsx
<Button className="w-full bg-custom-color hover:bg-custom-color-dark">
  Custom Button
</Button>
```

## Best Practices

1. **Composition**: Use component composition patterns for flexibility
2. **Accessibility**: Components include accessibility features by default
3. **Consistency**: Use component variants rather than custom styling when possible
4. **Performance**: Import only the components you need

## Component Customization

Components can be customized by:
- Modifying the component files in `src/components/ui/`
- Using Tailwind classes for styling
- Extending components with additional props
- Creating wrapper components for common patterns
