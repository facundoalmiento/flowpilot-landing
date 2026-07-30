import { Route, Routes } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { PlanningProvider } from "../features/planning/PlanningContext";
import { AppShell } from "../layouts/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { DecisionDetailPage } from "../pages/DecisionDetailPage";
import { DecisionsPage } from "../pages/DecisionsPage";
import { FinancesPage } from "../pages/FinancesPage";
import { LoginPage } from "../pages/LoginPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { WeekPage } from "../pages/WeekPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-morga-bg">
        <p className="text-sm font-medium text-morga-muted">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <PlanningProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/finances" element={<FinancesPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/decisions/:decisionId" element={<DecisionDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </PlanningProvider>
  );
}

export default App;
