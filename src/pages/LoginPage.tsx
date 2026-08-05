import { useState } from "react";
import { MorgaLogo } from "../components/brand/MorgaLogo";
import { useAuth } from "../features/auth/useAuth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.48a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.56-5.17 3.56-8.84Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.96-2.9l-3.88-3.02c-1.08.72-2.46 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.96H1.24v3.11A11.998 11.998 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.24a12 12 0 0 0 0 10.76l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.01 3.11C6.2 6.9 8.86 4.77 12 4.77Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsRedirecting(true);
    try {
      await signInWithGoogle();
    } catch {
      setIsRedirecting(false);
      setError("No pudimos iniciar el login con Google. Probá de nuevo.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-morga-bg px-6 py-10">
      <section className="w-full max-w-md border-y border-morga-line py-10 sm:py-12">
        <MorgaLogo />

        <div className="mt-12 border-l-2 border-morga-accent pl-5">
          <h1 className="font-display text-3xl font-semibold leading-tight text-morga-text">
            Un lugar para llevar lo importante.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-morga-muted">
            Proyectos, tareas y finanzas en un espacio privado, hecho para usar todos los días.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isRedirecting}
          className="mt-10 inline-flex min-h-[48px] w-full items-center justify-center gap-3 border border-morga-text bg-morga-text px-5 py-3 text-sm font-semibold text-morga-surface transition hover:border-morga-accent hover:bg-morga-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent focus-visible:ring-offset-2 focus-visible:ring-offset-morga-bg disabled:opacity-60"
        >
          <GoogleIcon />
          {isRedirecting ? "Redirigiendo..." : "Ingresar con Google"}
        </button>

        <p className="mt-4 text-xs leading-5 text-morga-muted">
          Usamos Google solamente para identificar tu cuenta.
        </p>

        {error ? (
          <p className="mt-5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
}
