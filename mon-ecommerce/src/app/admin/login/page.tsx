"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/admin");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      router.replace("/admin");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
                <rect width="120" height="120" rx="24" fill="white" stroke="#059669" strokeWidth="2"/>
                <path d="M32 42h56l-6 34a4 4 0 01-4 3H42a4 4 0 01-4-3l-6-34z" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
                <circle cx="48" cy="82" r="5" fill="#059669"/>
                <circle cx="76" cy="82" r="5" fill="#059669"/>
                <path d="M44 42l6-14h20l6 14" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre boutique</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" placeholder="admin@boutique.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" placeholder="••••••••" />
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {message}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Chargement..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
