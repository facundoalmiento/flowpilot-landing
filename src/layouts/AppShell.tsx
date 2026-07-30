import {
  BriefcaseBusiness,
  CalendarPlus2,
  CircleDollarSign,
  FolderKanban,
  LogOut,
  Plus,
  Settings2,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { MorgaLogo } from "../components/brand/MorgaLogo";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../features/auth/useAuth";
import {
  mobileNavigationItems,
  navigationItems
} from "../features/navigation/navigation";

const navLinkClass =
  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-morga-muted transition hover:bg-[#f7f0e6] hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const quickActions = useMemo(
    () => [
      { label: "Nueva tarea", to: "/week?compose=1", icon: CalendarPlus2 },
      { label: "Nuevo gasto", to: "/finances?tab=movements&compose=expense", icon: CircleDollarSign },
      { label: "Nuevo ingreso", to: "/finances?tab=movements&compose=income", icon: CircleDollarSign },
      { label: "Nueva decision", to: "/decisions?compose=1", icon: Sparkles },
      { label: "Nuevo proyecto", to: "/projects?compose=1", icon: BriefcaseBusiness }
    ],
    []
  );

  const moreLinks = useMemo(
    () => [
      { label: "Proyectos", to: "/projects", icon: FolderKanban },
      { label: "Decisiones", to: "/decisions", icon: Sparkles },
      { label: "Configuracion", to: "/settings", icon: Settings2 }
    ],
    []
  );

  const handleQuickAction = () => setQuickMenuOpen(true);

  return (
    <div className="min-h-screen overflow-x-hidden bg-morga-bg font-body text-morga-text">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside className="hidden w-[300px] shrink-0 border-r border-morga-line/80 bg-morga-surface px-5 py-8 lg:flex lg:flex-col">
          <MorgaLogo />
          <div className="mt-10 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `${navLinkClass} ${
                      isActive
                        ? "bg-[#f1e6d8] text-morga-text before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-0.5 before:rounded-full before:bg-morga-accent"
                        : item.upcoming
                          ? "text-morga-muted/80"
                          : ""
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 whitespace-nowrap">{item.label}</span>
                  {item.upcoming ? (
                    <span className="shrink-0 whitespace-nowrap pl-2 text-[9px] font-normal normal-case tracking-[0.01em] text-morga-muted/50">
                      Proximamente
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </div>

          <div className="mt-auto space-y-3">
            {user ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-morga-line/80 bg-morga-surfaceAlt/40 px-3 py-2.5">
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-morga-muted" title={user.email ?? ""}>
                  {user.email}
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-morga-muted transition hover:bg-white hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
                  aria-label="Cerrar sesion"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleQuickAction}
              className="w-full rounded-full bg-morga-dark px-5 py-4 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              Nuevo proyecto
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-morga-line/70 bg-morga-bg/90 px-4 py-4 backdrop-blur md:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <MorgaLogo />
              <button
                type="button"
                onClick={handleQuickAction}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-morga-line bg-white px-4 py-2 text-sm font-semibold text-morga-text shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-4 md:px-6 md:pb-[calc(env(safe-area-inset-bottom)+8rem)] lg:px-8 lg:py-6 xl:px-10 xl:py-8">
            <Outlet />
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-morga-line bg-morga-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-xl items-center justify-between">
              {mobileNavigationItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold ${
                      isActive ? "text-morga-text" : "text-morga-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              <button
                type="button"
                onClick={handleQuickAction}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-morga-dark text-white shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
                aria-label="Abrir acciones rapidas"
              >
                <Plus className="h-6 w-6" />
              </button>

              <NavLink
                to="/finances"
                className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold ${
                  location.pathname === "/finances" ? "text-morga-text" : "text-morga-muted"
                }`}
              >
                <CircleDollarSign className="h-5 w-5" />
                <span>Finanzas</span>
              </NavLink>

              <button
                type="button"
                onClick={() => setMoreMenuOpen(true)}
                className={`flex min-w-[70px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold ${
                  ["/projects", "/decisions", "/settings"].includes(location.pathname)
                    ? "text-morga-text"
                    : "text-morga-muted"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent`}
                aria-label="Abrir mas accesos"
              >
                <Settings2 className="h-5 w-5" />
                <span>Mas</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      <Modal
        open={quickMenuOpen}
        title="Acciones rapidas"
        description="Elige que quieres crear. Se reutilizan los formularios existentes de Morga."
        onClose={() => setQuickMenuOpen(false)}
      >
        <div className="grid gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.to}
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  navigate(action.to);
                }}
                className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-morga-line bg-white px-4 py-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
              >
                <Icon className="h-4 w-4 text-morga-muted" />
                {action.label}
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={moreMenuOpen}
        title="Mas accesos"
        description="Atajos secundarios para navegar rapido desde el celular."
        onClose={() => setMoreMenuOpen(false)}
      >
        <div className="grid gap-3">
          {moreLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.to}
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  navigate(link.to);
                }}
                className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-morga-line bg-white px-4 py-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
              >
                <Icon className="h-4 w-4 text-morga-muted" />
                {link.label}
              </button>
            );
          })}

          {user ? (
            <button
              type="button"
              onClick={() => {
                setMoreMenuOpen(false);
                handleSignOut();
              }}
              className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-morga-line bg-white px-4 py-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
            >
              <LogOut className="h-4 w-4 text-morga-muted" />
              Cerrar sesion
            </button>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
