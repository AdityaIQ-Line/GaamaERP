# IQ LDS Starter Template

A clean, production-ready starter template built with React, TypeScript, Vite, and shadcn/ui.

## What's Included

### UI Components
- Complete shadcn/ui component library (60+ components)
- All components are fully typed and accessible
- Components located in `src/components/ui/`

### Layouts & Blocks
- **Layouts**: App shell, page shell, two-column layout, three-column layout, split layout, page with properties
- **Blocks**: Global header, global sidebar, global footer, page header, page tabs, login form, password reset form, data table, metric card, back button, error boundaries
- **Patterns**: Page header with back, page header with tabs

### Essential Pages
- **Starter Page**: Clean welcome page with getting started guide
- **Login Page**: Authentication template
- **Signup Page**: Registration template  
- **Password Reset Page**: Password recovery template
- **404 Page**: Not found page template

### Features
- Theme support with light/dark/system modes
- OKLCH color system for better color consistency
- Theme switcher in header
- Responsive design with mobile support
- TypeScript throughout
- React Router for navigation
- Tailwind CSS for styling
- Error boundaries for graceful error handling

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Customize the Starter Page

Edit `src/pages/StarterPage.tsx` to create your home page.

### 4. Add Your Routes

Update `src/app/router.tsx` to add your application routes:

```tsx
import { YourPage } from "@/pages/YourPage"

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <StarterPage /> },
      { path: "/your-page", element: <YourPage /> }, // Add your routes
    ],
  },
  // ...
])
```

### 5. Configure Navigation

Update `src/lib/sidebar-config.ts` to add sidebar items:

```tsx
export const SIDEBAR_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Your Page", icon: YourIcon, href: "/your-page" },
  // Add more items
] as const
```

### 6. Use Components

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/blocks/page-header"
import { TwoColumnLayout } from "@/components/layouts/two-column-layout"
```

### 7. Customize Theme

Modify colors in `src/index.css` or switch themes using the theme toggle in the header.

## Project Structure

```
src/
├── app/                    # App configuration and routing
│   ├── App.tsx            # Root component with providers
│   └── router.tsx         # React Router configuration
├── assets/                 # Static assets (logos, images)
├── components/
│   ├── ui/                # shadcn/ui primitives (60+ components)
│   ├── blocks/            # Reusable block components
│   │   ├── back-button.tsx
│   │   ├── data-table.tsx
│   │   ├── error-boundary.tsx
│   │   ├── global-footer.tsx
│   │   ├── global-header.tsx
│   │   ├── global-sidebar.tsx
│   │   ├── login-form.tsx
│   │   ├── metric-card.tsx
│   │   ├── page-header.tsx
│   │   ├── page-tabs.tsx
│   │   ├── password-reset-form.tsx
│   │   └── route-error-boundary.tsx
│   ├── layouts/           # Layout components
│   │   ├── app-shell.tsx
│   │   ├── page-shell.tsx
│   │   ├── page-with-properties.tsx
│   │   ├── split-layout.tsx
│   │   ├── three-column-layout.tsx
│   │   └── two-column-layout.tsx
│   └── patterns/          # Pattern components
│       ├── page-header-with-back.tsx
│       └── page-header-with-tabs.tsx
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and helpers
│   ├── constants.ts       # Design system constants
│   ├── navigation.ts      # Navigation utilities
│   ├── sidebar-config.ts  # Sidebar navigation config
│   └── utils.ts           # Utility functions (cn, etc.)
├── pages/                  # Page components
│   ├── StarterPage.tsx    # Your starting page
│   └── templates/         # Page templates
│       ├── LoginPage.tsx
│       ├── SignupPage.tsx
│       ├── PasswordResetPage.tsx
│       └── NotFoundPage.tsx
├── styles/                 # Theme CSS files
└── index.css              # Global styles and CSS variables
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Documentation

| Document | Description |
|----------|-------------|
| `docs/components.md` | Component usage guide |
| `docs/design-system.md` | Design tokens and styling |
| `docs/creating-pages.md` | How to create new pages |
| `docs/page-layouts.md` | Layout patterns and examples |

## Creating a New Page

1. Create a new file in `src/pages/`:

```tsx
// src/pages/MyPage.tsx
import { PageShell } from "@/components/layouts/page-shell"
import { PageHeader } from "@/components/blocks/page-header"

export function MyPage() {
  return (
    <PageShell>
      <PageHeader title="My Page" />
      <div className="flex-1 overflow-auto p-6">
        {/* Your content here */}
      </div>
    </PageShell>
  )
}
```

2. Add the route in `src/app/router.tsx`
3. Add a sidebar item in `src/lib/sidebar-config.ts`

## Using Layouts

### Two-Column Layout (Master-Detail)

```tsx
import { TwoColumnLayout } from "@/components/layouts/two-column-layout"

<TwoColumnLayout
  left={<ItemList />}
  right={<ItemDetails />}
  defaultLeftWidth={40}
  defaultRightWidth={60}
/>
```

### Three-Column Layout (IDE-style)

```tsx
import { ThreeColumnLayout } from "@/components/layouts/three-column-layout"

<ThreeColumnLayout
  left={<Navigation />}
  content={<Editor />}
  right={<Properties />}
/>
```

### Page with Header and Tabs

```tsx
import { PageHeaderWithTabs } from "@/components/patterns/page-header-with-tabs"

<PageHeaderWithTabs
  title="Settings"
  tabs={[
    { value: "general", label: "General" },
    { value: "security", label: "Security" },
  ]}
  value={activeTab}
  onValueChange={setActiveTab}
/>
```

## Next Steps

1. Delete or rename this README to create your own
2. Update `package.json` with your project name and details
3. Customize the theme colors in `src/index.css`
4. Replace the logo in `src/assets/`
5. Add your own pages and components
6. Configure your deployment settings

## License

MIT

