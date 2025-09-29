import React, { JSX, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Adresse e-mail invalide");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, product: "DEW" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Erreur ${res.status}`);
      }

      const data = await res.json();
      // on s'attend à recevoir { token: string, expiresIn?: number }
      if (!data?.token) throw new Error("Aucun token reçu");

      // Stockage du token (ex : localStorage). Adapter selon les besoins (httpOnly cookie côté serveur préférable).
      localStorage.setItem("dew_token", data.token);

      // Redirection vers le dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-1">DEW — Tokenized Asset Management</h1>
        <p className="text-sm text-slate-500 mb-6">Connecte-toi pour accéder à ta plateforme</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block mb-3">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@exemple.com"
              className="mt-1 block w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-slate-700">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </label>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>
            Pas encore de compte ? <a href="/signup" className="text-indigo-600">S&aposinscrire</a>
          </p>
        </div>

        <div className="mt-6 text-xs text-slate-400 text-center">
          <p>DEW — Tokenized Asset Management Platform</p>
        </div>
      </div>
    </div>
  );
}
