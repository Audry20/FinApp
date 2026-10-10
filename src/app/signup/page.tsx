'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom,
          prenom,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGoogleSignup = async () => {
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

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-[#020703]">
      {/* Left Branding Panel */}
      <section className="relative w-full lg:w-[46%] min-h-[250px] lg:min-h-screen flex items-center p-8 sm:p-14 lg:p-20 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#12361b] via-[#0d2613] to-[#041107] border-r border-[#1a4323]/20 shadow-2xl lg:[clip-path:polygon(0_0,80%_0,100%_100%,0%_100%)]"></div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#2a6836]/25 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white">
            Finance App
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-[#628468] font-normal mt-3">
            Finance App
          </p>
        </div>
      </section>

      {/* Right Auth Section */}
      <section className="flex-1 w-full flex items-center justify-center p-6 sm:p-12 lg:p-16 z-10 relative bg-[#020703]">
        <div className="w-full max-w-[580px] flex flex-col">
          <div className="mb-10 text-center lg:text-right pr-0 lg:pr-4">
            <h2 className="text-3xl lg:text-[34px] font-bold text-white tracking-[0.22em] uppercase font-mono">
              SIGN UP
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignup}>
            {/* Row 1: Name & Surname */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm lg:text-base font-normal text-[#8c9e90] pl-1" htmlFor="nom">
                  name
                </label>
                <div className="flex items-center px-4 py-3 rounded-full bg-[#0b150d] border border-[#162a1b] text-sm focus-within:border-[#76E381]">
                  <User className="w-5 h-5 text-[#506854] shrink-0 mr-3" />
                  <input
                    id="nom"
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="your name"
                    className="bg-transparent border-0 p-0 text-gray-200 placeholder-[#566758] focus:ring-0 focus:outline-none text-sm sm:text-base w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm lg:text-base font-normal text-[#8c9e90] pl-1" htmlFor="prenom">
                  surname
                </label>
                <div className="flex items-center px-4 py-3 rounded-full bg-[#0b150d] border border-[#162a1b] text-sm focus-within:border-[#76E381]">
                  <User className="w-5 h-5 text-[#506854] shrink-0 mr-3" />
                  <input
                    id="prenom"
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder="your surname"
                    className="bg-transparent border-0 p-0 text-gray-200 placeholder-[#566758] focus:ring-0 focus:outline-none text-sm sm:text-base w-full"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Mail */}
            <div className="space-y-2">
              <label className="block text-sm lg:text-base font-normal text-[#8c9e90] pl-1" htmlFor="email">
                mail
              </label>
              <div className="flex items-center px-4 py-3 rounded-full bg-[#0b150d] border border-[#162a1b] text-sm focus-within:border-[#76E381]">
                <User className="w-5 h-5 text-[#506854] shrink-0 mr-3" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your mail"
                  className="bg-transparent border-0 p-0 text-gray-200 placeholder-[#566758] focus:ring-0 focus:outline-none text-sm sm:text-base w-full"
                />
              </div>
            </div>

            {/* Row 3: Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm lg:text-base font-normal text-[#8c9e90] pl-1" htmlFor="password">
                  password
                </label>
                <div className="flex items-center px-4 py-3 rounded-full bg-[#0b150d] border border-[#162a1b] text-sm relative focus-within:border-[#76E381]">
                  <User className="w-5 h-5 text-[#506854] shrink-0 mr-3" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="bg-transparent border-0 p-0 text-gray-200 placeholder-[#566758] focus:ring-0 focus:outline-none text-sm sm:text-base w-full tracking-widest pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#506854] hover:text-[#76E381] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm lg:text-base font-normal text-[#8c9e90] pl-1 truncate" htmlFor="confirmPassword">
                  confirm your password
                </label>
                <div className="flex items-center px-4 py-3 rounded-full bg-[#0b150d] border border-[#162a1b] text-sm relative focus-within:border-[#76E381]">
                  <User className="w-5 h-5 text-[#506854] shrink-0 mr-3" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="•••••••••"
                    className="bg-transparent border-0 p-0 text-gray-200 placeholder-[#566758] focus:ring-0 focus:outline-none text-sm sm:text-base w-full tracking-widest pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 text-[#506854] hover:text-[#76E381] focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: Buttons */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#76E381] hover:bg-[#89E692] text-[#071309] font-bold text-base tracking-wide transition duration-200 shadow-[0_0_28px_-2px_rgba(118,227,129,0.55)] flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {loading ? 'create account...' : 'Create account'}
              </button>

              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#081309] hover:bg-[#0e2111] text-[#c9e0cd] border border-[#1b351e] font-semibold text-base tracking-wide transition duration-200 flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <span className="font-bold text-lg text-[#76E381]">G</span>
                <span className="text-white font-medium">google</span>
              </button>
            </div>

            {/* Switch Page */}
            <div className="pt-2 text-center text-xs sm:text-sm text-[#738577]">
              <span>Already have an account? </span>
              <Link href="/login" className="text-[#76E381] hover:underline font-medium hover:text-[#89E692] transition duration-150 ml-1">
                Login
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
