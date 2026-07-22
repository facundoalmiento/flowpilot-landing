import {
  BriefcaseBusiness,
  CalendarRange,
  CircleDollarSign,
  Home,
  Settings2,
  Sparkles
} from "lucide-react";

export const navigationItems = [
  { to: "/", label: "Inicio", icon: Home, upcoming: false },
  { to: "/week", label: "Mi semana", icon: CalendarRange, upcoming: false },
  { to: "/projects", label: "Proyectos", icon: BriefcaseBusiness, upcoming: false },
  { to: "/finances", label: "Finanzas", icon: CircleDollarSign, upcoming: false },
  { to: "/decisions", label: "Decisiones", icon: Sparkles, upcoming: false },
  { to: "/settings", label: "Configuracion", icon: Settings2, upcoming: false }
] as const;

export const mobileNavigationItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/week", label: "Mi semana", icon: CalendarRange },
  { to: "/finances", label: "Finanzas", icon: CircleDollarSign },
  { to: "/settings", label: "Mas", icon: Settings2 }
] as const;
