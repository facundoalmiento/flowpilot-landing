# Rediseño de Finanzas — Morga
### Propuesta UX/UI: menos fricción, menos ruido, un solo número que importa

---

## 1. Diagnóstico

Hoy "Finanzas" tiene 8 pestañas (Resumen, Ingresos y gastos, Mes, Historial, Compromisos, Tarjetas y cuotas, Reservas, Configuración) y 6 tarjetas de métricas compitiendo por atención en la primera pantalla. El resultado: cargar un gasto — la acción más frecuente de toda la app — obliga a pensar "¿en qué pestaña estaba eso?" antes de poder escribir un número. Eso es lo que rompe el hábito.

La regla de diseño que ordena todo lo que sigue: **la acción más frecuente tiene que ser la más fácil de encontrar, no una más entre ocho.**

---

## 2. Arquitectura nueva: 3 vistas, no 8

| Antes (8 pestañas) | Ahora (3 vistas) |
|---|---|
| Resumen | **Hoy** |
| Ingresos y gastos | **Movimientos** |
| Historial | **Movimientos** (mismo listado, con filtro) |
| Mes | **Más** → sección "Cierre mensual" |
| Compromisos | **Más** → sección "Compromisos" |
| Tarjetas y cuotas | **Más** → sección "Tarjetas y cuotas" |
| Reservas | **Más** → sección "Reservas" |
| Configuración | **Más** → sección "Configuración" |

Nada se elimina — todo lo que existe hoy sigue estando. Lo que cambia es que solo 3 destinos compiten por la atención inicial; el resto vive ordenado dentro de "Más", una vista con acordeones colapsados por título, no con 5 pestañas nuevas escondidas atrás de una.

### Wireframe — vista "Hoy" (la que se ve al entrar)

```
┌─────────────────────────────────────────────┐
│  Morga · Finanzas          [Tema] [+ Gasto]  │  ← header liviano
├─────────────────────────────────────────────┤
│                                               │
│        DISPONIBLE PARA DECIDIR               │
│                                               │
│           $ 148.500                          │  ← número gigante,
│                                               │     único protagonista
│     Saldo actual $540.000 · Reservado $91.500│  ← contexto chico, gris,
│                                               │     una sola línea
├─────────────────────────────────────────────┤
│  [ + Agregar gasto ]   [ + Agregar ingreso ]  │  ← 2 botones, imposibles
│                                                │     de no ver
├─────────────────────────────────────────────┤
│  Lo que se viene                              │
│  ─────────────────────────────────            │
│  · Alquiler          vence en 3 días  $180.000│
│  · Tarjeta Visa       vence en 6 días  $92.400│
│  · Sueldo (cobro)     en 5 días      +$820.000│
│                                                │
│  [ Ver todo en Movimientos → ]                │
└─────────────────────────────────────────────┘
```

Un solo número grande. Todo lo demás (saldo actual, proyección, deuda en cuotas, ingresos esperados) sigue calculándose igual que hoy — pero pasa a texto secundario de una línea, o se muda a "Más → Cierre mensual" para quien quiera el detalle contable completo. Se elimina la grilla de 6 tarjetas compitiendo en la vista principal.

### Vista "Movimientos"

Reemplaza "Ingresos y gastos" + "Historial" en una sola lista cronológica, con 3 chips de filtro (`Todo` · `Gastos` · `Ingresos`) y buscador. Cada fila: concepto, monto, fecha, estado. Mismo dato que hoy, una sola pantalla en vez de dos pestañas separadas.

### Vista "Más"

Lista de accesos con acordeón, colapsados por defecto:

```
▸ Cierre mensual
▸ Compromisos fijos
▸ Tarjetas y cuotas
▸ Reservas
▸ Configuración
```

Quien nunca cierra el mes ni gestiona tarjetas no vuelve a ver esas secciones a menos que las busque a propósito.

---

## 3. Carga Rápida — el corazón del rediseño

### Objetivo de tiempo
3 taps máximo, sin scroll, sin elegir pestaña: **tap en "+", monto, listo.**

### Disparador
- Desktop: botón `+ Agregar gasto` fijo junto al número de "Disponible para decidir" (siempre visible, sin scroll).
- Mobile: el botón central `+` que ya existe en la barra inferior abre directo este flujo (hoy abre un menú de 5 opciones; pasa a abrir el gasto rápido directo, con las otras opciones como acceso secundario).

### Campos — exactamente 3, nada más

| Campo | Tipo | Comportamiento |
|---|---|---|
| **Monto** | Teclado numérico, autofocus al abrir | Sin autofocus en ningún otro campo. Se escribe primero porque es lo que el usuario ya tiene en la cabeza. |
| **Concepto** | Texto libre + chips de sugerencias | Debajo del input aparecen 4-6 chips con los últimos conceptos usados ("Nafta", "Super", "Uber"...). Tocar un chip lo completa en un tap, sin escribir. |
| **Medio de pago** | Selector de 3-4 íconos (Efectivo / Débito / Transferencia / Tarjeta) | Preseleccionado en el último medio usado. Si no se toca, ya queda definido — cero taps extra. |

