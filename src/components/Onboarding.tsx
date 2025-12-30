'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { id } from '@instantdb/react';
import { Button, Input, Select, Card } from './ui';
import { DEFAULT_EXERCISES } from '@/lib/utils';

interface OnboardingProps {
  userId: string;
  userEmail: string;
}

type Step = 'welcome' | 'basics' | 'goals' | 'cycle' | 'complete';

export function Onboarding({ userId, userEmail }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [biologicalSex, setBiologicalSex] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [goal, setGoal] = useState('general');
  const [injuries, setInjuries] = useState('');
  const [trackCycle, setTrackCycle] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [cycleLength, setCycleLength] = useState('28');

  const handleComplete = async () => {
    setLoading(true);
    try {
      const profileId = id();
      const transactions = [];

      transactions.push(
        db.tx.profiles[profileId].update({
          name: name || userEmail.split('@')[0],
          birthDate: birthDate || undefined,
          biologicalSex: biologicalSex || undefined,
          weight: weight ? parseFloat(weight) : undefined,
          height: height ? parseFloat(height) : undefined,
          experienceLevel,
          goal,
          injuries: injuries || undefined,
          unitSystem: 'metric',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }).link({ user: userId })
      );

      if (biologicalSex === 'female' && trackCycle && lastPeriodStart) {
        const cycleConfigId = id();
        transactions.push(
          db.tx.cycleConfigs[cycleConfigId].update({
            averageCycleLength: parseInt(cycleLength) || 28,
            lastPeriodStart,
            trackingEnabled: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }).link({ profile: profileId })
        );
      }

      for (const exercise of DEFAULT_EXERCISES) {
        const exerciseId = id();
        transactions.push(
          db.tx.exercises[exerciseId].update({
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
            isCustom: false,
            createdAt: Date.now(),
          })
        );
      }

      await db.transact(transactions);
      setStep('complete');
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Error al crear el perfil. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 'goals' && biologicalSex !== 'female') {
      handleComplete();
      return;
    }
    if (step === 'cycle') {
      handleComplete();
      return;
    }
    const steps: Step[] = ['welcome', 'basics', 'goals', 'cycle', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['welcome', 'basics', 'goals', 'cycle'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jaguar-50 via-white to-burgundy-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        {step !== 'welcome' && step !== 'complete' && (
          <div className="mb-8">
            <div className="flex gap-2">
              {['basics', 'goals', 'cycle'].map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    ['basics', 'goals', 'cycle'].indexOf(step) >= i ? 'bg-jaguar-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'welcome' && <WelcomeStep key="welcome" onNext={nextStep} />}
          {step === 'basics' && (
            <BasicsStep
              key="basics"
              name={name} setName={setName}
              birthDate={birthDate} setBirthDate={setBirthDate}
              biologicalSex={biologicalSex} setBiologicalSex={setBiologicalSex}
              weight={weight} setWeight={setWeight}
              height={height} setHeight={setHeight}
              onNext={nextStep} onBack={prevStep}
            />
          )}
          {step === 'goals' && (
            <GoalsStep
              key="goals"
              experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
              goal={goal} setGoal={setGoal}
              injuries={injuries} setInjuries={setInjuries}
              onNext={nextStep} onBack={prevStep}
              loading={loading && biologicalSex !== 'female'}
            />
          )}
          {step === 'cycle' && (
            <CycleStep
              key="cycle"
              trackCycle={trackCycle} setTrackCycle={setTrackCycle}
              lastPeriodStart={lastPeriodStart} setLastPeriodStart={setLastPeriodStart}
              cycleLength={cycleLength} setCycleLength={setCycleLength}
              onNext={nextStep} onBack={prevStep} loading={loading}
            />
          )}
          {step === 'complete' && <CompleteStep key="complete" name={name} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl gradient-jaguar flex items-center justify-center shadow-xl">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Bienvenido a GymTracker!</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">Vamos a personalizar tu experiencia para ayudarte a alcanzar tus metas.</p>
      <Button onClick={onNext} size="lg" className="px-8">
        Comenzar
        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </motion.div>
  );
}

function BasicsStep({ name, setName, birthDate, setBirthDate, biologicalSex, setBiologicalSex, weight, setWeight, height, setHeight, onNext, onBack }: {
  name: string; setName: (v: string) => void;
  birthDate: string; setBirthDate: (v: string) => void;
  biologicalSex: string; setBiologicalSex: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  height: string; setHeight: (v: string) => void;
  onNext: () => void; onBack: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Información básica</h2>
        <p className="text-gray-500 text-sm mb-6">Cuéntanos sobre ti</p>
        <div className="space-y-4">
          <Input label="Tu nombre" placeholder="¿Cómo te llamamos?" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Fecha de nacimiento" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          <Select
            label="Sexo biológico"
            value={biologicalSex}
            onChange={(e) => setBiologicalSex(e.target.value)}
            options={[
              { value: '', label: 'Selecciona...' },
              { value: 'male', label: 'Masculino' },
              { value: 'female', label: 'Femenino' },
              { value: 'prefer_not_to_say', label: 'Prefiero no decir' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Peso (kg)" type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Input label="Altura (cm)" type="number" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onBack} className="flex-1">Atrás</Button>
          <Button onClick={onNext} className="flex-1">Continuar</Button>
        </div>
      </Card>
    </motion.div>
  );
}

function GoalsStep({ experienceLevel, setExperienceLevel, goal, setGoal, injuries, setInjuries, onNext, onBack, loading }: {
  experienceLevel: string; setExperienceLevel: (v: string) => void;
  goal: string; setGoal: (v: string) => void;
  injuries: string; setInjuries: (v: string) => void;
  onNext: () => void; onBack: () => void; loading: boolean;
}) {
  const goals = [
    { value: 'hypertrophy', label: 'Ganar músculo', emoji: '💪' },
    { value: 'strength', label: 'Ganar fuerza', emoji: '🏋️' },
    { value: 'endurance', label: 'Resistencia', emoji: '🏃' },
    { value: 'fat_loss', label: 'Perder grasa', emoji: '🔥' },
    { value: 'general', label: 'Salud general', emoji: '❤️' },
  ];
  const levels = [
    { value: 'beginner', label: 'Principiante', desc: 'Menos de 1 año' },
    { value: 'intermediate', label: 'Intermedio', desc: '1-3 años' },
    { value: 'advanced', label: 'Avanzado', desc: 'Más de 3 años' },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Tus metas</h2>
        <p className="text-gray-500 text-sm mb-6">¿Qué quieres lograr?</p>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de experiencia</label>
            <div className="grid grid-cols-3 gap-2">
              {levels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setExperienceLevel(level.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${experienceLevel === level.value ? 'border-jaguar-500 bg-jaguar-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium text-sm">{level.label}</div>
                  <div className="text-xs text-gray-400">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo principal</label>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${goal === g.value ? 'border-jaguar-500 bg-jaguar-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="text-xl">{g.emoji}</span>
                  <span className="font-medium text-sm">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Input label="¿Tienes alguna lesión o limitación? (opcional)" placeholder="Ej: Dolor de rodilla..." value={injuries} onChange={(e) => setInjuries(e.target.value)} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onBack} className="flex-1">Atrás</Button>
          <Button onClick={onNext} className="flex-1" loading={loading}>Continuar</Button>
        </div>
      </Card>
    </motion.div>
  );
}

function CycleStep({ trackCycle, setTrackCycle, lastPeriodStart, setLastPeriodStart, cycleLength, setCycleLength, onNext, onBack, loading }: {
  trackCycle: boolean; setTrackCycle: (v: boolean) => void;
  lastPeriodStart: string; setLastPeriodStart: (v: string) => void;
  cycleLength: string; setCycleLength: (v: string) => void;
  onNext: () => void; onBack: () => void; loading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-burgundy-100 flex items-center justify-center">
            <span className="text-3xl">🌸</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Seguimiento del ciclo</h2>
          <p className="text-gray-500 text-sm">Adapta tu entrenamiento a tu ciclo menstrual</p>
        </div>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setTrackCycle(!trackCycle)}
            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${trackCycle ? 'border-burgundy-500 bg-burgundy-50' : 'border-gray-200'}`}
          >
            <span className="font-medium">Activar seguimiento</span>
            <div className={`w-12 h-6 rounded-full transition-colors ${trackCycle ? 'bg-burgundy-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${trackCycle ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
            </div>
          </button>
          {trackCycle && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
              <Input label="Fecha del último período" type="date" value={lastPeriodStart} onChange={(e) => setLastPeriodStart(e.target.value)} />
              <Input label="Duración promedio del ciclo (días)" type="number" placeholder="28" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} />
              <div className="p-4 rounded-xl bg-burgundy-50 border border-burgundy-100">
                <h4 className="font-medium text-burgundy-800 mb-2">¿Por qué es útil?</h4>
                <p className="text-sm text-burgundy-700">Tu ciclo afecta tu energía, fuerza y recuperación. Te daremos recomendaciones personalizadas.</p>
              </div>
            </motion.div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={onBack} className="flex-1">Atrás</Button>
          <Button onClick={onNext} className="flex-1" loading={loading}>Completar</Button>
        </div>
      </Card>
    </motion.div>
  );
}

function CompleteStep({ name }: { name: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-24 h-24 mx-auto mb-6 rounded-full bg-jaguar-100 flex items-center justify-center">
        <svg className="w-12 h-12 text-jaguar-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Listo, {name || 'campeón'}!</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">Tu perfil está configurado. Es hora de comenzar a entrenar.</p>
      <Button size="lg" className="px-8" onClick={() => window.location.reload()}>
        ¡Vamos!
        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </Button>
    </motion.div>
  );
}
