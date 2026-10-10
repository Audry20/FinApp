'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react'

export default function ParametresPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')

  // Password fields
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setEmail(user.email || '')

        // Fetch extra fields from public.users
        const { data: profile } = await supabase
          .from('users')
          .select('nom, prenom')
          .eq('id', user.id)
          .single()

        if (profile) {
          setNom(profile.nom || '')
          setPrenom(profile.prenom || '')
        } else {
          setNom(user.user_metadata?.nom || '')
          setPrenom(user.user_metadata?.prenom || '')
        }
      }
      setLoading(false)
    }
    loadUserData()
  }, [supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError(null)

    if (!userId) {
      setProfileError('Utilisateur non connecté.')
      setSavingProfile(false)
      return
    }

    // Upsert public.users profile
    const { error: dbErr } = await supabase
      .from('users')
      .upsert({
        id: userId,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
      })

    if (dbErr) {
      setProfileError(dbErr.message)
      setSavingProfile(false)
      return
    }

    // Also update auth user metadata & email if changed
    const { error: authErr } = await supabase.auth.updateUser({
      email,
      data: { nom, prenom },
    })

    if (authErr) {
      setProfileError(authErr.message)
    } else {
      setToastMessage('Informations personnelles mises à jour avec succès !')
      setTimeout(() => setToastMessage(null), 3500)
    }
    setSavingProfile(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordError(null)

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      setSavingPassword(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('La confirmation du mot de passe ne correspond pas.')
      setSavingPassword(false)
      return
    }

    const { error: passErr } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (passErr) {
      setPasswordError(passErr.message)
    } else {
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setToastMessage('Votre mot de passe a été modifié avec succès !')
      setTimeout(() => setToastMessage(null), 3500)
    }
    setSavingPassword(false)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setProfileError('Veuillez saisir votre e-mail.')
      return
    }
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (resetErr) {
      setProfileError(resetErr.message)
    } else {
      setToastMessage(`Un e-mail de réinitialisation a été envoyé à ${email}.`)
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-16 max-w-[860px] mx-auto relative">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0E1B0F] border border-[#76E381] shadow-[0_0_20px_rgba(118,227,129,0.3)] text-white animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 text-[#76E381]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Paramètres du Profil</h1>

        {/* Card 1: Personal Information */}
        <article className="bg-[#0E1B0F] border border-[#1D381F] rounded-[28px] p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-xl font-medium text-white tracking-wide">Informations Personnelles</h2>

          {profileError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nom */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="nom">Nom</label>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 absolute left-4 text-[#7F9781] pointer-events-none" />
                  <input
                    id="nom"
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Prénom */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="prenom">Prénom</label>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 absolute left-4 text-[#7F9781] pointer-events-none" />
                  <input
                    id="prenom"
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="email">E-mail</label>
              <div className="relative flex items-center">
                <Mail className="w-5 h-5 absolute left-4 text-[#7F9781] pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile || loading}
              className="w-full py-4 rounded-full bg-[#76E381] hover:bg-[#89E692] text-[#050B05] font-semibold text-base shadow-[0_0_20px_rgba(118,227,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </article>

        {/* Card 2: Security */}
        <article className="bg-[#0E1B0F] border border-[#1D381F] rounded-[28px] p-6 sm:p-8 shadow-xl space-y-6">
          <h2 className="text-xl font-medium text-white tracking-wide">Sécurité</h2>

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="oldPassword">
                  Ancien mot de passe
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 absolute left-4 text-[#7F9781] pointer-events-none" />
                  <input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="newPassword">
                  Nouveau mot de passe
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 absolute left-4 text-[#7F9781] pointer-events-none" />
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none tracking-widest"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A4B8A6]" htmlFor="confirmPassword">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 absolute left-4 text-[#7F9781] pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] rounded-2xl text-white text-sm focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-center justify-start sm:justify-end pb-3">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-normal text-[#76E381] hover:underline cursor-pointer"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-4 rounded-full bg-[#76E381] hover:bg-[#89E692] text-[#050B05] font-semibold text-base shadow-[0_0_20px_rgba(118,227,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? 'Mise à jour...' : 'Changer le mot de passe'}
            </button>
          </form>
        </article>
      </div>
    </AppLayout>
  )
}
