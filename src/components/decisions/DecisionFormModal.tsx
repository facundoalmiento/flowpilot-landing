import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import {
  DecisionCategory,
  DecisionFormValues,
  DecisionImpact,
  DecisionItem,
  DecisionNecessity,
  DecisionPaymentOptionType,
  DecisionStatus,
  DecisionUrgency
} from "../../types/domain";
import {
  emptyDecisionForm,
  emptyDecisionPaymentOption,
  validateDecision
} from "../../features/decisions/decisionForm";
import { decisionToFormValues } from "../../features/decisions/decisionEngine";
import {
  formatDecisionCategory,
  formatDecisionImpact,
  formatDecisionNecessity,
  formatDecisionPaymentOptionType,
  formatDecisionStatus,
  formatDecisionUrgency
} from "../../utils/format";

const categories: DecisionCategory[] = [
  "safety",
  "health",
  "transport",
  "housing",
  "training",
  "work",
  "technology",
  "travel",
  "personal-project",
  "comfort",
  "maintenance",
  "other"
];

const urgencies: DecisionUrgency[] = ["low", "medium", "high", "critical"];
const impacts: DecisionImpact[] = ["low", "medium", "high"];
const necessities: DecisionNecessity[] = ["essential", "important", "optional"];
const statuses: DecisionStatus[] = [
  "evaluating",
  "planned",
  "saving",
  "approved",
  "postponed",
  "rejected",
  "completed",
  "archived"
];
const optionTypes: DecisionPaymentOptionType[] = [
  "one-time",
  "installments",
  "save-first",
  "mixed",
  "use-reserve"
];

const inputClassName =
  "h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent";
const textareaClassName =
  "min-h-[96px] rounded-2xl border border-morga-line bg-white px-4 py-3 text-sm text-morga-text outline-none transition focus:border-morga-accent";

