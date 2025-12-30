import { InstaQLEntity } from '@instantdb/react';
import { AppSchema } from '../../instant.schema';

// Entity types from schema
export type Profile = InstaQLEntity<AppSchema, 'profiles'>;
export type CycleConfig = InstaQLEntity<AppSchema, 'cycleConfigs'>;
export type Exercise = InstaQLEntity<AppSchema, 'exercises'>;
export type Routine = InstaQLEntity<AppSchema, 'routines'>;
export type RoutineExercise = InstaQLEntity<AppSchema, 'routineExercises'>;
export type WorkoutSession = InstaQLEntity<AppSchema, 'workoutSessions'>;
export type WorkoutExercise = InstaQLEntity<AppSchema, 'workoutExercises'>;
export type WorkoutSet = InstaQLEntity<AppSchema, 'workoutSets'>;
export type PersonalRecord = InstaQLEntity<AppSchema, 'personalRecords'>;

// Cycle phases
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const CYCLE_PHASES: Record<CyclePhase, {
  name: string;
  color: string;
  days: [number, number];
  recommendation: string;
  intensity: 'low' | 'high' | 'moderate';
}> = {
  menstrual: {
    name: 'Fase Menstrual',
    color: '#c9285a',
    days: [1, 5],
    recommendation: 'Entrenamientos ligeros, movilidad, yoga. Escucha a tu cuerpo.',
    intensity: 'low',
  },
  follicular: {
    name: 'Fase Folicular',
    color: '#16a34a',
    days: [6, 14],
    recommendation: '¡Mejor momento para intensidad alta! Busca PRs y trabaja fuerza máxima.',
    intensity: 'high',
  },
  ovulation: {
    name: 'Ovulación',
    color: '#f59e0b',
    days: [14, 16],
    recommendation: 'Alta energía pero mayor riesgo de lesiones. Cuidado con movimientos explosivos.',
    intensity: 'moderate',
  },
  luteal: {
    name: 'Fase Lútea',
    color: '#8b5cf6',
    days: [17, 28],
    recommendation: 'Resistencia moderada, más descanso. Tu metabolismo está más alto.',
    intensity: 'moderate',
  },
};

// Calculate cycle day and phase
export function getCycleInfo(lastPeriodStart: string, cycleLength: number = 28): {
  day: number;
  phase: CyclePhase;
} {
  const start = new Date(lastPeriodStart);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const cycleDay = (diffDays % cycleLength) + 1;

  let phase: CyclePhase = 'follicular';
  if (cycleDay >= 1 && cycleDay <= 5) {
    phase = 'menstrual';
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    phase = 'follicular';
  } else if (cycleDay >= 14 && cycleDay <= 16) {
    phase = 'ovulation';
  } else {
    phase = 'luteal';
  }

  return { day: cycleDay, phase };
}

// Muscle groups
export const MUSCLE_GROUPS = [
  { value: 'chest', label: 'Pecho', emoji: '🫁' },
  { value: 'back', label: 'Espalda', emoji: '🔙' },
  { value: 'shoulders', label: 'Hombros', emoji: '💪' },
  { value: 'biceps', label: 'Bíceps', emoji: '💪' },
  { value: 'triceps', label: 'Tríceps', emoji: '💪' },
  { value: 'quadriceps', label: 'Cuádriceps', emoji: '🦵' },
  { value: 'hamstrings', label: 'Isquiotibiales', emoji: '🦵' },
  { value: 'glutes', label: 'Glúteos', emoji: '🍑' },
  { value: 'calves', label: 'Pantorrillas', emoji: '🦵' },
  { value: 'core', label: 'Core', emoji: '🎯' },
  { value: 'cardio', label: 'Cardio', emoji: '❤️' },
  { value: 'full_body', label: 'Cuerpo Completo', emoji: '🏋️' },
] as const;

