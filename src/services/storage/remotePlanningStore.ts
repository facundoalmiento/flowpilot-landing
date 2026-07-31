import { createEmptyPlanningStore } from "../../data/mock/seed";
import { PlanningStore } from "../../types/domain";
import { supabase } from "../supabase/client";
import {
  migratePlanningStore,
  PLANNING_SCHEMA_VERSION,
  validateRelationships
} from "./planningStorage";

export async function loadRemotePlanningStore(userId: string): Promise<PlanningStore> {
  const { data, error } = await supabase
    .from("planning_stores")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const initialStore = createEmptyPlanningStore();
    const { error: insertError } = await supabase.from("planning_stores").insert({
      user_id: userId,
      data: initialStore,
      schema_version: PLANNING_SCHEMA_VERSION
    });

    if (insertError) {
      throw insertError;
    }

    return initialStore;
  }

  try {
    const migrated = migratePlanningStore(data.data);
    validateRelationships(migrated);
    return migrated;
  } catch {
    return createEmptyPlanningStore();
  }
}

export async function saveRemotePlanningStore(userId: string, store: PlanningStore) {
  const { error } = await supabase
    .from("planning_stores")
    .upsert(
      {
        user_id: userId,
        data: store,
        schema_version: PLANNING_SCHEMA_VERSION
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw error;
  }
}
