'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Header } from '@/components/layout/Header';
import { PushToggle } from '@/components/profile/PushToggle';
import { NotificationPreferences } from '@/components/profile/NotificationPreferences';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Moon, Globe, Info, Shield, LogOut, ChevronRight } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const displayName = user.user_metadata?.display_name;
      setUserInfo({
        name: typeof displayName === 'string' && displayName ? displayName : 'Usuario',
        email: user.email ?? '',
      });
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <main>
      <Header title="Perfil" subtitle="Configuración de tu cuenta" />

      <div className="p-4">
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <User className="text-primary-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{userInfo?.name ?? 'Cargando...'}</h2>
              <p className="text-sm text-gray-600">{userInfo?.email}</p>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Notificaciones</h3>
          <PushToggle />
          <NotificationPreferences />
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Preferencias</h3>
          <Card>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded py-2 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Moon className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">Tema</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Claro</span>
                  <ChevronRight className="text-gray-400" size={18} />
                </div>
              </button>

              <button className="flex w-full items-center justify-between rounded py-2 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Globe className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">Idioma</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Español</span>
                  <ChevronRight className="text-gray-400" size={18} />
                </div>
              </button>
            </div>
          </Card>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Información</h3>
          <Card>
            <div className="space-y-3">
              <button className="flex w-full items-center justify-between rounded py-2 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Info className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">Acerca de la app</span>
                </div>
                <ChevronRight className="text-gray-400" size={18} />
              </button>

              <button className="flex w-full items-center justify-between rounded py-2 transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Shield className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">Privacidad</span>
                </div>
                <ChevronRight className="text-gray-400" size={18} />
              </button>
            </div>
          </Card>
        </div>

        <Button variant="outline" fullWidth disabled={signingOut} onClick={handleSignOut}>
          <LogOut className="mr-2" size={20} />
          Cerrar sesión
        </Button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">Versión 0.1.0 (MVP)</p>
          <p className="mt-1 text-xs text-gray-400">Ticket Fútbol PWA © 2026</p>
        </div>
      </div>
    </main>
  );
}