Todo lo demás que el formulario completo pide hoy (categoría, fecha de vencimiento, tarjeta asociada, notas) **se infiere o se pospone**:

- **Fecha:** hoy, por defecto. Un chip pequeño "Hoy ▾" permite cambiarla sin que sea obligatorio mirarla.
- **Categoría:** "Otro" por defecto — no bloquea el guardado. Se puede afinar después desde Movimientos, sin fricción en el momento de carga.
- **Estado:** siempre "Pagado" — la carga rápida es para algo que ya se gastó, así que impacta el saldo real al instante (usa el mismo circuito que hoy usa "Marcar pagado", no lo bypasea).

### Estados del modal

1. **Vacío / inicial:** monto en foco, chips de conceptos recientes visibles, medio de pago preseleccionado. Botón "Agregar gasto" deshabilitado hasta tener monto > 0 y concepto no vacío.
2. **Completo:** botón habilitado, Enter o tap lo confirma.
3. **Guardado (optimista):** el modal se cierra al instante, aparece un toast abajo — *"Gasto agregado · $X · Deshacer"* — con ventana de 5 segundos para deshacer sin tener que ir a buscar y borrar el registro.
4. **Error de validación:** solo si se intenta guardar sin monto o sin concepto — mensaje inline rojo debajo del campo, sin modal de alerta ni bloqueo del resto de la pantalla.
5. **"Más opciones" (salida de escape):** un link chico al pie del modal — *"Cargar con más detalle →"* — abre el formulario completo actual (categoría, tarjeta, fecha de vencimiento futura, notas) para los casos que sí lo necesitan (compra en cuotas, gasto a pagar a futuro, etc.). La carga rápida no reemplaza al formulario completo: lo hace la puerta de entrada por defecto, y el completo queda como excepción a un tap de distancia.

---

## 4. Jerarquía visual — reglas concretas

- **1 número protagonista:** "Disponible para decidir" — tipografía más grande que cualquier otro texto en toda la pantalla de Finanzas.
- **Máximo 2 números secundarios visibles sin interacción:** Saldo actual y Reservado, en una sola línea de texto gris, sin tarjetas propias.
- **El resto (proyección fin de mes, deuda en cuotas, ingresos esperados) se mueve a "Más → Cierre mensual"**, donde sí tiene sentido ver el detalle contable completo — no compite con la carga diaria.
- **Color de alerta reservado:** el tono cálido/warning (el mismo `#9f5f49` que ya usa la app) se usa *solo* cuando "Disponible para decidir" es negativo — no se reparte entre 6 tarjetas distintas como hoy.

---

## 5. Prototipo de código (React + Tailwind, tokens `morga-*` existentes)

Pensado para encajar directo en el proyecto: usa `usePlanning()`, `formatMoney`, `Modal` y las mismas clases de color que ya definen `tailwind.config.ts` (funciona igual en modo claro y oscuro, sin tocar nada del theming ya implementado).