function InputField({
  label,
  error,
  hint,
  children
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-morga-text">{label}</span>
      {children}
      {error ? (
        <span className="text-sm text-red-700">{error}</span>
      ) : hint ? (
        <span className="text-xs text-morga-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const paymentOptionTypeHints: Record<DecisionPaymentOptionType, string> = {
  "one-time": "Pagas todo de una vez, en una sola fecha.",
  installments: "Lo financias con tarjeta en varias cuotas.",
  "save-first": "Juntas la plata antes de comprarlo, todavia no sale de tu bolsillo.",
  mixed: "Pagas una parte ahora (anticipo) y financias el resto en cuotas.",
  "use-reserve": "Lo pagas con una reserva que ya tenias armada."
};

interface DecisionFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  decision?: DecisionItem | null;
  projects: Array<{ id: string; name: string }>;
  creditCards: Array<{ id: string; name: string }>;
  reserves: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (decisionId: string | null, values: DecisionFormValues) => void;
}

export function DecisionFormModal({
  open,
  mode,
  decision,
  projects,
  creditCards,
  reserves,
  onClose,
  onSubmit
}: DecisionFormModalProps) {
  const [values, setValues] = useState<DecisionFormValues>(emptyDecisionForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(decision ? decisionToFormValues(decision) : emptyDecisionForm);
    setSubmitted(false);
  }, [decision, open]);

  const errors = useMemo(() => validateDecision(values), [values]);

  const showError = (field: string) => (submitted ? errors[field] : undefined);

  const addPaymentOption = () => {
    setValues((current) => ({
      ...current,
      paymentOptions: [
        ...current.paymentOptions,
        { ...emptyDecisionPaymentOption, totalAmount: current.totalAmount }
      ]
    }));
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nueva decision" : "Editar decision"}
      description="Carga el contexto, las alternativas de pago y deja lista la simulacion sin mover todavia las finanzas reales."
      onClose={onClose}
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(decision?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={showError("name")}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>

          <InputField label="Proyecto relacionado">
            <select
              value={values.projectId}
              onChange={(event) =>
                setValues((current) => ({ ...current, projectId: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Sin proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </InputField>
        </div>

        <InputField label="Motivo o contexto">
          <textarea
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            className={textareaClassName}
          />
        </InputField>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InputField label="Categoria">
            <select
              value={values.category}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  category: event.target.value as DecisionCategory
                }))
              }
              className={inputClassName}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatDecisionCategory(category)}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Urgencia" hint="Que tan pronto hace falta resolver esto.">
            <select
              value={values.urgency}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  urgency: event.target.value as DecisionUrgency
                }))
              }
              className={inputClassName}
            >
              {urgencies.map((urgency) => (
                <option key={urgency} value={urgency}>
                  {formatDecisionUrgency(urgency)}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Impacto" hint="Cuanto mejora tu vida o tu bienestar si lo haces.">
            <select
              value={values.impact}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  impact: event.target.value as DecisionImpact
                }))
              }
              className={inputClassName}
            >
              {impacts.map((impact) => (
                <option key={impact} value={impact}>
                  {formatDecisionImpact(impact)}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Necesidad" hint="Que tan imprescindible es, comparado con un gusto.">
            <select
              value={values.necessity}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  necessity: event.target.value as DecisionNecessity
                }))
              }
              className={inputClassName}
            >
              {necessities.map((necessity) => (
                <option key={necessity} value={necessity}>
                  {formatDecisionNecessity(necessity)}
                </option>
              ))}
            </select>
          </InputField>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InputField label="Importe total" error={showError("totalAmount")}>
            <input
              inputMode="numeric"
              value={values.totalAmount}
              onChange={(event) =>
                setValues((current) => ({ ...current, totalAmount: event.target.value }))
              }
              className={inputClassName}
              placeholder="Ej: 250000"
            />
          </InputField>

          <InputField label="Fecha deseada" error={showError("desiredDate")}>
            <input
              type="date"
              value={values.desiredDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, desiredDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>

          <InputField label="Estado">
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as DecisionStatus
                }))
              }
              className={inputClassName}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {formatDecisionStatus(status)}
                </option>
              ))}
            </select>
          </InputField>
        </div>

        <section className="space-y-4 rounded-[24px] border border-morga-line bg-morga-surfaceAlt/35 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-2xl font-semibold text-morga-text">
                Opciones de pago
              </h3>
              <p className="mt-1 text-sm text-morga-muted">
                Podes cargar entre una y varias alternativas para compararlas con datos reales.
              </p>
            </div>
            <button
              type="button"
              onClick={addPaymentOption}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              Agregar opcion
            </button>
          </div>

          {showError("paymentOptions") ? (
            <p className="text-sm text-red-700">{showError("paymentOptions")}</p>
          ) : null}

          <div className="space-y-4">
            {values.paymentOptions.map((option, index) => {
              const canRemove = values.paymentOptions.length > 1;
              const optionId = option.id ?? `option-${index}`;

              return (
                <article key={optionId} className="rounded-[22px] border border-morga-line bg-white p-4">
                  <div className="flex flex-col gap-3 border-b border-morga-line/70 pb-4 md:flex-row md:items-start md:justify-between">
                    <label className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="selectedPaymentOptionId"
                        checked={
                          values.selectedPaymentOptionId === option.id ||
                          (!values.selectedPaymentOptionId && index === 0)
                        }
                        onChange={() =>
                          setValues((current) => ({
                            ...current,
                            selectedPaymentOptionId: option.id ?? ""
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-morga-dark"
                      />
                      <div>
                        <p className="text-sm font-semibold text-morga-text">
                          Opcion {index + 1}
                        </p>
                        <p className="text-sm text-morga-muted">
                          Marca una opcion principal para evaluar y convertir.
                        </p>
                      </div>
                    </label>

                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            selectedPaymentOptionId:
                              current.selectedPaymentOptionId === option.id
                                ? ""
                                : current.selectedPaymentOptionId,
                            paymentOptions: current.paymentOptions.filter((_, itemIndex) => itemIndex !== index)
                          }))
                        }
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Quitar
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InputField label="Tipo" hint={paymentOptionTypeHints[option.type]}>
                      <select
                        value={option.type}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    type: event.target.value as DecisionPaymentOptionType
                                  }
                                : item
                            )
                          }))
                        }
                        className={inputClassName}
                      >
                        {optionTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatDecisionPaymentOptionType(type)}
                          </option>
                        ))}
                      </select>
                    </InputField>

                    <InputField
                      label="Total de la opcion"
                      error={showError(`paymentOptions.${index}.totalAmount`)}
                      hint="El costo completo de esto, sin importar como lo pagues."
                    >
                      <input
                        inputMode="numeric"
                        placeholder="Ej: 250000"
                        value={option.totalAmount}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, totalAmount: event.target.value } : item
                            )
                          }))
                        }
                        className={inputClassName}
                      />
                    </InputField>

                    {option.type === "mixed" ? (
                      <InputField
                        label="Anticipo"
                        error={showError(`paymentOptions.${index}.upfrontAmount`)}
                        hint="Cuanto pagas ahora, antes de empezar con las cuotas."
                      >
                        <input
                          inputMode="numeric"
                          value={option.upfrontAmount}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, upfrontAmount: event.target.value } : item
                              )
                            }))
                          }
                          className={inputClassName}
                          placeholder="Ej: 50000"
                        />
                      </InputField>
                    ) : null}

                    {option.type === "installments" || option.type === "mixed" ? (
                      <InputField
                        label="Interes"
                        error={showError(`paymentOptions.${index}.interestAmount`)}
                        hint="Opcional, solo si la financiacion tiene recargo."
                      >
                        <input
                          inputMode="numeric"
                          value={option.interestAmount}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, interestAmount: event.target.value } : item
                              )
                            }))
                          }
                          className={inputClassName}
                          placeholder="Opcional"
                        />
                      </InputField>
                    ) : null}
                  </div>

                  {option.type === "installments" || option.type === "mixed" ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <InputField
                        label="Cantidad de cuotas"
                        error={showError(`paymentOptions.${index}.installmentCount`)}
                        hint="Ej: 12"
                      >
                        <input
                          inputMode="numeric"
                          value={option.installmentCount}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, installmentCount: event.target.value }
                                  : item
                              )
                            }))
                          }
                          className={inputClassName}
                          placeholder="Ej: 12"
                        />
                      </InputField>

                      <InputField
                        label="Valor de cuota"
                        error={showError(`paymentOptions.${index}.installmentAmount`)}
                        hint="Usa 'Calcular' si no la sabes de memoria."
                      >
                        <div className="flex gap-2">
                          <input
                            inputMode="numeric"
                            value={option.installmentAmount}
                            onChange={(event) =>
                              setValues((current) => ({
                                ...current,
                                paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, installmentAmount: event.target.value }
                                    : item
                                )
                              }))
                            }
                            className={`${inputClassName} flex-1`}
                            placeholder="Opcional"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const total = Number(option.totalAmount);
                              const count = Number(option.installmentCount);
                              if (!Number.isFinite(total) || !Number.isFinite(count) || count <= 0) return;
                              setValues((current) => ({
                                ...current,
                                paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, installmentAmount: String(Math.round(total / count)) }
                                    : item
                                )
                              }));
                            }}
                            className="min-h-[44px] rounded-2xl border border-morga-line px-3 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                          >
                            Calcular
                          </button>
                        </div>
                      </InputField>

                      <InputField
                        label="Primer vencimiento"
                        error={showError(`paymentOptions.${index}.firstDueDate`)}
                      >
                        <input
                          type="date"
                          value={option.firstDueDate}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, firstDueDate: event.target.value } : item
                              )
                            }))
                          }
                          className={inputClassName}
                        />
                      </InputField>

                      <InputField
                        label="Tarjeta"
                        error={showError(`paymentOptions.${index}.creditCardId`)}
                      >
                        <select
                          value={option.creditCardId}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, creditCardId: event.target.value } : item
                              )
                            }))
                          }
                          className={inputClassName}
                        >
                          <option value="">Elegi una tarjeta</option>
                          {creditCards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {card.name}
                            </option>
                          ))}
                        </select>
                      </InputField>
                    </div>
                  ) : null}

                  {option.type === "use-reserve" ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Reserva"
                        error={showError(`paymentOptions.${index}.reserveId`)}
                        hint="La reserva de donde va a salir la plata."
                      >
                        <select
                          value={option.reserveId}
                          onChange={(event) =>
                            setValues((current) => ({
                              ...current,
                              paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, reserveId: event.target.value } : item
                              )
                            }))
                          }
                          className={inputClassName}
                        >
                          <option value="">Elegi una reserva</option>
                          {reserves.map((reserve) => (
                            <option key={reserve.id} value={reserve.id}>
                              {reserve.name}
                            </option>
                          ))}
                        </select>
                      </InputField>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <InputField label="Notas">
                      <textarea
                        value={option.notes}
                        placeholder="Opcional: cualquier detalle que te ayude a recordar el contexto."
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            paymentOptions: current.paymentOptions.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, notes: event.target.value } : item
                            )
                          }))
                        }
                        className={textareaClassName}
                      />
                    </InputField>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted transition hover:border-morga-accent hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            {mode === "create" ? "Guardar decision" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
