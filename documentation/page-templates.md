# Page Templates

This document describes the available page templates and how to use them.

## Overview

Page templates are pre-built, standardized page components located in `src/pages/templates/`. They serve as references and starting points for creating new pages, ensuring consistency across the application.

## Available Templates

### 1. LoginPage

A complete login page with email and password fields.

**Location**: `src/pages/templates/LoginPage.tsx`

**Features**:
- Email and password input fields
- Form validation
- Loading states
- Optional "Forgot password" link
- Optional "Sign up" link
- Icon-enhanced inputs

**Usage**:
```tsx
import { LoginPage } from "@/pages/templates"

<LoginPage
  onLogin={(email, password) => handleLogin(email, password)}
  showSignupLink={true}
  signupLink="/signup"
  showForgotPassword={true}
  forgotPasswordLink="/forgot-password"
/>
```

**Props**:
- `onLogin?: (email: string, password: string) => void` - Login handler
- `showSignupLink?: boolean` - Show signup link (default: true)
- `signupLink?: string` - Signup page URL (default: "/signup")
- `showForgotPassword?: boolean` - Show forgot password link (default: true)
- `forgotPasswordLink?: string` - Forgot password page URL (default: "/forgot-password")

### 2. SignupPage

A registration page with name, email, password, and terms acceptance.

**Location**: `src/pages/templates/SignupPage.tsx`

**Features**:
- Full name, email, password, and confirm password fields
- Terms and conditions checkbox
- Password confirmation validation
- Loading states
- Optional "Sign in" link

**Usage**:
```tsx
import { SignupPage } from "@/pages/templates"

<SignupPage
  onSignup={(data) => handleSignup(data)}
  showLoginLink={true}
  loginLink="/login"
/>
```

**Props**:
- `onSignup?: (data: { name, email, password, confirmPassword }) => void` - Signup handler
- `showLoginLink?: boolean` - Show login link (default: true)
- `loginLink?: string` - Login page URL (default: "/login")

### 3. PasswordResetPage

A password recovery page with email input and confirmation state.

**Location**: `src/pages/templates/PasswordResetPage.tsx`

**Features**:
- Email input for password reset
- Success state with confirmation message
- Resend email option
- Optional "Back to login" link

**Usage**:
```tsx
import { PasswordResetPage } from "@/pages/templates"

<PasswordResetPage
  onReset={(email) => handlePasswordReset(email)}
  showLoginLink={true}
  loginLink="/login"
/>
```

**Props**:
- `onReset?: (email: string) => void` - Password reset handler
- `showLoginLink?: boolean` - Show login link (default: true)
- `loginLink?: string` - Login page URL (default: "/login")

### 4. DefaultPageWithSidebar

A standard dashboard layout with sidebar navigation, global header, and page header.

**Location**: `src/pages/templates/DefaultPageWithSidebar.tsx`

**Features**:
- Collapsible left sidebar
- Global header with notifications and user actions
- Page header section with title and description
- Responsive design (mobile-friendly)
- Customizable sidebar items

**Usage**:
```tsx
import { DefaultPageWithSidebar } from "@/pages/templates"
import { HomeIcon, SettingsIcon } from "@hugeicons/core-free-icons"

<DefaultPageWithSidebar
  pageTitle="Dashboard"
  pageDescription="Overview of your account"
  sidebarItems={[
    { label: "Home", icon: HomeIcon, href: "/" },
    { label: "Settings", icon: SettingsIcon, href: "/settings" },
  ]}
  headerActions={<Button>Custom Action</Button>}
>
  <div>Your page content here</div>
</DefaultPageWithSidebar>
```

**Props**:
- `pageTitle?: string` - Page title (default: "Page Title")
- `pageDescription?: string` - Page description
- `children: React.ReactNode` - Page content
- `sidebarItems?: Array<{ label, icon, href?, onClick? }>` - Sidebar navigation items
- `headerActions?: React.ReactNode` - Custom header actions

### 5. PageWithTable

A data table page with search functionality and action buttons.

**Location**: `src/pages/templates/PageWithTable.tsx`

**Features**:
- Responsive data table
- Search functionality
- Add new item button
- Empty state handling
- Loading state
- Custom column rendering
- Type-safe with TypeScript generics

**Usage**:
```tsx
import { PageWithTable } from "@/pages/templates"

interface User {
  id: number
  name: string
  email: string
  role: string
}

const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
]

<PageWithTable
  title="Users"
  description="Manage your users"
  data={users}
  columns={columns}
  onAdd={() => handleAdd()}
  onSearch={(query) => handleSearch(query)}
/>
```

**Props**:
- `title?: string` - Page title (default: "Data Table")
- `description?: string` - Page description
- `data: T[]` - Table data array
- `columns: TableColumn<T>[]` - Column definitions
- `onAdd?: () => void` - Add new item handler
- `onSearch?: (query: string) => void` - Search handler
- `searchPlaceholder?: string` - Search input placeholder (default: "Search...")
- `emptyMessage?: string` - Empty state message (default: "No data available")
- `isLoading?: boolean` - Loading state (default: false)

## Best Practices

1. **Use Templates as Starting Points**: Copy and customize templates rather than creating from scratch
2. **Maintain Consistency**: Follow template patterns when creating new pages
3. **Customize Props**: Use template props for customization rather than modifying template code
4. **Type Safety**: Use TypeScript types provided by templates
5. **Accessibility**: Templates include accessibility features - maintain them when customizing

## Customization

All templates are designed to be customizable:

- **Props**: Use template props for common customizations
- **Styling**: Override styles using Tailwind classes
- **Components**: Replace template components with your own
- **Logic**: Add your own business logic while maintaining template structure

## Template Guidelines

When creating new templates:

1. Follow existing template structure
2. Include TypeScript types
3. Add JSDoc comments
4. Include accessibility features
5. Support responsive design
6. Handle loading and error states
7. Use design system tokens
8. Export from `index.ts`

## Examples

See `src/pages/templates/` for complete template implementations and examples.