```tsx
// src/components/finance/QuickAddExpense.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Modal } from "../ui/Modal";
import { usePlanning } from "../../features/planning/usePlanning";
import { PaymentMethod } from "../../types/domain";
import { formatMoney } from "../../utils/format";

const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: "debit", label: "Débito", icon: "💳" },
  { value: "cash", label: "Efectivo", icon: "💵" },
  { value: "bank-transfer", label: "Transferencia", icon: "🔁" },
  { value: "credit-card", label: "Tarjeta", icon: "🏦" }
];

function getRecentConcepts(names: string[], limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const name of names) {
    const key = name.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
    if (result.length >= limit) break;
  }
  return result;
}

export function QuickAddExpense({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { finance, createExpense } = usePlanning();
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("debit");
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<{ id: string; label: string } | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const recentConcepts = useMemo(
    () => getRecentConcepts(finance.expenses.map((expense) => expense.name).reverse()),
    [finance.expenses]
  );

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setConcept("");
    setMethod((finance.expenses[finance.expenses.length - 1]?.paymentMethod as PaymentMethod) ?? "debit");
    setSubmitted(false);
    // autofocus en el monto: es lo primero que el usuario ya tiene en la cabeza
    setTimeout(() => amountRef.current?.focus(), 50);
  }, [open, finance.expenses]);

  const numericAmount = Number(amount);
  const hasAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const hasConcept = concept.trim().length > 0;
  const canSave = hasAmount && hasConcept;
  const today = new Date().toISOString().slice(0, 10);

  const handleSave = () => {
    setSubmitted(true);
    if (!canSave) return;

    createExpense({
      name: concept.trim(),
      amount,
      dueDate: today,
      paidDate: today,
      status: "paid", // impacta el saldo real al instante, mismo circuito que "Marcar pagado"
      category: "other",
      paymentMethod: method,
      creditCardId: "",
      installmentPlanId: "",
      notes: ""
    });

    setLastSaved({ id: crypto.randomUUID(), label: `${concept.trim()} · ${formatMoney(numericAmount)}` });
    onClose();
  };

  return (
    <Modal open={open} title="Agregar gasto" description="" onClose={onClose}>
      <div className="grid gap-5">
        {/* Monto — autofocus, teclado numérico grande */}
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-morga-text">Monto</span>
          <input
            ref={amountRef}
            inputMode="decimal"
            placeholder="$ 0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-16 rounded-2xl border border-morga-line bg-morga-surface px-5 text-3xl font-semibold text-morga-text outline-none transition focus:border-morga-accent"
          />
          {submitted && !hasAmount ? (
            <span className="text-sm text-red-600">Ingresá un monto mayor a cero.</span>
          ) : null}
        </label>

        {/* Concepto — texto libre + chips de recientes */}
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-morga-text">Concepto</span>
          <input
            placeholder="Ej: Nafta, Super, Uber"
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
            className="h-12 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
          />
          {recentConcepts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recentConcepts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setConcept(item)}
                  className="rounded-full border border-morga-line bg-morga-surfaceAlt px-3 py-1.5 text-xs font-medium text-morga-text transition hover:bg-morga-accentSoft"
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
          {submitted && !hasConcept ? (
            <span className="text-sm text-red-600">Contá en pocas palabras en qué fue.</span>
          ) : null}
        </label>

        {/* Medio de pago — preseleccionado, un tap para cambiar */}
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-morga-text">Medio de pago</span>
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMethod(option.value)}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold transition ${
                  method === option.value
                    ? "border-morga-accent bg-morga-accentSoft text-morga-text"
                    : "border-morga-line bg-morga-surface text-morga-muted hover:bg-morga-surfaceAlt"
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="h-14 rounded-full bg-morga-dark text-base font-semibold text-white transition disabled:opacity-40"
        >
          Agregar gasto
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-center text-sm font-medium text-morga-muted underline-offset-4 hover:underline"
        >
          Cargar con más detalle →
        </button>
      </div>
    </Modal>
  );
}
```

### Hero de "Disponible para decidir" (vista "Hoy")

```tsx
// fragmento de src/pages/FinancesHomePage.tsx
<section className="rounded-panel border border-morga-line bg-morga-surface px-6 py-8 text-center shadow-soft">
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-morga-muted">
    Disponible para decidir
  </p>
  <p
    className={`mt-3 text-5xl font-semibold tracking-[-0.03em] md:text-6xl ${
      overview.availableToDecide < 0 ? "text-[#9f5f49]" : "text-morga-text"
    }`}
  >
    {formatMoney(overview.availableToDecide)}
  </p>
  <p className="mt-3 text-sm text-morga-muted">
    Saldo actual {formatMoney(overview.availableToday)} · Reservado{" "}
    {formatMoney(finance.settings.minimumReserve)}
  </p>

  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
    <button
      type="button"
      onClick={() => setQuickExpenseOpen(true)}
      className="h-14 rounded-full bg-morga-dark px-8 text-sm font-semibold text-white"
    >
      + Agregar gasto
    </button>
    <button
      type="button"
      onClick={() => setQuickIncomeOpen(true)}
      className="h-14 rounded-full border border-morga-line px-8 text-sm font-semibold text-morga-text hover:bg-morga-surfaceAlt"
    >
      + Agregar ingreso
    </button>
  </div>
</section>
```

---

## 6. Qué no cambia (y por qué importa)

- El modelo de datos no se toca: `Expense`, `Income`, la tabla `planning_stores` y el circuito de ledger (`markExpensePaidInLedger`) siguen siendo los mismos. Este rediseño es de interfaz, no de arquitectura — bajo riesgo, alto impacto.
- El formulario completo actual no se borra: queda accesible desde "Cargar con más detalle" y desde "Movimientos" para editar cualquier gasto ya cargado.
- Todas las 8 secciones de hoy siguen existiendo — ninguna funcionalidad se pierde, solo se reordena la prioridad visual.

---

## 7. Próximo paso sugerido

Si el enfoque cierra, el orden de implementación de menor a mayor riesgo sería:
1. Componente `QuickAddExpense` (nuevo, no toca nada existente) + botón de acceso rápido.
2. Colapsar la barra de 8 pestañas a 3 (`Hoy` / `Movimientos` / `Más`) reusando el contenido que ya existe hoy.
3. Rediseñar visualmente el hero de "Disponible para decidir" en la vista "Hoy".

Cada paso es reversible por separado y no requiere migrar datos.
