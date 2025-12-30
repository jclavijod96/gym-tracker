'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { Card, Badge, Button, EmptyState, TabBarItem } from './ui';
import { getCycleInfo, CYCLE_PHASES, formatDate, calculate1RM, calculateVolume } from '@/lib/utils';
import { WorkoutView } from './WorkoutView';
import { RoutinesView } from './RoutinesView';
import { ProgressView } from './ProgressView';
import { ProfileView } from './ProfileView';
import { Home, Dumbbell, TrendingUp, User, Plus, Calendar, Trophy, Flame, Clock } from 'lucide-react';

type Tab = 'home' | 'workout' | 'progress' | 'profile';

interface DashboardProps {
  user: { id: string; email: string };
}

export function Dashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Query user profile
  const { data: profileData } = db.useQuery({
    profiles: {
      $: { where: { 'user.id': user.id } },
      cycleConfig: {},
    },
  });

  // Query recent workouts
  const { data: workoutsData } = db.useQuery({
    workoutSessions: {
      $: { where: { 'owner.id': user.id }, order: { serverCreatedAt: 'desc' }, limit: 10 },
      exercises: { exercise: {}, sets: {} },
    },
  });

  // Query exercises for workout
  const { data: exercisesData } = db.useQuery({
    exercises: {},
  });

  // Query routines
  const { data: routinesData } = db.useQuery({
    routines: {
      $: { where: { 'owner.id': user.id } },
      exercises: { exercise: {} },
    },
  });

  const profile = profileData?.profiles?.[0] as any;
  const cycleConfig = profile?.cycleConfig as any;
  const workouts = (workoutsData?.workoutSessions || []) as any[];
  const exercises = (exercisesData?.exercises || []) as any[];
  const routines = (routinesData?.routines || []) as any[];

  // Calculate cycle info if tracking enabled
  const cycleInfo = cycleConfig?.trackingEnabled && cycleConfig?.lastPeriodStart
    ? getCycleInfo(cycleConfig.lastPeriodStart, cycleConfig.averageCycleLength)
    : null;

  // Calculate stats
  const thisWeekWorkouts = workouts.filter((w) => {
    const workoutDate = new Date(w.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return workoutDate >= weekAgo;
  });

  const totalVolume = workouts.slice(0, 5).reduce((acc: number, w: any) => {
    const sets = w.exercises?.flatMap((e: any) => e.sets || []) || [];
    return acc + calculateVolume(sets.map((s: any) => ({ weight: s.weight || 0, reps: s.reps || 0 })));
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Main Content */}
      {activeTab === 'home' && (
        <HomeTab
          profile={profile}
          cycleInfo={cycleInfo}
          workouts={workouts}
          thisWeekWorkouts={thisWeekWorkouts}
          totalVolume={totalVolume}
          onStartWorkout={() => setActiveTab('workout')}
          onViewProgress={() => setActiveTab('progress')}
        />
      )}

      {activeTab === 'workout' && (
        <WorkoutView
          userId={user.id}
          exercises={exercises}
          routines={routines}
          onClose={() => setActiveTab('home')}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressView
          userId={user.id}
          workouts={workouts}
          exercises={exercises}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileView
          user={user}
          profile={profile}
          cycleConfig={cycleConfig}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 safe-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          <TabBarItem
            icon={<Home className="w-6 h-6" />}
            label="Inicio"
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <TabBarItem
            icon={<Dumbbell className="w-6 h-6" />}
            label="Entrenar"
            active={activeTab === 'workout'}
            onClick={() => setActiveTab('workout')}
          />
          <TabBarItem
            icon={<TrendingUp className="w-6 h-6" />}
            label="Progreso"
            active={activeTab === 'progress'}
            onClick={() => setActiveTab('progress')}
          />
          <TabBarItem
            icon={<User className="w-6 h-6" />}
            label="Perfil"
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </nav>
    </div>
  );
}

interface HomeTabProps {
  profile: any;
  cycleInfo: { day: number; phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' } | null;
  workouts: any[];
  thisWeekWorkouts: any[];
  totalVolume: number;
  onStartWorkout: () => void;
  onViewProgress: () => void;
}

function HomeTab({ profile, cycleInfo, workouts, thisWeekWorkouts, totalVolume, onStartWorkout, onViewProgress }: HomeTabProps) {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <p className="text-gray-500">{greeting()}</p>
        <h1 className="text-2xl font-bold text-gray-900">
          {profile?.name || 'Atleta'} 💪
        </h1>
      </motion.div>

      {/* Cycle Info Banner */}
      {cycleInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 border-l-4" style={{ borderLeftColor: CYCLE_PHASES[cycleInfo.phase].color }}>
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: CYCLE_PHASES[cycleInfo.phase].color }}
              >
                {cycleInfo.day}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {CYCLE_PHASES[cycleInfo.phase].name}
                  </span>
                  <Badge
                    variant={
                      CYCLE_PHASES[cycleInfo.phase].intensity === 'high' ? 'success' :
                      CYCLE_PHASES[cycleInfo.phase].intensity === 'low' ? 'warning' : 'info'
                    }
                    size="sm"
                  >
                    {CYCLE_PHASES[cycleInfo.phase].intensity === 'high' ? '🔥 Alta intensidad' :
                     CYCLE_PHASES[cycleInfo.phase].intensity === 'low' ? '🧘 Baja intensidad' : '⚡ Moderada'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {CYCLE_PHASES[cycleInfo.phase].recommendation}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="p-3 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-jaguar-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-jaguar-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{thisWeekWorkouts.length}</div>
          <div className="text-xs text-gray-500">Esta semana</div>
        </Card>

        <Card className="p-3 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-burgundy-100 flex items-center justify-center">
            <Flame className="w-5 h-5 text-burgundy-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{workouts.length}</div>
          <div className="text-xs text-gray-500">Total</div>
        </Card>

        <Card className="p-3 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
          </div>
          <div className="text-xs text-gray-500">Volumen kg</div>
        </Card>
      </motion.div>

      {/* Start Workout CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card
          className="p-6 gradient-jaguar text-white cursor-pointer"
          hover
          onClick={onStartWorkout}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Comenzar entrenamiento</h3>
              <p className="text-white/80 text-sm">
                {cycleInfo?.phase === 'follicular' 
                  ? '¡Hoy es buen día para buscar PRs!' 
                  : 'Registra tu próxima sesión'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus className="w-8 h-8" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Workouts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Entrenamientos recientes</h2>
          <button onClick={onViewProgress} className="text-sm text-jaguar-600 dark:text-jaguar-400 font-medium hover:underline">Ver todos</button>
        </div>

        {workouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="w-8 h-8" />}
            title="Sin entrenamientos aún"
            description="Comienza tu primer entrenamiento para ver tu historial aquí."
          />
        ) : (
          <div className="space-y-2">
            {workouts.slice(0, 3).map((workout, index) => (
              <Card key={workout.id} className="p-4" hover>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {workout.exercises?.length || 0} ejercicios
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{formatDate(workout.date)}</span>
                      {workout.durationMinutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {workout.durationMinutes}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
