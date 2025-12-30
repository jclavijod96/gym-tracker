'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, Button, Input, Select, Modal } from './ui';
import { getCycleInfo, CYCLE_PHASES } from '@/lib/utils';
import { User, Settings, LogOut, Moon, Sun, Bell, ChevronRight, Heart, Scale, Ruler, Target } from 'lucide-react';

interface ProfileViewProps {
  user: { id: string; email: string };
  profile: any;
  cycleConfig: any;
}

export function ProfileView({ user, profile, cycleConfig }: ProfileViewProps) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCycle, setShowEditCycle] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  
  // Edit form state
  const [name, setName] = useState(profile?.name || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [experienceLevel, setExperienceLevel] = useState(profile?.experienceLevel || 'beginner');
  const [goal, setGoal] = useState(profile?.goal || 'general');
  
  // Cycle form state
  const [trackCycle, setTrackCycle] = useState(cycleConfig?.trackingEnabled || false);
  const [lastPeriodStart, setLastPeriodStart] = useState(cycleConfig?.lastPeriodStart || '');
  const [cycleLength, setCycleLength] = useState(cycleConfig?.averageCycleLength?.toString() || '28');

  const cycleInfo = cycleConfig?.trackingEnabled && cycleConfig?.lastPeriodStart
    ? getCycleInfo(cycleConfig.lastPeriodStart, cycleConfig.averageCycleLength)
    : null;

  const handleSignOut = async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      await db.auth.signOut();
    }
  };

  const saveProfile = async () => {
    try {
      await db.transact(
        db.tx.profiles[profile.id].update({
          name,
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
          experienceLevel,
          goal,
          updatedAt: Date.now(),
        })
      );
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    }
  };

  const saveCycleConfig = async () => {
    try {
      if (cycleConfig) {
        await db.transact(
          db.tx.cycleConfigs[cycleConfig.id].update({
            trackingEnabled: trackCycle,
            lastPeriodStart: lastPeriodStart || undefined,
            averageCycleLength: parseInt(cycleLength) || 28,
            updatedAt: Date.now(),
          })
        );
      }
      setShowEditCycle(false);
    } catch (error) {
      console.error('Error updating cycle config:', error);
      alert('Error al actualizar la configuración');
    }
  };

  const goalLabels: Record<string, string> = {
    hypertrophy: 'Ganar músculo',
    strength: 'Ganar fuerza',
    endurance: 'Resistencia',
    fat_loss: 'Perder grasa',
    general: 'Salud general',
  };

  const levelLabels: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-500">{user.email}</p>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full gradient-jaguar flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {(profile?.name?.[0] || user.email[0]).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'Usuario'}</h2>
              <p className="text-gray-500">{levelLabels[profile?.experienceLevel] || 'Principiante'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowEditProfile(true)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {profile?.weight && (
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <Scale className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <div className="font-bold text-gray-900">{profile.weight}</div>
                <div className="text-xs text-gray-500">kg</div>
              </div>
            )}
            {profile?.height && (
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <Ruler className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <div className="font-bold text-gray-900">{profile.height}</div>
                <div className="text-xs text-gray-500">cm</div>
              </div>
            )}
            {profile?.goal && (
              <div className="text-center p-3 rounded-xl bg-gray-50">
                <Target className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <div className="font-bold text-gray-900 text-sm">{goalLabels[profile.goal]}</div>
                <div className="text-xs text-gray-500">objetivo</div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Cycle Tracking Card */}
      {profile?.biologicalSex === 'female' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-burgundy-500" />
                <h3 className="font-semibold text-gray-900">Ciclo menstrual</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowEditCycle(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {cycleInfo ? (
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: CYCLE_PHASES[cycleInfo.phase].color }}
                >
                  {cycleInfo.day}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{CYCLE_PHASES[cycleInfo.phase].name}</div>
                  <div className="text-sm text-gray-500">Día {cycleInfo.day} del ciclo</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Activa el seguimiento para obtener recomendaciones personalizadas.
              </p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Settings */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900">Notificaciones</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-gray-900 dark:text-gray-100">Tema oscuro</span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-jaguar-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
            </div>
          </button>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50" onClick={handleSignOut}>
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </Button>
      </motion.div>

      {/* Edit Profile Modal */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Editar perfil">
        <div className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Peso (kg)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input label="Altura (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <Select
            label="Nivel de experiencia"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            options={[
              { value: 'beginner', label: 'Principiante' },
              { value: 'intermediate', label: 'Intermedio' },
              { value: 'advanced', label: 'Avanzado' },
            ]}
          />
          <Select
            label="Objetivo"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            options={[
              { value: 'hypertrophy', label: 'Ganar músculo' },
              { value: 'strength', label: 'Ganar fuerza' },
              { value: 'endurance', label: 'Resistencia' },
              { value: 'fat_loss', label: 'Perder grasa' },
              { value: 'general', label: 'Salud general' },
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditProfile(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveProfile}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Cycle Modal */}
      <Modal isOpen={showEditCycle} onClose={() => setShowEditCycle(false)} title="Seguimiento del ciclo">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setTrackCycle(!trackCycle)}
            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
              trackCycle ? 'border-burgundy-500 bg-burgundy-50' : 'border-gray-200'
            }`}
          >
            <span className="font-medium">Activar seguimiento</span>
            <div className={`w-12 h-6 rounded-full transition-colors ${trackCycle ? 'bg-burgundy-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${trackCycle ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
            </div>
          </button>

          {trackCycle && (
            <>
              <Input
                label="Fecha del último período"
                type="date"
                value={lastPeriodStart}
                onChange={(e) => setLastPeriodStart(e.target.value)}
              />
              <Input
                label="Duración del ciclo (días)"
                type="number"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
              />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditCycle(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={saveCycleConfig}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
