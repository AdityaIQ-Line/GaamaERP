import { createBrowserRouter } from "react-router-dom"
import {
  DashboardPage,
  CustomersPage,
  CategoriesPage,
  RatesPage,
  SalesOrdersPage,
  GRNPage,
  ProcessTrackingPage,
  ChallanPage,
  GatePassPage,
  InvoicesPage,
  CertificatesPage,
} from "@/pages/gaama"
import {
  LoginPage,
  SignupPage,
  PasswordResetPage,
  NotFoundPage,
  LandingPage,
} from "@/pages/templates"
import { RouteErrorBoundary } from "@/components/blocks/route-error-boundary"
import { AppDataLayout } from "@/components/layouts/app-data-layout"

/** Shared app routes – used for both main app (/) and sandbox (/sandbox) */
const appRoutes = [
  { index: true, element: <DashboardPage /> },
  { path: "customers", element: <CustomersPage /> },
  { path: "categories", element: <CategoriesPage /> },
  { path: "rates", element: <RatesPage /> },
  { path: "sales-orders", element: <SalesOrdersPage /> },
  { path: "grn", element: <GRNPage /> },
  { path: "process-tracking", element: <ProcessTrackingPage /> },
  { path: "challan", element: <ChallanPage /> },
  { path: "gate-pass", element: <GatePassPage /> },
  { path: "invoices", element: <InvoicesPage /> },
  { path: "certificates", element: <CertificatesPage /> },
]

/** Gaama ERP routes – Sidebar → Module Page → List → Create/Edit/View Modal */
export const router = createBrowserRouter([
  {
    path: "/welcome",
    element: <LandingPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: <AppDataLayout />,
    errorElement: <RouteErrorBoundary />,
    children: appRoutes,
  },
  {
    path: "/sandbox",
    element: <AppDataLayout sandboxMode />,
    errorElement: <RouteErrorBoundary />,
    children: appRoutes,
  },
  { path: "/login", element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  { path: "/signup", element: <SignupPage />, errorElement: <RouteErrorBoundary /> },
  { path: "/password-reset", element: <PasswordResetPage />, errorElement: <RouteErrorBoundary /> },
  {
    path: "*",
    element: <NotFoundPage homeButton={{ href: "/", label: "Go Home" }} />,
    errorElement: <RouteErrorBoundary />,
  },
])
