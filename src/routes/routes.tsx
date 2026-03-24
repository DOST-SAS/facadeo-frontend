import { createBrowserRouter } from "react-router-dom";
import { ArtisanLayout } from "@/components/layout/ArtisanLayout";
import { ArtisanAbonnement } from "@/features/Artisan/abonnement/ArtisanAbonnement";
import { ArtisanDashboard } from "@/features/Artisan/dashboard/ArtisanDashboard";
import { CreateDevis } from "@/features/Artisan/devis/CreateDevi";
import { DetailsFacade } from "@/features/Artisan/facades/DetailsFacade";
import { ArtisanScans } from "@/features/Artisan/scans/ArtisanScans";
import CreateScan from "@/features/Artisan/scans/CreateScan";
import { ResultScan } from "@/features/Artisan/scans/ResultScan";
import ArtisanSettings from "@/features/Artisan/settings/ArtisanSettings";
import SubscriptionSuccess from "@/features/Artisan/abonnement/SubscriptionSuccess";
import Login from "@/features/auth/login";
import Register from "@/features/auth/register";
import EmailVerification from "@/pages/EmailVerification";
import NotFound from "@/pages/NotFound";
import { AdminLayout } from "@/components/layout/AdminLayout";
import AdminDashboard from "@/features/Admin/dashboard/AdminDashboard";
import AdminScans from "@/features/Admin/scans/AdminScans";
import AdminDevis from "@/features/Admin/devis/AdminDevis";
import AdminAbonnements from "@/features/Admin/abonnement/AdminAbonnements";
import AdminParametres from "@/features/Admin/settings/AdminParametres";
import AdminUsers from "@/features/Admin/users/AdminUsers";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthCallback from "@/features/auth/callback";
import AdminFacades from "@/features/Admin/facades/AdminFacades";
import AdminDetailFacade from "@/features/Admin/facades/AdminDetailFacade";
import { AdminDetailScan } from "@/features/Admin/scans/AdminDetailScan";
import AdminDetailDevis from "@/features/Admin/devis/AdminDetailDevis";
import ArtisanDetailDevis from "@/features/Artisan/devis/ArtisanDetailDevis";
import AdminMetiers from "@/features/Admin/metiers/AdminMetiers";
import Terms from "@/components/Terms";
import Privacy from "@/components/Privacy";
import LegalNotice from "@/components/LegalNotice";
import DownloadPdfButton from "@/components/downladPdfButoon";
import Home from "@/pages/Home";
import ArtisanLeads from "@/features/Artisan/leads/ArtisanLeads";
import { EditDevis } from "@/features/Artisan/devis/EditDevis";
import PublicDevis from "@/pages/PublicDevis";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import CreditLedger from "@/features/Admin/creditsLedger/CreditLedger";


export const router = createBrowserRouter([
  // Protected Artisan routes
  {
    element: (
      <ProtectedRoute requiredRole="artisan">
        <ArtisanLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/artisan", element: <ArtisanDashboard /> },
      { path: "/scans", element: <ArtisanScans /> },
      { path: "/scans/create", element: <CreateScan /> },
      { path: "/scans/:slug", element: <ResultScan /> },
      { path: "/scans/:slug/facades/:id", element: <DetailsFacade /> },
      { path: "/devis", element: <ArtisanLeads /> },
      { path: "/devis/create/:slug/:id", element: <CreateDevis /> },
      { path: "/devis/edit/:id", element: <EditDevis /> },
      { path: "/devis/:id", element: <ArtisanDetailDevis /> },
      { path: "/abonnement", element: <ArtisanAbonnement /> },
      { path: "/parametres", element: <ArtisanSettings /> },
    ],
  },

  // Protected Admin routes
  {
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/admin/users", element: <AdminUsers /> },
      { path: "/admin/scans", element: <AdminScans /> },
      { path: "/admin/facades", element: <AdminFacades /> },
      { path: "/admin/facades/:id", element: <AdminDetailFacade /> },
      { path: "/admin/scans/:slug", element: <AdminDetailScan /> },
      { path: "/admin/devis", element: <AdminDevis /> },
      { path: "/admin/devis/:id", element: <AdminDetailDevis /> },
      { path: "/admin/abonnement", element: <AdminAbonnements /> },
      { path: "/admin/metiers", element: <AdminMetiers /> },
      // { path: "/admin/credits", element: <CreditLedger/> },
      { path: "/admin/parametres", element: <AdminParametres /> },
    ],
  },

  // Auth routes (public)
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/verify-otp", element: <EmailVerification /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/legal-notice", element: <LegalNotice /> },
  { path: "/privacy", element: <Privacy /> },
  { path: "/terms", element: <Terms /> },
  { path: "/billing/success", element: <SubscriptionSuccess /> },
  { path: "/pdf", element: <DownloadPdfButton /> },
  { path: "/e", element: <Home /> },
  { path: "/public/devis/:id", element: <PublicDevis /> },


  // Catch-all
  { path: "*", element: <NotFound /> },
]);