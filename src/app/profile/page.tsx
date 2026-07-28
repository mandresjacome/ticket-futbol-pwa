'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  User,
  Bell,
  Moon,
  Globe,
  Info,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function ProfilePage() {
  const [notifications, setNotifications] = useState({
    matchStarting: true,
    selectionAchieved: true,
    selectionLost: true,
    ticketWon: true,
    ticketLost: false,
  });

  return (
    <main>
      <Header title="Perfil" subtitle="Configuración de tu cuenta" />

      <div className="p-4">
        {/* Información del usuario */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Usuario Demo
              </h2>
              <p className="text-sm text-gray-600">demo@ticketfutbol.com</p>
            </div>
          </div>
        </Card>

        {/* Notificaciones */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Notificaciones
          </h3>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">
                      Partido iniciando
                    </div>
                    <div className="text-xs text-gray-600">
                      Cuando un partido está por comenzar
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.matchStarting}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        matchStarting: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">
                      Selección cumplida
                    </div>
                    <div className="text-xs text-gray-600">
                      Cuando una selección alcanza su objetivo
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.selectionAchieved}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        selectionAchieved: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="text-gray-400" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">
                      Ticket ganado
                    </div>
                    <div className="text-xs text-gray-600">
                      Cuando ganas un ticket completo
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.ticketWon}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        ticketWon: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Apariencia y configuración */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Preferencias
          </h3>
          <Card>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <Moon className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">Tema</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Claro</span>
                  <ChevronRight className="text-gray-400" size={18} />
                </div>
              </button>

              <button className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded transition-colors">
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

        {/* Información */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Información
          </h3>
          <Card>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <Info className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">
                    Acerca de la app
                  </span>
                </div>
                <ChevronRight className="text-gray-400" size={18} />
              </button>

              <button className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">Privacidad</span>
                </div>
                <ChevronRight className="text-gray-400" size={18} />
              </button>
            </div>
          </Card>
        </div>

        {/* Cerrar sesión */}
        <Button
          variant="outline"
          fullWidth
          onClick={() => alert('Función de cierre de sesión en desarrollo')}
        >
          <LogOut className="mr-2" size={20} />
          Cerrar sesión
        </Button>

        {/* Versión */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">Versión 0.1.0 (MVP)</p>
          <p className="text-xs text-gray-400 mt-1">
            Ticket Fútbol PWA © 2026
          </p>
        </div>
      </div>
    </main>
  );
}
