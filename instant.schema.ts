import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    
    // User Profile with personal data for training customization
    profiles: i.entity({
      name: i.string(),
      birthDate: i.string().optional(),
      biologicalSex: i.string().optional(), // 'male' | 'female' | 'prefer_not_to_say'
      weight: i.number().optional(), // in kg
      height: i.number().optional(), // in cm
      experienceLevel: i.string().optional(), // 'beginner' | 'intermediate' | 'advanced'
      goal: i.string().optional(), // 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general'
      injuries: i.string().optional(),
      unitSystem: i.string().optional(), // 'metric' | 'imperial'
      createdAt: i.date(),
      updatedAt: i.date(),
    }),

    // Menstrual cycle configuration (for female users)
    cycleConfigs: i.entity({
      averageCycleLength: i.number(), // default 28
      lastPeriodStart: i.string(), // ISO date string
      trackingEnabled: i.boolean(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),

    // Exercise library (both predefined and custom)
    exercises: i.entity({
      name: i.string(),
      muscleGroup: i.string(), // 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'cardio' | 'full_body'
      equipment: i.string().optional(),
      isCustom: i.boolean(),
      description: i.string().optional(),
      createdAt: i.date(),
    }),

    // Workout routines/templates
    routines: i.entity({
      name: i.string(),
      description: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),

    // Exercise template within a routine
    routineExercises: i.entity({
      order: i.number(),
      targetSets: i.number(),
      targetReps: i.string(), // e.g., "8-12"
      restSeconds: i.number().optional(),
      notes: i.string().optional(),
    }),

    // Actual workout session
    workoutSessions: i.entity({
      date: i.string(), // ISO date
      startTime: i.string().optional(), // ISO datetime
      endTime: i.string().optional(), // ISO datetime
      durationMinutes: i.number().optional(),
      notes: i.string().optional(),
      cycleDay: i.number().optional(),
      cyclePhase: i.string().optional(), // 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
      completed: i.boolean(),
      createdAt: i.date(),
    }),

    // Exercise performed in a session
    workoutExercises: i.entity({
      order: i.number(),
      notes: i.string().optional(),
    }),

    // Individual set within an exercise
    workoutSets: i.entity({
      setNumber: i.number(),
      weight: i.number(), // in kg or lbs depending on user preference
      reps: i.number(),
      rir: i.number().optional(), // Reps In Reserve (0-5)
      setType: i.string(), // 'warmup' | 'working' | 'dropset' | 'failure'
      notes: i.string().optional(),
      completedAt: i.date().optional(),
    }),

    // Personal Records tracking
    personalRecords: i.entity({
      weight: i.number(),
      reps: i.number(),
      estimated1RM: i.number(),
      date: i.string(),
      createdAt: i.date(),
    }),
  },

  links: {
    // Profile belongs to user
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },

    // Cycle config belongs to profile
    cycleProfile: {
      forward: { on: 'cycleConfigs', has: 'one', label: 'profile' },
      reverse: { on: 'profiles', has: 'one', label: 'cycleConfig' },
    },

    // Custom exercise belongs to user
    exerciseCreator: {
      forward: { on: 'exercises', has: 'one', label: 'creator' },
      reverse: { on: '$users', has: 'many', label: 'customExercises' },
    },

    // Routine belongs to user
    routineOwner: {
      forward: { on: 'routines', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'routines' },
    },

    // Routine exercise belongs to routine
    routineExerciseRoutine: {
      forward: { on: 'routineExercises', has: 'one', label: 'routine' },
      reverse: { on: 'routines', has: 'many', label: 'exercises' },
    },

    // Routine exercise references an exercise
    routineExerciseExercise: {
      forward: { on: 'routineExercises', has: 'one', label: 'exercise' },
      reverse: { on: 'exercises', has: 'many', label: 'routineExercises' },
    },

    // Workout session belongs to user
    sessionOwner: {
      forward: { on: 'workoutSessions', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'workoutSessions' },
    },

    // Workout session can be based on a routine (optional)
    sessionRoutine: {
      forward: { on: 'workoutSessions', has: 'one', label: 'routine' },
      reverse: { on: 'routines', has: 'many', label: 'sessions' },
    },

    // Workout exercise belongs to session
    workoutExerciseSession: {
      forward: { on: 'workoutExercises', has: 'one', label: 'session' },
      reverse: { on: 'workoutSessions', has: 'many', label: 'exercises' },
    },

    // Workout exercise references an exercise
    workoutExerciseExercise: {
      forward: { on: 'workoutExercises', has: 'one', label: 'exercise' },
      reverse: { on: 'exercises', has: 'many', label: 'workoutExercises' },
    },

    // Sets belong to workout exercise
    setWorkoutExercise: {
      forward: { on: 'workoutSets', has: 'one', label: 'workoutExercise' },
      reverse: { on: 'workoutExercises', has: 'many', label: 'sets' },
    },

    // Personal record belongs to user
    prOwner: {
      forward: { on: 'personalRecords', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'personalRecords' },
    },

    // Personal record is for an exercise
    prExercise: {
      forward: { on: 'personalRecords', has: 'one', label: 'exercise' },
      reverse: { on: 'exercises', has: 'many', label: 'personalRecords' },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
