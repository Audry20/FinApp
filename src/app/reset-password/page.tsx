'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, AlertCircle, CheckCircle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) return

    const finalizeRecovery = async () => {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        setError(exchangeError.message)
      }
    }

    finalizeRecovery()
  }, [searchParams, supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setError('La confirmation du mot de passe ne correspond pas.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess('Votre mot de passe a été réinitialisé avec succès.')
    setLoading(false)

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 1500)
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#020703] px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#1D381F] bg-[#0E1B0F] p-6 sm:p-8 shadow-[0_0_35px_rgba(118,227,129,0.12)]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Réinitialiser le mot de passe</h1>
          <p className="mt-2 text-sm text-[#A4B8A6]">Choisissez un nouveau mot de passe pour continuer.</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/50 bg-red-950/50 p-3 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#76E381]/50 bg-[#0d1b11] p-3 text-sm text-[#baf7c1]">
            <CheckCircle className="h-5 w-5 shrink-0 text-[#76E381]" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-[#A4B8A6]">
              Nouveau mot de passe
            </label>
            <div className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-4 h-5 w-5 text-[#7F9781]" />
              <input
                id="newPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-2xl border border-[#1D381F] bg-[#050B05] py-3 pl-11 pr-4 text-sm text-white focus:border-[#76E381] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#A4B8A6]">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-4 h-5 w-5 text-[#7F9781]" />
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-2xl border border-[#1D381F] bg-[#050B05] py-3 pl-11 pr-4 text-sm text-white focus:border-[#76E381] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#76E381] py-3.5 font-semibold text-[#040805] shadow-[0_0_20px_rgba(118,227,129,0.35)] transition-all hover:bg-[#89E692] disabled:opacity-50"
          >
            {loading ? 'Mise à jour...' : 'Valider le nouveau mot de passe'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen w-full flex items-center justify-center bg-[#020703] px-4"><div className="text-white">Chargement...</div></main>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