// Default exercises library
export const DEFAULT_EXERCISES = [
  // Chest
  { name: 'Press de Banca', muscleGroup: 'chest', equipment: 'Barra' },
  { name: 'Press de Banca Inclinado', muscleGroup: 'chest', equipment: 'Barra' },
  { name: 'Press con Mancuernas', muscleGroup: 'chest', equipment: 'Mancuernas' },
  { name: 'Aperturas con Mancuernas', muscleGroup: 'chest', equipment: 'Mancuernas' },
  { name: 'Fondos en Paralelas', muscleGroup: 'chest', equipment: 'Peso Corporal' },
  { name: 'Cruces en Polea', muscleGroup: 'chest', equipment: 'Polea' },
  
  // Back
  { name: 'Dominadas', muscleGroup: 'back', equipment: 'Peso Corporal' },
  { name: 'Remo con Barra', muscleGroup: 'back', equipment: 'Barra' },
  { name: 'Remo con Mancuerna', muscleGroup: 'back', equipment: 'Mancuernas' },
  { name: 'Jalón al Pecho', muscleGroup: 'back', equipment: 'Polea' },
  { name: 'Peso Muerto', muscleGroup: 'back', equipment: 'Barra' },
  { name: 'Remo en Polea Baja', muscleGroup: 'back', equipment: 'Polea' },
  
  // Shoulders
  { name: 'Press Militar', muscleGroup: 'shoulders', equipment: 'Barra' },
  { name: 'Press de Hombros con Mancuernas', muscleGroup: 'shoulders', equipment: 'Mancuernas' },
  { name: 'Elevaciones Laterales', muscleGroup: 'shoulders', equipment: 'Mancuernas' },
  { name: 'Elevaciones Frontales', muscleGroup: 'shoulders', equipment: 'Mancuernas' },
  { name: 'Pájaros', muscleGroup: 'shoulders', equipment: 'Mancuernas' },
  { name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'Polea' },
  
  // Biceps
  { name: 'Curl con Barra', muscleGroup: 'biceps', equipment: 'Barra' },
  { name: 'Curl con Mancuernas', muscleGroup: 'biceps', equipment: 'Mancuernas' },
  { name: 'Curl Martillo', muscleGroup: 'biceps', equipment: 'Mancuernas' },
  { name: 'Curl en Predicador', muscleGroup: 'biceps', equipment: 'Barra EZ' },
  { name: 'Curl en Polea', muscleGroup: 'biceps', equipment: 'Polea' },
  
  // Triceps
  { name: 'Fondos en Banco', muscleGroup: 'triceps', equipment: 'Peso Corporal' },
  { name: 'Press Francés', muscleGroup: 'triceps', equipment: 'Barra EZ' },
  { name: 'Extensiones en Polea', muscleGroup: 'triceps', equipment: 'Polea' },
  { name: 'Patada de Tríceps', muscleGroup: 'triceps', equipment: 'Mancuernas' },
  { name: 'Press Cerrado', muscleGroup: 'triceps', equipment: 'Barra' },
  
  // Quadriceps
  { name: 'Sentadilla', muscleGroup: 'quadriceps', equipment: 'Barra' },
  { name: 'Prensa de Piernas', muscleGroup: 'quadriceps', equipment: 'Máquina' },
  { name: 'Extensión de Cuádriceps', muscleGroup: 'quadriceps', equipment: 'Máquina' },
  { name: 'Sentadilla Búlgara', muscleGroup: 'quadriceps', equipment: 'Mancuernas' },
  { name: 'Sentadilla Frontal', muscleGroup: 'quadriceps', equipment: 'Barra' },
  { name: 'Zancadas', muscleGroup: 'quadriceps', equipment: 'Mancuernas' },
  
  // Hamstrings
  { name: 'Peso Muerto Rumano', muscleGroup: 'hamstrings', equipment: 'Barra' },
  { name: 'Curl Femoral Tumbado', muscleGroup: 'hamstrings', equipment: 'Máquina' },
  { name: 'Curl Femoral Sentado', muscleGroup: 'hamstrings', equipment: 'Máquina' },
  { name: 'Buenos Días', muscleGroup: 'hamstrings', equipment: 'Barra' },
  
  // Glutes
  { name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'Barra' },
  { name: 'Puente de Glúteos', muscleGroup: 'glutes', equipment: 'Peso Corporal' },
  { name: 'Patada de Glúteo', muscleGroup: 'glutes', equipment: 'Polea' },
  { name: 'Abducción de Cadera', muscleGroup: 'glutes', equipment: 'Máquina' },
  
  // Calves
  { name: 'Elevación de Talones de Pie', muscleGroup: 'calves', equipment: 'Máquina' },
  { name: 'Elevación de Talones Sentado', muscleGroup: 'calves', equipment: 'Máquina' },
  
  // Core
  { name: 'Plancha', muscleGroup: 'core', equipment: 'Peso Corporal' },
  { name: 'Crunch', muscleGroup: 'core', equipment: 'Peso Corporal' },
  { name: 'Russian Twist', muscleGroup: 'core', equipment: 'Peso Corporal' },
  { name: 'Elevación de Piernas', muscleGroup: 'core', equipment: 'Peso Corporal' },
  { name: 'Ab Wheel', muscleGroup: 'core', equipment: 'Rueda Abdominal' },
  { name: 'Woodchop', muscleGroup: 'core', equipment: 'Polea' },
  
  // Cardio
  { name: 'Cinta de Correr', muscleGroup: 'cardio', equipment: 'Máquina' },
  { name: 'Bicicleta Estática', muscleGroup: 'cardio', equipment: 'Máquina' },
  { name: 'Elíptica', muscleGroup: 'cardio', equipment: 'Máquina' },
  { name: 'Remo', muscleGroup: 'cardio', equipment: 'Máquina' },
  { name: 'Saltar Cuerda', muscleGroup: 'cardio', equipment: 'Cuerda' },
];

// Calculate estimated 1RM using Epley formula
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Calculate total volume
export function calculateVolume(sets: Array<{ weight: number; reps: number }>): number {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0);
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// Format duration
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Format timer (seconds to mm:ss)
export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Weight conversion
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
