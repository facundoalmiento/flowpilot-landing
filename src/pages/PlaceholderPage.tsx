import { EmptyState } from "../components/ui/EmptyState";
import { PageIntro } from "../components/ui/PageIntro";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="En preparación"
        title={title}
        description={description}
      />
      <EmptyState
        title="Esta sección sigue en construcción"
        description="La primera etapa está enfocada en el tablero base, el layout responsive, el dashboard y el CRUD de proyectos con persistencia local."
      />
    </div>
  );
}
