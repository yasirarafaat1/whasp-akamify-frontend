import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth } from "./components/auth/RequireAuth";
import { AppShell } from "./components/layout/AppShell";

import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import DashboardPage from "./pages/Dashboard";
import MetaConnectPage from "./pages/Meta";
import TemplatesPage from "./pages/Templates";
import SendPage from "./pages/Send";
import ContactsPage from "./pages/Contacts";
import ConversationsPage from "./pages/Conversations";
import ConversationDetailPage from "./pages/ConversationDetail";
import LinksPage from "./pages/Links";
import AutomationPage from "./pages/Automation";
import SettingsPage from "./pages/Settings";
import NotFoundPage from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<RequireAuth />}>
          <Route
            path="/app"
            element={
              <AppShell>
                <DashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/app/meta"
            element={
              <AppShell>
                <MetaConnectPage />
              </AppShell>
            }
          />
          <Route
            path="/app/templates"
            element={
              <AppShell>
                <TemplatesPage />
              </AppShell>
            }
          />
          <Route
            path="/app/send"
            element={
              <AppShell>
                <SendPage />
              </AppShell>
            }
          />
          <Route
            path="/app/contacts"
            element={
              <AppShell>
                <ContactsPage />
              </AppShell>
            }
          />
          <Route
            path="/app/conversations"
            element={
              <AppShell>
                <ConversationsPage />
              </AppShell>
            }
          />
          <Route
            path="/app/conversations/:phone"
            element={
              <AppShell>
                <ConversationDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/app/links"
            element={
              <AppShell>
                <LinksPage />
              </AppShell>
            }
          />
          <Route
            path="/app/automation"
            element={
              <AppShell>
                <AutomationPage />
              </AppShell>
            }
          />
          <Route
            path="/app/settings"
            element={
              <AppShell>
                <SettingsPage />
              </AppShell>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
