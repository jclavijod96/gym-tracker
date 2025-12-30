'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, Input, Modal, EmptyState } from './ui';
import { MUSCLE_GROUPS } from '@/lib/utils';
import { Plus, Edit2, Trash2, Dumbbell, Search, GripVertical } from 'lucide-react';

interface RoutinesViewProps {
  userId: string;
  routines: any[];
  exercises: any[];
}

export function RoutinesView({ userId, routines, exercises }: RoutinesViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any | null>(null);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Array<{
    exerciseId: string;
    targetSets: number;
    targetReps: string;
    restSeconds: number;
  }>>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  const resetForm = () => {
    setRoutineName('');
    setRoutineDescription('');
    setSelectedExercises([]);
    setEditingRoutine(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (routine: any) => {
    setEditingRoutine(routine);
    setRoutineName(routine.name);
    setRoutineDescription(routine.description || '');
    setSelectedExercises(
      routine.exercises?.map((e: any) => ({
        exerciseId: e.exercise?.[0]?.id,
        targetSets: e.targetSets || 3,
        targetReps: e.targetReps || '8-12',
        restSeconds: e.restSeconds || 90,
      })) || []
    );
    setShowCreateModal(true);
  };

  const addExerciseToRoutine = (exercise: any) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        targetSets: 3,
        targetReps: '8-12',
        restSeconds: 90,
      },
    ]);
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const removeExerciseFromRoutine = (index: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExerciseInRoutine = (index: number, field: string, value: string | number) => {
    setSelectedExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) return;

    try {
      const transactions = [];

      if (editingRoutine) {
        // Update existing routine
        transactions.push(
          db.tx.routines[editingRoutine.id].update({
            name: routineName,
            description: routineDescription || undefined,
            updatedAt: Date.now(),
          })
        );

        // Delete old exercises
        for (const exercise of editingRoutine.exercises || []) {
          transactions.push(db.tx.routineExercises[exercise.id].delete());
        }
      } else {
        // Create new routine
        const routineId = id();
        transactions.push(
          db.tx.routines[routineId].update({
            name: routineName,
            description: routineDescription || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }).link({ owner: userId })
        );
      }

      // Create new exercises
      const routineId = editingRoutine?.id || id();
      for (let i = 0; i < selectedExercises.length; i++) {
        const exerciseConfig = selectedExercises[i];
        const routineExerciseId = id();
        transactions.push(
          db.tx.routineExercises[routineExerciseId].update({
            order: i,
            targetSets: exerciseConfig.targetSets,
            targetReps: exerciseConfig.targetReps,
            restSeconds: exerciseConfig.restSeconds,
          }).link({ routine: routineId, exercise: exerciseConfig.exerciseId })
        );
      }

      await db.transact(transactions);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Error al guardar la rutina');
    }
  };

  const deleteRoutine = async (routineId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta rutina?')) return;

    try {
      await db.transact(db.tx.routines[routineId].delete());
    } catch (error) {
      console.error('Error deleting routine:', error);
      alert('Error al eliminar la rutina');
    }
  };

  const getExerciseById = (exerciseId: string) => {
    return exercises.find((e) => e.id === exerciseId);
  };

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = !selectedMuscleGroup || e.muscleGroup === selectedMuscleGroup;
    const notAlreadyAdded = !selectedExercises.some((se) => se.exerciseId === e.id);
    return matchesSearch && matchesMuscle && notAlreadyAdded;
  });

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rutinas</h1>
          <p className="text-gray-500 dark:text-gray-400">Crea plantillas para tus entrenamientos</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-5 h-5 mr-1" />
          Nueva
        </Button>
      </div>

      {routines.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-8 h-8" />}
          title="Sin rutinas"
          description="Las rutinas te ayudan a empezar entrenamientos más rápido con tus ejercicios favoritos."
          action={
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1" />
              Crear primera rutina
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <Card key={routine.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-burgundy-100 dark:bg-burgundy-900 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-6 h-6 text-burgundy-600 dark:text-burgundy-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{routine.name}</div>
                  {routine.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{routine.description}</p>
                  )}
                  <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {routine.exercises?.length || 0} ejercicios
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(routine)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title={editingRoutine ? 'Editar rutina' : 'Nueva rutina'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Push Day, Piernas..."
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Ej: Enfocado en pecho y tríceps"
            value={routineDescription}
            onChange={(e) => setRoutineDescription(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ejercicios ({selectedExercises.length})
            </label>
            
            <div className="space-y-2 mb-3">
              {selectedExercises.map((config, index) => {
                const exercise = getExerciseById(config.exerciseId);
                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-gray-50 flex items-center gap-3"
                  >
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {exercise?.name || 'Ejercicio'}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="number"
                          value={config.targetSets}
                          onChange={(e) => updateExerciseInRoutine(index, 'targetSets', parseInt(e.target.value))}
                          className="w-12 px-2 py-1 rounded border border-gray-200 text-xs text-center"
                          min={1}
                        />
                        <span className="text-xs text-gray-400">x</span>
                        <input
                          type="text"
                          value={config.targetReps}
                          onChange={(e) => updateExerciseInRoutine(index, 'targetReps', e.target.value)}
                          className="w-16 px-2 py-1 rounded border border-gray-200 text-xs text-center"
                          placeholder="8-12"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeExerciseFromRoutine(index)}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowExercisePicker(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Añadir ejercicio
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={saveRoutine}
              disabled={!routineName.trim()}
            >
              {editingRoutine ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exercise Picker Modal */}
      <Modal
        isOpen={showExercisePicker}
        onClose={() => { setShowExercisePicker(false); setSearchQuery(''); }}
        title="Añadir ejercicio"
      >
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200"
            autoFocus
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-2 px-2">
          <button
            onClick={() => setSelectedMuscleGroup(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              !selectedMuscleGroup ? 'bg-jaguar-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Todos
          </button>
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group.value}
              onClick={() => setSelectedMuscleGroup(group.value)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                selectedMuscleGroup === group.value ? 'bg-jaguar-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {group.emoji} {group.label}
            </button>
          ))}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => addExerciseToRoutine(exercise)}
              className="w-full p-3 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center gap-3 text-left"
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
