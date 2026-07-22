import { ChangeEvent, useMemo, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { SectionCard } from "../components/ui/SectionCard";
import { usePlanning } from "../features/planning/usePlanning";
import {
  createPlanningBackup,
  parsePlanningBackup,
  PLANNING_SCHEMA_VERSION
} from "../services/storage/planningStorage";
import { formatDateTime } from "../utils/dates";

interface ImportPreview {
  fileName: string;
  schemaVersion: number;
  exportedAt: string | null;
  store: ReturnType<typeof parsePlanningBackup>["store"];
  summary: ReturnType<typeof parsePlanningBackup>["summary"];
}

function downloadJsonFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  window.URL.revokeObjectURL(url);
}

export function SettingsPage() {
  const { store, replaceStore, resetStore } = usePlanning();
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null
  );

  const currentSummary = useMemo(
    () => ({
      projects: store.projects.length,
      archivedProjects: store.projects.filter((project) => project.status === "Archivado").length,
      tasks: store.tasks.length,
      completedTasks: store.tasks.filter((task) => task.status === "completed").length,
      decisions: store.decisions.items.length,
      archivedDecisions: store.decisions.items.filter((item) => item.status === "archived").length,
      approvedDecisions: store.decisions.items.filter((item) => item.status === "approved").length
    }),
    [store]
  );

  const handleExport = () => {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");

    downloadJsonFile(`morga-backup-${timestamp}.json`, createPlanningBackup(store));
    setFeedback({
      tone: "success",
      text: "Se exporto un respaldo JSON con el estado persistido actual."
    });
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = parsePlanningBackup(raw);

      setImportPreview({
        fileName: file.name,
        schemaVersion: parsed.schemaVersion,
        exportedAt: parsed.exportedAt,
        store: parsed.store,
        summary: parsed.summary
      });
      setFeedback(null);
    } catch (error) {
      setImportPreview(null);
      setFeedback({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo leer el archivo seleccionado."
      });
    }
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;

    const shouldReplace = window.confirm(
      "Esto va a reemplazar el estado local actual de Morga. Queres continuar?"
    );

    if (!shouldReplace) return;

    replaceStore(importPreview.store);
    setFeedback({
      tone: "success",
      text: `Se importo el respaldo ${importPreview.fileName}.`
    });
    setImportPreview(null);
  };

  const handleReset = () => {
    const firstCheck = window.confirm(
      "Vas a restaurar los datos iniciales de Morga. Queres seguir?"
    );
    if (!firstCheck) return;

    const secondCheck = window.confirm(
      "Ultima confirmacion: esto reemplaza tus datos locales actuales por la base inicial."
    );
    if (!secondCheck) return;

    resetStore();
    setImportPreview(null);
    setFeedback({
      tone: "success",
      text: "Se restauraron los datos iniciales."
    });
  };

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-morga-line bg-white px-5 py-5 shadow-soft md:px-6 md:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
          Configuracion
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-morga-text md:text-[2rem]">
          Datos y respaldo
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-morga-muted">
          Exporta, revisa e importa tu estado local sin perder proyectos ni tareas.
        </p>
      </section>

      <SectionCard
        title="Estado actual"
        description={`Esquema local v${PLANNING_SCHEMA_VERSION} listo para respaldo.`}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Proyectos
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.projects}
            </p>
          </article>
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Archivados
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.archivedProjects}
            </p>
          </article>
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Tareas
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.tasks}
            </p>
          </article>
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Completadas
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.completedTasks}
            </p>
          </article>
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Decisiones
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.decisions}
            </p>
          </article>
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Archivadas
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.archivedDecisions}
            </p>
          </article>
          <article className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Aprobadas
            </p>
            <p className="mt-2 text-lg font-semibold text-morga-text">
              {currentSummary.approvedDecisions}
            </p>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        title="Respaldo local"
        description="Exporta el estado persistido o prepara una importacion validada antes de sobrescribir."
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </button>

          <label className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt focus-within:ring-2 focus-within:ring-morga-accent">
            <Upload className="h-4 w-4" />
            Importar respaldo
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar datos iniciales
          </button>
        </div>

        {feedback ? (
          <div
            className={`mt-4 rounded-[18px] border px-4 py-3 text-sm ${
              feedback.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-[#d8c5b2] bg-[#fbf7f0] text-morga-text"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        {importPreview ? (
          <div className="mt-4 rounded-[22px] border border-morga-line bg-morga-surfaceAlt/40 p-4">
            <div className="flex flex-col gap-2 border-b border-morga-line/70 pb-3">
              <p className="text-sm font-semibold text-morga-text">
                Archivo listo para importar: {importPreview.fileName}
              </p>
              <p className="text-sm text-morga-muted">
                Version {importPreview.schemaVersion}
                {importPreview.exportedAt
                  ? ` · exportado ${formatDateTime(importPreview.exportedAt)}`
                  : ""}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Proyectos
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.projects}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Archivados
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.archivedProjects}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Tareas
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.tasks}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Completadas
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.completedTasks}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Ingresos
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.incomes}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Gastos
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.expenses}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Compromisos
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.commitments}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Tarjetas
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.creditCards}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Planes
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.installmentPlans}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Reservas
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.reserves}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Historial
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.confirmedRecords}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Ocurrencias
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.commitmentOccurrences}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Ajustes
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.manualAdjustments}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Cierres
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.monthlyClosures}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Decisiones
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.decisions}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Archivadas
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.archivedDecisions}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Aprobadas
                </p>
                <p className="mt-2 text-base font-semibold text-morga-text">
                  {importPreview.summary.approvedDecisions}
                </p>
              </article>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
              >
                Confirmar importacion
              </button>
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
