'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, AlertCircle, CheckCircle, Wallet } from 'lucide-react'

interface Transaction {
  id: string
  type: 'AJOUT' | 'RETRAIT'
  somme: number
  devise: 'USD' | 'EUR' | 'GBP' | 'TRY'
  motif: string
  created_at: string
}

export default function BudgetPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [ajouts, setAjouts] = useState<Transaction[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [montant, setMontant] = useState('')
  const [devise, setDevise] = useState<'USD' | 'EUR' | 'GBP' | 'TRY'>('USD')
  const [dateHeure, setDateHeure] = useState('')
  const [motif, setMotif] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchAjouts = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'AJOUT')
      .order('created_at', { ascending: false })

    if (fetchErr) {
      console.error('Erreur chargement ajouts:', fetchErr)
    } else {
      setAjouts(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAjouts()
  }, [fetchAjouts])

  // Open modal with current date/time prepopulated
  const handleOpenModal = () => {
    const now = new Date()
    const isoDateStr = now.toISOString().slice(0, 16) // "YYYY-MM-THH:mm"
    setDateHeure(isoDateStr)
    setMontant('')
    setMotif('')
    setError(null)
    setIsModalOpen(true)
  }

  const handleAddAjout = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const numAmount = parseFloat(montant)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Veuillez saisir un montant valide supérieur à 0.')
      setSubmitting(false)
      return
    }

    if (!motif.trim()) {
      setError('Veuillez indiquer le motif de cet ajout.')
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utilisateur non authentifié.')
      setSubmitting(false)
      return
    }

    const customCreatedAt = dateHeure ? new Date(dateHeure).toISOString() : new Date().toISOString()

    const { error: insertErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'AJOUT',
      somme: numAmount,
      devise,
      motif: motif.trim(),
      created_at: customCreatedAt,
    })

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
    } else {
      setSubmitting(false)
      setIsModalOpen(false)
      setToastMessage('Capital ajouté avec succès !')
      setTimeout(() => setToastMessage(null), 3500)
      fetchAjouts()
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const date = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return `le ${date} à ${time}`
  }

  const filteredAjouts = selectedCurrency === 'all'
    ? ajouts
    : ajouts.filter(a => a.devise === selectedCurrency)

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0E1B0F] shadow-xl border border-[#1D381F]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#76E381] shadow-[0_0_10px_#76E381]"></span>
              <h1 className="font-semibold text-lg sm:text-xl text-white tracking-wide">Journal des Entrées & Capital (Budget)</h1>
            </div>
            <p className="text-xs text-[#A4B8A6]">Historique des ajouts de fonds par devise</p>
          </div>

          {/* Currency Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'USD', 'EUR', 'GBP', 'TRY'].map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-[#76E381] text-[#050B05] shadow-[0_0_16px_rgba(118,227,129,0.35)]'
                    : 'bg-[#142A17] text-[#A4B8A6] hover:text-white border border-[#1D381F]'
                }`}
              >
                {curr === 'all' ? 'Toutes' : `${curr}`}
              </button>
            ))}
          </div>
        </div>

        {/* List of Capital Entries */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-[26px] bg-[#0E1B0F]/50 border border-[#1D381F] animate-pulse"></div>
              ))}
            </div>
          ) : filteredAjouts.length === 0 ? (
            <div className="p-12 text-center rounded-[26px] bg-[#0E1B0F] border border-[#1D381F] shadow-lg">
              <Wallet className="w-12 h-12 text-[#A4B8A6] mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-white">Aucun ajout trouvé</h3>
              <p className="text-sm text-[#A4B8A6] mt-1">Cliquez sur le bouton (+) pour effectuer votre premier ajout de capital.</p>
            </div>
          ) : (
            filteredAjouts.map((item) => (
              <article
                key={item.id}
                className="group relative p-6 sm:p-7 rounded-[26px] bg-[#0E1B0F] border border-[#1D381F] shadow-md hover:border-[#76E381]/40 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#76E381] shrink-0"></span>
                      <h2 className="text-base sm:text-lg text-white font-medium tracking-normal break-words">
                        {item.motif}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 pl-5 font-mono text-sm sm:text-base text-[#A4B8A6]">
                      <span>Amount:</span>
                      <span className="text-[#76E381] font-mono text-lg font-semibold">
                        +{Number(item.somme).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {item.devise}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-2 shrink-0 pl-5 md:pl-0">
                    <span className="font-mono text-xs sm:text-sm text-[#A4B8A6] tracking-wide">
                      {formatDate(item.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#76E381]/80 shadow-[0_0_8px_#76E381]"></span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Floating Action Button (+) */}
        <aside className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-40">
          <button
            onClick={handleOpenModal}
            aria-label="Ajouter un capital"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#76E381] text-[#050B05] flex items-center justify-center font-bold shadow-[0_0_35px_rgba(118,227,129,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-[#050B05]" />
          </button>
        </aside>

        {/* Modal Ajout Capital */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-xl bg-[#0E1B0F]/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#76E381]/30">
              <div className="flex items-center justify-between pb-5 border-b border-[#1D381F]">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#76E381] shadow-[0_0_12px_#76E381]"></div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Ajouter un Capital
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-[#142A17] border border-[#1D381F] flex items-center justify-center text-[#A4B8A6] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAddAjout} className="mt-6 flex flex-col gap-5">
                {/* Champ 1: Montant */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="montant">
                    Montant en chiffre
                  </label>
                  <input
                    id="montant"
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    placeholder="ex: 1200"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] focus:outline-none text-white font-mono text-lg"
                  />
                </div>

                {/* Champ 2: Devise */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="devise">
                    Devise
                  </label>
                  <select
                    id="devise"
                    value={devise}
                    onChange={(e) => setDevise(e.target.value as any)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] focus:outline-none text-white font-mono text-sm cursor-pointer"
                  >
                    <option value="USD">USD ($) - Dollar américain</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - Livre sterling</option>
                    <option value="TRY">TRY (₺) - Livre turque</option>
                  </select>
                </div>

                {/* Champ 3: Date & Heure */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="dateHeure">
                    Date et Heure
                  </label>
                  <input
                    id="dateHeure"
                    type="datetime-local"
                    value={dateHeure}
                    onChange={(e) => setDateHeure(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] focus:outline-none text-white font-mono text-sm"
                  />
                </div>

                {/* Champ 4: Motif */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#A4B8A6]" htmlFor="motif">
                    Motif
                  </label>
                  <textarea
                    id="motif"
                    rows={3}
                    required
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="ex: Récompense travail supplémentaire"
                    className="w-full px-4 py-3 rounded-2xl bg-[#050B05] border border-[#1D381F] focus:border-[#76E381] focus:outline-none text-white font-sans text-sm resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#1D381F]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl text-[#A4B8A6] hover:text-white hover:bg-[#142A17] font-medium text-sm transition-colors text-center"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#76E381] text-[#050B05] font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(118,227,129,0.4)] hover:bg-[#89E692] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Confirmation...' : "Confirmer l'Ajout"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
