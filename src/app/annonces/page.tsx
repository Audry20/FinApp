'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, AlertCircle, CheckCircle, Bell, ChevronRight } from 'lucide-react'

interface Annonce {
  id: string
  titre: string
  description: string
  due_date: string | null
  statut: 'EN_ATTENTE' | 'REALISE' | 'ANNULE'
  created_at: string
}

export default function AnnoncesPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')

  // Create Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Detail Modal State
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchAnnonces = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error: fetchErr } = await supabase
      .from('annonces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchErr) {
      console.error('Erreur chargement annonces:', fetchErr)
    } else {
      setAnnonces(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAnnonces()
  }, [fetchAnnonces])

  const handleOpenAddModal = () => {
    setTitre('')
    setDescription('')
    setDueDate('')
    setError(null)
    setIsAddModalOpen(true)
  }

  const handleCreateAnnonce = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!titre.trim()) {
      setError('Veuillez indiquer un titre pour la rappel / annonce.')
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utilisateur non authentifié.')
      setSubmitting(false)
      return
    }

    const { error: insertErr } = await supabase.from('annonces').insert({
      user_id: user.id,
      titre: titre.trim(),
      description: description.trim(),
      due_date: dueDate ? dueDate : null,
      statut: 'EN_ATTENTE',
    })

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
    } else {
      setSubmitting(false)
      setIsAddModalOpen(false)
      setToastMessage('Annonce créée avec succès !')
      setTimeout(() => setToastMessage(null), 3500)
      fetchAnnonces()
    }
  }

  const handleUpdateStatus = async (newStatus: 'REALISE' | 'ANNULE') => {
    if (!selectedAnnonce) return
    setSubmitting(true)
    setError(null)

    const { error: updateErr } = await supabase
      .from('annonces')
      .update({
        statut: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedAnnonce.id)

    if (updateErr) {
      setError(updateErr.message)
      setSubmitting(false)
    } else {
      setSubmitting(false)
      setIsDetailModalOpen(false)
      setSelectedAnnonce(null)
      setToastMessage(`Statut de l'annonce mis à jour : ${newStatus === 'REALISE' ? 'Réalisé' : 'Annulé'}`)
      setTimeout(() => setToastMessage(null), 3500)
      fetchAnnonces()
    }
  }

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return 'Indéfini'
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const getBadgeStyle = (statut: string) => {
    switch (statut) {
      case 'REALISE':
        return {
          text: 'Réalisé',
          dot: 'bg-[#76E381] shadow-[0_0_8px_#76E381]',
          badge: 'border-[#76E381]/40 bg-[#76E381]/15 text-[#76E381]',
        }
      case 'ANNULE':
        return {
          text: 'Annulé',
          dot: 'bg-[#FF4B4B] shadow-[0_0_8px_#FF4B4B]',
          badge: 'border-[#FF4B4B]/40 bg-[#FF4B4B]/15 text-[#FF4B4B]',
        }
      default:
        return {
          text: 'En attente',
          dot: 'bg-[#F5C51B] shadow-[0_0_8px_#F5C51B]',
          badge: 'border-[#F5C51B]/40 bg-[#F5C51B]/15 text-[#F5C51B]',
        }
    }
  }

  const filteredAnnonces = selectedFilter === 'ALL'
    ? annonces
    : annonces.filter(a => a.statut === selectedFilter)

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 relative">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0E1B0F] border border-[#76E381] shadow-[0_0_20px_rgba(118,227,129,0.3)] text-white animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 text-[#76E381]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Top Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#0E1B0F] border border-[#1D381F] shadow-xl">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#76E381] shadow-[0_0_12px_#76E381]"></span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Reminders</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-[#76E381] text-[#050B05] shadow-[0_0_12px_rgba(118,227,129,0.35)]'
                  : 'bg-[#142A17] text-[#A4B8A6] hover:text-white border border-[#1D381F]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('EN_ATTENTE')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'EN_ATTENTE'
                  ? 'bg-[#F5C51B]/20 border-[#F5C51B] text-[#F5C51B]'
                  : 'bg-[#142A17] border-[#1D381F] text-[#A4B8A6] hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#F5C51B]"></span>
              Pending
            </button>
            <button
              onClick={() => setSelectedFilter('REALISE')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'REALISE'
                  ? 'bg-[#76E381]/20 border-[#76E381] text-[#76E381]'
                  : 'bg-[#142A17] border-[#1D381F] text-[#A4B8A6] hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#76E381]"></span>
              Executed
            </button>
            <button
              onClick={() => setSelectedFilter('ANNULE')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 cursor-pointer ${
                selectedFilter === 'ANNULE'
                  ? 'bg-[#FF4B4B]/20 border-[#FF4B4B] text-[#FF4B4B]'
                  : 'bg-[#142A17] border-[#1D381F] text-[#A4B8A6] hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF4B4B]"></span>
              Cancel 
            </button>
          </div>
        </div>

        {/* List of Annonces Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-[26px] bg-[#0E1B0F]/50 border border-[#1D381F] animate-pulse"></div>
              ))}
            </div>
          ) : filteredAnnonces.length === 0 ? (
            <div className="p-12 text-center rounded-[26px] bg-[#0E1B0F] border border-[#1D381F] shadow-lg">
              <Bell className="w-12 h-12 text-[#A4B8A6] mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-white">No listings found</h3>
              <p className="text-sm text-[#A4B8A6] mt-1">Click the (+) button to create a reminder or a listing</p>
            </div>
          ) : (
            filteredAnnonces.map((item) => {
              const badgeConfig = getBadgeStyle(item.statut)
              return (
                <article
                  key={item.id}
                  onClick={() => {
                    setSelectedAnnonce(item)
                    setIsDetailModalOpen(true)
                  }}
                  className="group relative p-5 sm:p-6 rounded-[26px] bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/40 shadow-md transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${badgeConfig.dot}`}></span>
                        <h2 className="text-lg sm:text-xl font-semibold text-white tracking-normal group-hover:text-[#76E381] transition-colors truncate">
                          {item.titre}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 pl-5 text-xs sm:text-sm text-[#A4B8A6]">
                        <span className="text-[#7F9781] font-medium">Due date :</span>
                        <span className="font-mono text-white/90">{formatDueDate(item.due_date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pl-5 md:pl-0 shrink-0">
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border ${badgeConfig.badge}`}>
                        State : {badgeConfig.text}
                      </span>
                      <ChevronRight className="w-5 h-5 text-[#A4B8A6] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Floating Action Button (+) */}
        <aside className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-40">
          <button
            onClick={handleOpenAddModal}
            aria-label="Créer une annonce"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#76E381] text-[#050B05] flex items-center justify-center font-bold shadow-[0_0_35px_rgba(118,227,129,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-[#050B05]" />
          </button>
        </aside>

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setIsAddModalOpen(false)}
            ></div>

            <div className="relative z-10 w-full max-w-lg bg-[#0E1B0F]/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#76E381]/30 text-white">
              <div className="flex items-center justify-between pb-4 border-b border-[#1D381F]">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-[#76E381] shadow-[0_0_12px_#76E381]"></span>
                  <h3 className="text-xl font-bold tracking-tight text-white">Create a reminder</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#142A17] border border-[#1D381F] text-[#A4B8A6] hover:text-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateAnnonce} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="add-titre">
                    Titre
                  </label>
                  <input
                    id="add-titre"
                    type="text"
                    required
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    placeholder="Ex: Réception de fonds, Facture..."
                    className="w-full px-4 py-3 rounded-xl bg-[#050B05] border border-[#1D381F] text-white focus:border-[#76E381] focus:outline-none text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="add-desc">
                    Description
                  </label>
                  <textarea
                    id="add-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails explicatifs de l'annonce..."
                    className="w-full px-4 py-3 rounded-xl bg-[#050B05] border border-[#1D381F] text-white focus:border-[#76E381] focus:outline-none text-sm resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="add-due">
                      Due Date
                    </label>
                    <span className="text-[11px] text-[#7F9781]">Optional (default: Undefined)</span>
                  </div>
                  <input
                    id="add-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#050B05] border border-[#1D381F] text-white focus:border-[#76E381] focus:outline-none text-sm font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1D381F]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-[#142A17] text-[#A4B8A6] hover:text-white text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-[#76E381] text-[#050B05] font-semibold text-sm shadow-[0_0_15px_rgba(118,227,129,0.4)] hover:bg-[#89E692] cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Creation...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail & Action Modal */}
        {isDetailModalOpen && selectedAnnonce && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setIsDetailModalOpen(false)}
            ></div>

            <div className="relative z-10 w-full max-w-lg bg-[#0E1B0F]/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#76E381]/30 text-white">
              <div className="flex items-center justify-between pb-4 border-b border-[#1D381F]">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${getBadgeStyle(selectedAnnonce.statut).dot}`}></span>
                  <h3 className="text-xl font-bold tracking-tight text-white">Reminder details</h3>
                </div>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#142A17] border border-[#1D381F] text-[#A4B8A6] hover:text-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]">Titre</span>
                  <p className="text-lg font-bold text-white">{selectedAnnonce.titre}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]">Description</span>
                  <div className="p-4 rounded-xl bg-[#050B05] border border-[#1D381F] text-sm text-[#A4B8A6] leading-relaxed break-words">
                    {selectedAnnonce.description || 'Aucune description explicative.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]">Due Date</span>
                    <span className="font-mono text-sm text-white block">{formatDueDate(selectedAnnonce.due_date)}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]">Current state</span>
                    <span className={`text-sm font-semibold block ${getBadgeStyle(selectedAnnonce.statut).badge.split(' ')[2]}`}>
                      {getBadgeStyle(selectedAnnonce.statut).text}
                    </span>
                  </div>
                </div>

                {/* Actions (Realise & Cancel) */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#1D381F]">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleUpdateStatus('ANNULE')}
                    className="px-5 py-2.5 rounded-full bg-[#FF4B4B] text-white font-semibold text-sm shadow-[0_0_15px_rgba(255,75,75,0.35)] hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleUpdateStatus('REALISE')}
                    className="px-5 py-2.5 rounded-full bg-[#76E381] text-[#050B05] font-semibold text-sm shadow-[0_0_15px_rgba(118,227,129,0.35)] hover:bg-[#89E692] transition-all cursor-pointer disabled:opacity-50"
                  >
                    Executed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
