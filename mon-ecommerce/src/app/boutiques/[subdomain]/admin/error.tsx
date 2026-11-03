"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ subdomain: string }>();
  const router = useRouter();
  const subdomain = params?.subdomain || "";

  useEffect(() => {
    console.error("[Admin Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Impossible de charger cette page
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Un incident inattendu est survenu lors du chargement des données. Vous pouvez réessayer ou revenir à l'accueil de votre administration.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-left">
            <p className="text-[11px] font-mono text-gray-600 break-words line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>

          {subdomain && (
            <button
              onClick={() => router.push(`/boutiques/${subdomain}/admin`)}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-gray-500" />
              <span>Tableau de bord</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
