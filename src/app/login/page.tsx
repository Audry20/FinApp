'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRecoveryForm, setShowRecoveryForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
  }

  const handlePasswordResetRequest = async () => {
    const cleanedEmail = resetEmail.trim()

    if (!cleanedEmail) {
      setError('Veuillez saisir votre e-mail pour réinitialiser votre mot de passe.')
      return
    }

    setLoading(true)
    setError(null)
    setResetMessage(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setResetMessage(`Un lien de réinitialisation a été envoyé à ${cleanedEmail}.`)
    setResetEmail('')
    setShowRecoveryForm(false)
    setLoading(false)
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-[#040705]">
      {/* Left Branding Section */}
      <section className="relative w-full lg:w-[48%] flex flex-col justify-center px-10 sm:px-16 lg:px-24 py-16 lg:py-0 min-h-[250px] lg:min-h-screen z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#143b1e] via-[#0d2814] to-[#07170c] pointer-events-none lg:[clip-path:polygon(0_0,78%_0,100%_100%,0%_100%)] [clip-path:polygon(0_0,100%_0,100%_90%,0%_100%)]">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#21572d] rounded-full blur-3xl opacity-30"></div>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white mb-2">
            Finance App
          </h1>
          <p className="text-2xl sm:text-3xl font-normal text-[#5b7a63]">
            Finance App
          </p>
        </div>
      </section>

      {/* Right Auth Section */}
      <section className="w-full lg:w-[52%] flex flex-col justify-center items-center lg:items-start px-6 sm:px-12 lg:px-24 py-12 lg:py-0 relative z-20">
        <div className="w-full max-w-[420px]">
          <header className="mb-10 text-left">
            <h2 className="text-4xl sm:text-5xl font-normal tracking-tight text-white">
              Login
            </h2>
          </header>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {resetMessage && (
            <div className="mb-6 p-4 rounded-xl bg-[#0d1b11] border border-[#76E381]/50 text-[#baf7c1] text-sm">
              {resetMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-normal text-[#8d9e91]" htmlFor="email">
                e-mail
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#566a5c]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your e-mail"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#0a150e] border border-[#16271a] rounded-full text-gray-200 placeholder-[#47574b] text-base focus:outline-none focus:border-[#76E381] focus:ring-1 focus:ring-[#76E381] transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm sm:text-base font-normal text-[#8d9e91]" htmlFor="password">
                password
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#566a5c]">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#0a150e] border border-[#16271a] rounded-full text-gray-200 placeholder-[#566a5c] tracking-widest text-base focus:outline-none focus:border-[#76E381] focus:ring-1 focus:ring-[#76E381] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#566a5c] hover:text-[#8d9e91] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRecoveryForm(!showRecoveryForm)}
                className="text-sm font-normal text-[#76E381] hover:underline cursor-pointer"
              >
                Forgot the password ?
              </button>
            </div>

            {showRecoveryForm && (
              <div className="space-y-3 rounded-2xl border border-[#1d381f] bg-[#0b140d] p-4">
                <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="reset-email">
                  E-mail de récupération
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasswordResetRequest}
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-transparent border border-[#76E381] text-[#76E381] font-medium hover:bg-[#112516] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Envoyer le lien de réinitialisation
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-6 rounded-full bg-[#76E381] text-[#040805] font-semibold text-base text-center shadow-[0_0_28px_4px_rgba(118,227,129,0.35)] hover:shadow-[0_0_35px_8px_rgba(118,227,129,0.5)] hover:bg-[#89E692] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'log in...' : 'log in'}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex-1 py-3.5 px-6 rounded-full bg-transparent border border-[#2b3a2e] hover:border-[#3e5643] hover:bg-[#0c160f] text-white font-medium text-base flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <span className="text-[#76E381] font-bold text-lg leading-none">G</span>
                <span className="text-gray-200 font-normal">google</span>
              </button>
            </div>

            {/* Signup Link */}
            <div className="pt-4 text-center">
              <p className="text-sm font-normal text-[#6f8274]">
                don’t have an account?{' '}
                <Link href="/signup" className="text-[#76E381] font-medium hover:underline hover:text-[#89E692] transition-colors ml-1">
                  sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
