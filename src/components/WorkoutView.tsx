'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Modal, Badge, EmptyState } from './ui';
import { MUSCLE_GROUPS, formatTimer, calculate1RM } from '@/lib/utils';
import { Plus, X, Check, Clock, ChevronDown, ChevronUp, Trash2, Copy, Search, Dumbbell, Play, Pause, RotateCcw } from 'lucide-react';

interface WorkoutViewProps {
  userId: string;
  exercises: any[];
  routines: any[];
  onClose: () => void;
}

interface ActiveSet {
  id: string;
  weight: string;
  reps: string;
  setType: string;
  completed: boolean;
}

interface ActiveExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
  expanded: boolean;
}

export function WorkoutView({ userId, exercises, routines, onClose }: WorkoutViewProps) {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [defaultRestTime, setDefaultRestTime] = useState(90);

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Vibrate if supported
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer]);

  const startWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setActiveExercises([]);
  };

  const startRestTimer = () => {
    setRestTimer(defaultRestTime);
    setIsTimerRunning(true);
  };

  const addExercise = (exercise: any) => {
    const newExercise: ActiveExercise = {
      id: id(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [
        { id: id(), weight: '', reps: '', setType: 'working', completed: false },
      ],
      expanded: true,
    };
    setActiveExercises((prev) => [...prev, newExercise]);
    setShowExercisePicker(false);
    setSearchQuery('');
    setSelectedMuscleGroup(null);
  };

  const removeExercise = (exerciseId: string) => {
    setActiveExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  const toggleExerciseExpanded = (exerciseId: string) => {
    setActiveExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, expanded: !e.expanded } : e))
    );
  };

  const addSet = (exerciseId: string) => {
    setActiveExercises((prev) =>
      prev.map((e) => {
        if (e.id === exerciseId) {
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [
              ...e.sets,
              {
                id: id(),
                weight: lastSet?.weight || '',
                reps: lastSet?.reps || '',
                setType: 'working',
                completed: false,
              },
            ],
          };
        }
        return e;
      })
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setActiveExercises((prev) =>
      prev.map((e) => {
        if (e.id === exerciseId) {
          return { ...e, sets: e.sets.filter((s) => s.id !== setId) };
        }
        return e;
      })
    );
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof ActiveSet, value: string | boolean) => {
    setActiveExercises((prev) =>
      prev.map((e) => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
          };
        }
        return e;
      })
    );
  };

  const completeSet = (exerciseId: string, setId: string) => {
    updateSet(exerciseId, setId, 'completed', true);
    startRestTimer();
  };

  const finishWorkout = async () => {
    if (!workoutStartTime) return;

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - workoutStartTime.getTime()) / 60000);

    try {
      const sessionId = id();
      const transactions = [];

      // Create workout session
      transactions.push(
        db.tx.workoutSessions[sessionId].update({
          date: workoutStartTime.toISOString().split('T')[0],
          startTime: workoutStartTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMinutes,
          completed: true,
          createdAt: Date.now(),
        }).link({ owner: userId })
      );

      // Create workout exercises and sets
      for (let i = 0; i < activeExercises.length; i++) {
        const exercise = activeExercises[i];
        const workoutExerciseId = id();

        transactions.push(
          db.tx.workoutExercises[workoutExerciseId].update({
            order: i,
          }).link({ session: sessionId, exercise: exercise.exerciseId })
        );

        for (let j = 0; j < exercise.sets.length; j++) {
          const set = exercise.sets[j];
          if (set.completed && set.weight && set.reps) {
            const setId = id();
            transactions.push(
              db.tx.workoutSets[setId].update({
                setNumber: j + 1,
                weight: parseFloat(set.weight),
                reps: parseInt(set.reps),
                setType: set.setType,
                completedAt: Date.now(),
              }).link({ workoutExercise: workoutExerciseId })
            );
          }
        }
      }

      await db.transact(transactions);
      setIsWorkoutActive(false);
      setActiveExercises([]);
      setWorkoutStartTime(null);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error al guardar el entrenamiento');
    }
  };

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = !selectedMuscleGroup || e.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesMuscle;
  });

  // Not in active workout - show start screen
  if (!isWorkoutActive) {
    return (
      <div className="p-4 space-y-4">
        <div className="pt-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Entrenar</h1>
          <p className="text-gray-500">Comienza un nuevo entrenamiento</p>
        </div>

        {/* Quick Start */}
        <Card
          className="p-6 gradient-jaguar text-white cursor-pointer"
          hover
          onClick={startWorkout}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Entrenamiento libre</h3>
              <p className="text-white/80 text-sm">Añade ejercicios sobre la marcha</p>
            </div>
          </div>
        </Card>

        {/* Routines */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Mis rutinas</h2>
          {routines.length === 0 ? (
            <EmptyState
              icon={<Dumbbell className="w-8 h-8" />}
              title="Sin rutinas"
              description="Crea rutinas para empezar entrenamientos más rápido"
              action={<Button variant="outline" size="sm">Crear rutina</Button>}
            />
          ) : (
            <div className="space-y-2">
              {routines.map((routine) => (
                <Card key={routine.id} className="p-4" hover>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-burgundy-100 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-burgundy-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{routine.name}</div>
                      <div className="text-sm text-gray-500">
                        {routine.exercises?.length || 0} ejercicios
                      </div>
                    </div>
                    <Button size="sm" onClick={startWorkout}>
                      <Play className="w-4 h-4 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active workout view
  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entrenamiento activo</h1>
          <p className="text-sm text-gray-500">
            {workoutStartTime && `Iniciado ${workoutStartTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={finishWorkout}>
          <Check className="w-4 h-4 mr-1" />
          Finalizar
        </Button>
      </div>

      {/* Rest Timer */}
      {(isTimerRunning || restTimer > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className={`p-4 ${isTimerRunning ? 'bg-jaguar-50 border-jaguar-200' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isTimerRunning ? 'bg-jaguar-100' : 'bg-gray-200'}`}>
                  <Clock className={`w-6 h-6 ${isTimerRunning ? 'text-jaguar-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-gray-900">
                    {formatTimer(restTimer)}
                  </div>
                  <div className="text-sm text-gray-500">Descanso</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => { setRestTimer(defaultRestTime); setIsTimerRunning(true); }}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setRestTimer(0); setIsTimerRunning(false); }}
                  className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        <AnimatePresence>
          {activeExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden">
                {/* Exercise Header */}
                <button
                  onClick={() => toggleExerciseExpanded(exercise.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="text-lg">
                      {MUSCLE_GROUPS.find((m) => m.value === exercise.muscleGroup)?.emoji || '💪'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{exercise.exerciseName}</div>
                    <div className="text-sm text-gray-500">
                      {exercise.sets.filter((s) => s.completed).length}/{exercise.sets.length} series
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeExercise(exercise.id); }}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                    {exercise.expanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Sets */}
                {exercise.expanded && (
                  <div className="px-4 pb-4">
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 mb-2 px-2">
                      <div className="col-span-2">Serie</div>
                      <div className="col-span-4">Peso (kg)</div>
                      <div className="col-span-4">Reps</div>
                      <div className="col-span-2"></div>
                    </div>

                    {/* Sets */}
                    {exercise.sets.map((set, setIndex) => (
                      <div
                        key={set.id}
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg mb-2 ${
                          set.completed ? 'bg-jaguar-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className="col-span-2 text-center font-medium text-gray-700">
                          {setIndex + 1}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            placeholder="0"
                            value={set.weight}
                            onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-center font-mono"
                            disabled={set.completed}
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            placeholder="0"
                            value={set.reps}
                            onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-center font-mono"
                            disabled={set.completed}
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {set.completed ? (
                            <div className="w-8 h-8 rounded-full bg-jaguar-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <button
                              onClick={() => completeSet(exercise.id, set.id)}
                              disabled={!set.weight || !set.reps}
                              className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-jaguar-500 hover:bg-jaguar-50 flex items-center justify-center disabled:opacity-50"
                            >
                              <Check className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Set Button */}
                    <button
                      onClick={() => addSet(exercise.id)}
                      className="w-full py-2 text-sm text-jaguar-600 font-medium hover:bg-jaguar-50 rounded-lg flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Añadir serie
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Exercise Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowExercisePicker(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Añadir ejercicio
        </Button>
      </div>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => { setShowExercisePicker(false); setSearchQuery(''); setSelectedMuscleGroup(null); }}
        title="Añadir ejercicio"
      >
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-jaguar-500"
            autoFocus
          />
        </div>

        {/* Muscle Group Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-2 px-2">
          <button
            onClick={() => setSelectedMuscleGroup(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              !selectedMuscleGroup ? 'bg-jaguar-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todos
          </button>
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group.value}
              onClick={() => setSelectedMuscleGroup(group.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedMuscleGroup === group.value ? 'bg-jaguar-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {group.emoji} {group.label}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => addExercise(exercise)}
              className="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center gap-3 text-left transition-colors"
            >
              <span className="text-xl">
                {MUSCLE_GROUPS.find((m) => m.value === exercise.muscleGroup)?.emoji || '💪'}
              </span>
              <div>
                <div className="font-medium text-gray-900">{exercise.name}</div>
                {exercise.equipment && (
                  <div className="text-sm text-gray-500">{exercise.equipment}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
