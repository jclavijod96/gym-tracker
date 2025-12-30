'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Button, Input, Card } from './ui';
import { motion } from 'framer-motion';

export function Auth() {
  const [sentEmail, setSentEmail] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-jaguar-50 via-white to-burgundy-50">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-jaguar flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">GymTracker</h1>
        <p className="text-gray-500 mt-1">Tu progreso, tu fuerza</p>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <Card className="p-6">
          {!sentEmail ? (
            <EmailStep onSendEmail={setSentEmail} />
          ) : (
            <CodeStep sentEmail={sentEmail} onBack={() => setSentEmail('')} />
          )}
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-sm text-gray-400 text-center"
      >
        Al continuar, aceptas nuestros términos de servicio
      </motion.p>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await db.auth.sendMagicCode({ email });
      onSendEmail(email);
    } catch (err: unknown) {
      const error = err as { body?: { message?: string } };
      setError(error.body?.message || 'Error al enviar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Bienvenido</h2>
        <p className="text-gray-500 text-sm mt-1">
          Ingresa tu email para continuar
        </p>
      </div>

      <Input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
        error={error}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />

      <Button type="submit" className="w-full" loading={loading}>
        Continuar
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400">o</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continuar con Google</span>
          <span className="text-xs">(Próximamente)</span>
        </button>

        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span>Continuar con Apple</span>
          <span className="text-xs">(Próximamente)</span>
        </button>
      </div>
    </form>
  );
}

function CodeStep({ sentEmail, onBack }: { sentEmail: string; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await db.auth.signInWithMagicCode({ email: sentEmail, code });
    } catch (err: unknown) {
      const error = err as { body?: { message?: string } };
      setError(error.body?.message || 'Código inválido');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm">Volver</span>
      </button>

      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-jaguar-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-jaguar-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Revisa tu email</h2>
        <p className="text-gray-500 text-sm mt-1">
          Enviamos un código a <strong>{sentEmail}</strong>
        </p>
      </div>

      <Input
        type="text"
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
        autoFocus
        error={error}
        className="text-center text-2xl tracking-widest font-mono"
        maxLength={6}
      />

      <Button type="submit" className="w-full" loading={loading}>
        Verificar código
      </Button>

      <p className="text-center text-sm text-gray-400">
        ¿No recibiste el código?{' '}
        <button
          type="button"
          onClick={onBack}
          className="text-jaguar-600 hover:text-jaguar-700 font-medium"
        >
          Reenviar
        </button>
      </p>
    </form>
  );
}
