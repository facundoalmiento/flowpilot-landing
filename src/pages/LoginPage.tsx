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
    <div className="flex min-h-screen items-center justify-center bg-morga-bg px-4">
      <div className="w-full max-w-sm rounded-panel border border-morga-line bg-morga-surface p-8 shadow-panel">
        <MorgaLogo />

        <p className="mt-8 text-sm leading-6 text-morga-muted">
          Iniciá sesión para ver tus proyectos, tareas y finanzas. Cada cuenta tiene sus propios
          datos, privados y separados del resto.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isRedirecting}
          className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border border-morga-line bg-morga-surface px-5 py-3 text-sm font-semibold text-morga-text shadow-soft transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent disabled:opacity-60"
        >
          <GoogleIcon />
          {isRedirecting ? "Redirigiendo..." : "Continuar con Google"}
        </button>

        {error ? (
          <p className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
