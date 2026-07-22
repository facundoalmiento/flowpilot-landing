import { useContext } from "react";
import { PlanningContext } from "./PlanningContextValue";

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error("usePlanning debe usarse dentro de PlanningProvider");
  }
  return context;
}
