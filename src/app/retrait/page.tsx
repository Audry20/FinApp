'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, AlertCircle, CheckCircle, ArrowDownLeft } from 'lucide-react'

interface Transaction {
  id: string
  type: 'AJOUT' | 'RETRAIT'
  somme: number
  devise: 'USD' | 'EUR' | 'GBP' | 'TRY'
  motif: string
  created_at: string
}

export default function RetraitPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [retraits, setRetraits] = useState<Transaction[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all')

  // User balances for anti-overdraft check
  const [balances, setBalances] = useState({
    USD: 0,
    EUR: 0,
    GBP: 0,
    TRY: 0,
  })

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [motif, setMotif] = useState('')
  const [montant, setMontant] = useState('')
  const [devise, setDevise] = useState<'USD' | 'EUR' | 'GBP' | 'TRY'>('USD')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
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
      .order('created_at', { ascending: false })

    if (fetchErr) {
      console.error('Erreur chargement transactions:', fetchErr)
    } else {
      const txs: Transaction[] = data || []
      setRetraits(txs.filter(t => t.type === 'RETRAIT'))

      // Calculate current available balance for each currency
      const newBalances = { USD: 0, EUR: 0, GBP: 0, TRY: 0 }
      txs.forEach((tx) => {
        const amt = Number(tx.somme) || 0
        if (tx.type === 'AJOUT') {
          newBalances[tx.devise] += amt
        } else if (tx.type === 'RETRAIT') {
          newBalances[tx.devise] -= amt
        }
      })
      setBalances(newBalances)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleOpenModal = () => {
    setMotif('')
    setMontant('')
    setError(null)
    setIsModalOpen(true)
  }

  // Anti-overdraft rule calculation
  const currentAvailableBalance = balances[devise] || 0
  const withdrawalAmount = parseFloat(montant) || 0
  const isOverdraft = withdrawalAmount > currentAvailableBalance
  const remainingBalance = currentAvailableBalance - withdrawalAmount

  const handleConfirmRetrait = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!motif.trim()) {
      setError('Veuillez indiquer le motif du retrait.')
      setSubmitting(false)
      return
    }

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('Veuillez saisir un montant valide supérieur à 0.')
      setSubmitting(false)
      return
    }

    // STRICT ANTI-OVERDRAFT RULE CONTROL
    if (isOverdraft) {
      setError(`RETRAIT REFUSÉ : Le solde disponible en ${devise} (${currentAvailableBalance.toFixed(2)}) est insuffisant. Le découvert est strictement interdit.`)
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utilisateur non authentifié.')
      setSubmitting(false)
      return
    }

    // Automatic system timestamp
    const { error: insertErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'RETRAIT',
      somme: withdrawalAmount,
      devise,
      motif: motif.trim(),
      created_at: new Date().toISOString(),
    })

    if (insertErr) {
      setError(insertErr.message)
      setSubmitting(false)
    } else {
      setSubmitting(false)
      setIsModalOpen(false)
      setToastMessage('Retrait effectué avec succès !')
      setTimeout(() => setToastMessage(null), 3500)
      fetchTransactions()
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

  const filteredRetraits = selectedCurrency === 'all'
    ? retraits
    : retraits.filter(r => r.devise === selectedCurrency)

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
              <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-[#FF4B4B] shadow-[0_0_10px_#FF4B4B]"></span>
              <h1 className="font-semibold text-lg sm:text-xl text-white tracking-wide">Withdrawal History</h1>
            </div>
            <p className="text-xs text-[#A4B8A6]">Strict active anti-detection integrity control</p>
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
                {curr === 'all' ? 'All' : `${curr}`}
              </button>
            ))}
          </div>
        </div>

        {/* List of Withdrawal Entries */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-[26px] bg-[#0E1B0F]/50 border border-[#1D381F] animate-pulse"></div>
              ))}
            </div>
          ) : filteredRetraits.length === 0 ? (
            <div className="p-12 text-center rounded-[26px] bg-[#0E1B0F] border border-[#1D381F] shadow-lg">
              <ArrowDownLeft className="w-12 h-12 text-[#A4B8A6] mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-white">No withdrawals found</h3>
              <p className="text-sm text-[#A4B8A6] mt-1">Click the (+) button to make a new withdrawal.</p>
            </div>
          ) : (
            filteredRetraits.map((item) => (
              <article
                key={item.id}
                className="group relative p-6 sm:p-7 rounded-[26px] bg-[#0E1B0F] border border-[#1D381F] shadow-md hover:border-[#FF4B4B]/40 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF4B4B] shrink-0"></span>
                      <h2 className="text-base sm:text-lg text-white font-medium tracking-normal break-words">
                        {item.motif}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 pl-5 font-mono text-sm sm:text-base text-[#A4B8A6]">
                      <span>Amount:</span>
                      <span className="text-[#FF4B4B] font-mono text-lg font-semibold">
                        -{Number(item.somme).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {item.devise}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-2 shrink-0 pl-5 md:pl-0">
                    <span className="font-mono text-xs sm:text-sm text-[#A4B8A6] tracking-wide">
                      {formatDate(item.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF4B4B]/80 shadow-[0_0_8px_#FF4B4B]"></span>
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
            aria-label="Effectuer un retrait"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#76E381] text-[#050B05] flex items-center justify-center font-bold shadow-[0_0_35px_rgba(118,227,129,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-[#050B05]" />
          </button>
        </aside>

        {/* Modal Saisir un Retrait */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setIsModalOpen(false)}
            ></div>

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-[510px] bg-[#0E1B0F]/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#76E381]/30 text-white">
              <div className="flex items-center justify-between pb-5 border-b border-[#1D381F]">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Enter a Withdrawal
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-[#76E381] font-semibold block">Current Balance</span>
                  <span className="text-sm font-mono font-bold text-gray-200">
                    {currentAvailableBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleConfirmRetrait} className="mt-6 flex flex-col gap-4">
                {/* Champ 1: Motif */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-gray-400 font-medium" htmlFor="retrait-motif">
                    Reason for withdrawal
                  </label>
                  <input
                    id="retrait-motif"
                    type="text"
                    required
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder="ex: Achat matériel bureau"
                    className="w-full bg-[#050B05] border border-[#1D381F] rounded-2xl px-4 py-3 text-white text-base focus:border-[#76E381] focus:outline-none"
                  />
                </div>

                {/* Champ 2: Montant & Devise */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400 font-medium" htmlFor="retrait-montant">
                      Montant
                    </label>
                    <input
                      id="retrait-montant"
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={montant}
                      onChange={(e) => setMontant(e.target.value)}
                      placeholder="500"
                      className="w-full bg-[#050B05] border border-[#1D381F] rounded-2xl px-4 py-3 text-white text-base font-mono focus:border-[#76E381] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400 font-medium" htmlFor="retrait-devise">
                      Devise
                    </label>
                    <select
                      id="retrait-devise"
                      value={devise}
                      onChange={(e) => setDevise(e.target.value as any)}
                      className="w-full bg-[#050B05] border border-[#1D381F] rounded-2xl px-4 py-3 text-white text-base font-mono focus:border-[#76E381] focus:outline-none cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>
                </div>

                {/* Overdraft Check Notice */}
                <div className={`text-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between border ${
                  isOverdraft
                    ? 'bg-red-950/60 border-red-500/50 text-red-300'
                    : 'bg-[#142A17] border-[#76E381]/30 text-[#76E381]'
                }`}>
                  <span>Debit balance prohibited</span>
                  <span className="font-mono font-semibold">
                    {isOverdraft
                      ? `Prohibited deficit : ${remainingBalance.toFixed(2)} ${devise}`
                      : `Remaining balance : ${remainingBalance.toFixed(2)} ${devise}`}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    type="submit"
                    disabled={submitting || isOverdraft}
                    className={`w-full py-3.5 rounded-2xl text-[#050B05] text-base font-bold shadow-lg transition-all cursor-pointer ${
                      isOverdraft
                        ? 'bg-red-900/60 text-red-300 cursor-not-allowed opacity-80'
                        : 'bg-[#76E381] hover:bg-[#89E692] shadow-[0_0_20px_rgba(118,227,129,0.4)]'
                    }`}
                  >
                    {isOverdraft
                      ? 'Insufficient Funds (Anti-Overdraft)'
                      : submitting
                      ? 'Validation in progress...'
                      : 'Confirm Withdrawal'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-2.5 rounded-2xl text-[#A4B8A6] hover:text-white text-sm font-medium transition duration-200 text-center"
                  >
                    Cancel
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
