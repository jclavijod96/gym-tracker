'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, Badge, EmptyState } from './ui';
import { calculate1RM, calculateVolume, formatDate, MUSCLE_GROUPS } from '@/lib/utils';
import { TrendingUp, TrendingDown, Trophy, Calendar, Flame, Dumbbell, Target } from 'lucide-react';

interface ProgressViewProps {
  userId: string;
  workouts: any[];
  exercises: any[];
}

export function ProgressView({ userId, workouts, exercises }: ProgressViewProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = workouts.filter((w) => new Date(w.date) >= weekAgo);
    const lastWeek = workouts.filter((w) => {
      const d = new Date(w.date);
      return d >= twoWeeksAgo && d < weekAgo;
    });
    const thisMonth = workouts.filter((w) => new Date(w.date) >= monthAgo);

    const calculateTotalVolume = (list: any[]) => {
      return list.reduce((total, w) => {
        const sets = w.exercises?.flatMap((e: any) => e.sets || []) || [];
        return total + calculateVolume(sets.map((s: any) => ({ weight: s.weight || 0, reps: s.reps || 0 })));
      }, 0);
    };

    const thisWeekVolume = calculateTotalVolume(thisWeek);
    const lastWeekVolume = calculateTotalVolume(lastWeek);
    const volumeChange = lastWeekVolume > 0 ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100) : 0;

    let streak = 0;
    const sorted = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sorted.some((w) => w.date === dateStr)) streak++;
        else if (streak > 0) break;
      }
    }

    const muscleGroupVolume: Record<string, number> = {};
    thisMonth.forEach((w) => {
      w.exercises?.forEach((we: any) => {
        const ex = we.exercise?.[0];
        if (ex?.muscleGroup) {
          const vol = calculateVolume((we.sets || []).map((s: any) => ({ weight: s.weight || 0, reps: s.reps || 0 })));
          muscleGroupVolume[ex.muscleGroup] = (muscleGroupVolume[ex.muscleGroup] || 0) + vol;
        }
      });
    });

    const exerciseStats: Record<string, { name: string; volume: number; max1RM: number }> = {};
    thisMonth.forEach((w) => {
      w.exercises?.forEach((we: any) => {
        const ex = we.exercise?.[0];
        if (ex) {
          if (!exerciseStats[ex.id]) {
            exerciseStats[ex.id] = { name: ex.name, volume: 0, max1RM: 0 };
          }
          (we.sets || []).forEach((s: any) => {
            if (s.weight && s.reps) {
              exerciseStats[ex.id].volume += s.weight * s.reps;
              const est1RM = calculate1RM(s.weight, s.reps);
              if (est1RM > exerciseStats[ex.id].max1RM) exerciseStats[ex.id].max1RM = est1RM;
            }
          });
        }
      });
    });

    const topExercises = Object.values(exerciseStats).sort((a, b) => b.volume - a.volume).slice(0, 5);

    return {
      thisWeekWorkouts: thisWeek.length,
      lastWeekWorkouts: lastWeek.length,
      thisMonthWorkouts: thisMonth.length,
      thisWeekVolume,
      lastWeekVolume,
      volumeChange,
      streak,
      muscleGroupVolume,
      topExercises,
      totalWorkouts: workouts.length,
    };
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="p-4 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Progreso</h1>
        <EmptyState
          icon={<TrendingUp className="w-8 h-8" />}
          title="Sin datos aún"
          description="Completa algunos entrenamientos para ver tus estadísticas."
        />
      </div>
    );
  }

  const maxMuscleVolume = Math.max(...Object.values(stats.muscleGroupVolume), 1);

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Progreso</h1>
        <p className="text-gray-500">Tus estadísticas de entrenamiento</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-jaguar-600" />
              <span className="text-sm text-gray-500">Esta semana</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.thisWeekWorkouts}</div>
            <div className="flex items-center gap-1 mt-1">
              {stats.thisWeekWorkouts >= stats.lastWeekWorkouts ? (
                <TrendingUp className="w-4 h-4 text-jaguar-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${stats.thisWeekWorkouts >= stats.lastWeekWorkouts ? 'text-jaguar-600' : 'text-red-500'}`}>
                vs {stats.lastWeekWorkouts} anterior
              </span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-burgundy-600" />
              <span className="text-sm text-gray-500">Racha</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.streak}</div>
            <div className="text-sm text-gray-500 mt-1">días consecutivos</div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-gray-500">Volumen semanal</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.thisWeekVolume > 1000 ? `${(stats.thisWeekVolume / 1000).toFixed(1)}k` : stats.thisWeekVolume}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {stats.volumeChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-jaguar-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${stats.volumeChange >= 0 ? 'text-jaguar-600' : 'text-red-500'}`}>
                {stats.volumeChange >= 0 ? '+' : ''}{stats.volumeChange}%
              </span>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-500 mt-1">entrenamientos</div>
          </Card>
        </motion.div>
      </div>

      {/* Muscle Group Distribution */}
      {Object.keys(stats.muscleGroupVolume).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Volumen por grupo muscular</h3>
            <div className="space-y-3">
              {Object.entries(stats.muscleGroupVolume)
                .sort((a, b) => b[1] - a[1])
                .map(([muscle, volume]) => {
                  const muscleInfo = MUSCLE_GROUPS.find((m) => m.value === muscle);
                  const percentage = (volume / maxMuscleVolume) * 100;
                  return (
                    <div key={muscle}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span>{muscleInfo?.emoji || '💪'}</span>
                          {muscleInfo?.label || muscle}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {volume > 1000 ? `${(volume / 1000).toFixed(1)}k` : volume} kg
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-jaguar-500 to-jaguar-600 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Top Exercises */}
      {stats.topExercises.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Top ejercicios (este mes)</h3>
            <div className="space-y-3">
              {stats.topExercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-200 text-gray-600' :
                    i === 2 ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{ex.name}</div>
                    <div className="text-xs text-gray-500">
                      Volumen: {ex.volume > 1000 ? `${(ex.volume / 1000).toFixed(1)}k` : ex.volume} kg
                    </div>
                  </div>
                  {ex.max1RM > 0 && (
                    <Badge variant="success" size="sm">
                      1RM: {ex.max1RM}kg
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
