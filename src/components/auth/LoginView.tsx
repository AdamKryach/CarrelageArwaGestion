import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="w-16 h-16 mx-auto mb-3 bg-white text-amber-700 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg">
            CA
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">CarrelageArwa</h1>
          <p className="text-amber-100 text-xs mt-1 font-medium">
            Système de Gestion Commerciale & Stocks Magasin
          </p>
          <div className="mt-2 text-[10px] bg-amber-900/40 text-amber-200 inline-block px-2.5 py-0.5 rounded-full font-mono">
            Casablanca · Maroc
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Identifiant
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nom d'utilisateur"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden transition-all text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden transition-all text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Environment Indicator without exposed credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Accès sécurisé · Authentification protégée</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
