'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type AuthFormProps = {
  mode: 'login' | 'register';
};

const MIN_PASSWORD_LENGTH = 8;

export const AuthForm: React.FC<AuthFormProps> = ({ mode }) => {
  const router = useRouter();
  const isRegister = mode === 'register';

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (isRegister && password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError('No se pudo crear la cuenta. Verifica los datos e inténtalo de nuevo.');
          return;
        }

        if (!data.session) {
          setInfo('Cuenta creada. Revisa tu correo para confirmar tu cuenta.');
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError('Correo o contraseña incorrectos.');
          return;
        }
      }

      router.replace('/');
      router.refresh();
    } catch {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Ticket Fútbol</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isRegister ? 'Crea tu cuenta' : 'Inicia sesión para continuar'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre (opcional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  maxLength={60}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-sm text-green-700">
                {info}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Procesando...' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          <Link
            href={isRegister ? '/login' : '/register'}
            className="font-medium text-primary-600 hover:underline"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </Link>
        </p>

        <p className="mt-6 text-center text-xs text-gray-500">
          Esta app no se conecta con casas de apuestas ni solicita sus credenciales.
        </p>
      </div>
    </main>
  );
};
