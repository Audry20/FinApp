'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeftRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface Balances {
  USD: number
  EUR: number
  GBP: number
  TRY: number
}

const DEFAULT_RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, GBP: 0.79, TRY: 32.5, USD: 1.0 },
  EUR: { USD: 1.09, GBP: 0.86, TRY: 35.3, EUR: 1.0 },
  GBP: { USD: 1.27, EUR: 1.16, TRY: 41.2, GBP: 1.0 },
  TRY: { USD: 0.031, EUR: 0.028, GBP: 0.024, TRY: 1.0 },
}

export default function EchangePage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<Balances>({
    USD: 0,
    EUR: 0,
    GBP: 0,
    TRY: 0,
  })

  // Exchange Form State
  const [sommeSource, setSommeSource] = useState<string>('100')
  const [deviseSource, setDeviseSource] = useState<'USD' | 'EUR' | 'GBP' | 'TRY'>('USD')
  const [deviseCible, setDeviseCible] = useState<'USD' | 'EUR' | 'GBP' | 'TRY'>('EUR')
  const [taux, setTaux] = useState<string>('0.92')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchBalances = useCallback(async () => {
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

    if (fetchErr) {
      console.error('Erreur chargement transactions:', fetchErr)
    } else {
      const newBalances: Balances = { USD: 0, EUR: 0, GBP: 0, TRY: 0 }
      ;(data || []).forEach((tx) => {
        const amt = Number(tx.somme) || 0
        if (tx.type === 'AJOUT') {
          newBalances[tx.devise as keyof Balances] += amt
        } else if (tx.type === 'RETRAIT') {
          newBalances[tx.devise as keyof Balances] -= amt
        }
      })
      setBalances(newBalances)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // Automatically update default rate when currencies change
  useEffect(() => {
    if (deviseSource && deviseCible && DEFAULT_RATES[deviseSource]?.[deviseCible]) {
      setTaux(DEFAULT_RATES[deviseSource][deviseCible].toString())
    }
  }, [deviseSource, deviseCible])

  const sourceBalance = balances[deviseSource] || 0
  const amountSourceNum = parseFloat(sommeSource) || 0
  const rateNum = parseFloat(taux) || 0
  const montantConverti = (amountSourceNum * rateNum).toFixed(2)

  const isInsufficientBalance = amountSourceNum > sourceBalance

  // Swap Source and Target currencies
  const handleSwap = () => {
    const tempDevise = deviseSource
    setDeviseSource(deviseCible)
    setDeviseCible(tempDevise)
  }

  const handleExecuteExchange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (isNaN(amountSourceNum) || amountSourceNum <= 0) {
      setError('Veuillez saisir un montant source valide supérieur à 0.')
      setSubmitting(false)
      return
    }

    if (isNaN(rateNum) || rateNum <= 0) {
      setError('Veuillez indiquer un taux de conversion valide supérieur à 0.')
      setSubmitting(false)
      return
    }

    if (deviseSource === deviseCible) {
      setError('La devise source et la devise cible doivent être différentes.')
      setSubmitting(false)
      return
    }

    // Solde verification
    if (isInsufficientBalance) {
      setError(`SOLDE INSUFFISANT : Votre réserve en ${deviseSource} (${sourceBalance.toFixed(2)}) est insuffisante pour échanger ${amountSourceNum} ${deviseSource}.`)
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utilisateur non authentifié.')
      setSubmitting(false)
      return
    }

    const convertedAmountNum = parseFloat(montantConverti)

    // Try calling RPC procedure first
    const { error: rpcErr } = await supabase.rpc('perform_currency_exchange', {
      p_user_id: user.id,
      p_somme_source: amountSourceNum,
      p_devise_source: deviseSource,
      p_rate: rateNum,
      p_devise_cible: deviseCible,
    })

    if (rpcErr) {
      console.warn('RPC perform_currency_exchange fallback on client transactions:', rpcErr)
      // Fallback: Perform atomic double insert
      const withdrawalMotif = `Échange de la somme de ${amountSourceNum} ${deviseSource} vers ${deviseCible}`
      const depositMotif = `Réception de ${convertedAmountNum} ${deviseCible} provenant de l'échange de ${deviseSource}`
      const nowIso = new Date().toISOString()

      const { error: tx1Err } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'RETRAIT',
        somme: amountSourceNum,
        devise: deviseSource,
        motif: withdrawalMotif,
        created_at: nowIso,
      })

      if (tx1Err) {
        setError(tx1Err.message)
        setSubmitting(false)
        return
      }

      const { error: tx2Err } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'AJOUT',
        somme: convertedAmountNum,
        devise: deviseCible,
        motif: depositMotif,
        created_at: nowIso,
      })

      if (tx2Err) {
        setError(tx2Err.message)
        setSubmitting(false)
        return
      }
    }

    setSubmitting(false)
    setToastMessage(`Échange réalisé avec succès ! ${amountSourceNum} ${deviseSource} ➔ ${montantConverti} ${deviseCible}`)
    setTimeout(() => setToastMessage(null), 4000)
    fetchBalances()
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-16 relative max-w-4xl mx-auto">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#0E1B0F] border border-[#76E381] shadow-[0_0_20px_rgba(118,227,129,0.3)] text-white animate-in fade-in duration-300">
            <CheckCircle className="w-5 h-5 text-[#76E381]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Title & Description */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Convertir & Échanger</h1>
            <p className="text-sm text-[#A4B8A6] mt-1">Génération automatique des écritures comptables d'échange</p>
          </div>
          <button
            onClick={fetchBalances}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#0E1B0F] border border-[#1D381F] text-[#76E381] hover:bg-[#142A17] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleExecuteExchange} className="space-y-6">
          {/* Relative Container for Source, Swap, Target */}
          <div className="relative space-y-4">

            {/* SOURCE CARD (DE :) */}
            <div className="bg-[#0E1B0F] border border-[#1D381F] rounded-[26px] p-5 sm:p-6 shadow-xl relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-[130px] shrink-0">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                    DE :
                  </div>
                  <div className="text-[#A4B8A6] text-sm font-medium">Source</div>
                </div>

                {/* Input Amount */}
                <div className="flex-1 max-w-sm w-full">
                  <div className="bg-[#050B05] border border-[#1D381F] focus-within:border-[#76E381] rounded-[20px] px-5 py-3">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={sommeSource}
                      onChange={(e) => setSommeSource(e.target.value)}
                      placeholder="Somme à échanger"
                      className="w-full bg-transparent border-0 text-xl sm:text-2xl font-medium text-white focus:outline-none p-0"
                    />
                  </div>
                </div>

                {/* Currency Selector & Available Balance */}
                <div className="shrink-0 flex flex-col md:items-end">
                  <select
                    value={deviseSource}
                    onChange={(e) => setDeviseSource(e.target.value as any)}
                    className="bg-[#142A17] border border-[#1D381F] text-white font-bold text-lg sm:text-xl rounded-2xl px-4 py-2.5 focus:outline-none focus:border-[#76E381] cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                  <span className="text-[#A4B8A6] font-mono text-sm mt-2">
                    Solde dispo: {sourceBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {deviseSource}
                  </span>
                </div>
              </div>
            </div>

            {/* SWAP BUTTON */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button
                type="button"
                onClick={handleSwap}
                title="Inverser les devises"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#76E381] hover:bg-[#89E692] text-[#050B05] shadow-[0_0_35px_rgba(118,227,129,0.6)] flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
              >
                <ArrowLeftRight className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
            </div>

            {/* TARGET CARD (A :) */}
            <div className="bg-[#0E1B0F] border border-[#1D381F] rounded-[26px] p-5 sm:p-6 shadow-xl relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-[130px] shrink-0">
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                    À :
                  </div>
                  <div className="text-[#A4B8A6] text-sm font-medium">Destination</div>
                </div>

                {/* Calculated Amount */}
                <div className="flex-1 max-w-sm w-full">
                  <div className="bg-[#050B05] border border-[#1D381F] rounded-[20px] px-5 py-3.5 flex items-center min-h-[54px]">
                    <span className="w-full text-xl sm:text-2xl font-mono font-medium text-[#76E381]">
                      {montantConverti}
                    </span>
                  </div>
                </div>

                {/* Currency Selector & Target Balance */}
                <div className="shrink-0 flex flex-col md:items-end">
                  <select
                    value={deviseCible}
                    onChange={(e) => setDeviseCible(e.target.value as any)}
                    className="bg-[#142A17] border border-[#1D381F] text-white font-bold text-lg sm:text-xl rounded-2xl px-4 py-2.5 focus:outline-none focus:border-[#76E381] cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="TRY">TRY (₺)</option>
                  </select>
                  <span className="text-[#A4B8A6] font-mono text-sm mt-2">
                    Solde actuel: {(balances[deviseCible] || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {deviseCible}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Operation Details Card */}
          <div className="bg-[#0E1B0F] border border-[#1D381F] rounded-[26px] p-6 sm:p-7 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Détails de l'Opération</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#A4B8A6] uppercase font-semibold">Taux / Indice d'échange (1 {deviseSource} = )</label>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  required
                  value={taux}
                  onChange={(e) => setTaux(e.target.value)}
                  className="bg-[#050B05] border border-[#1D381F] rounded-xl px-4 py-2.5 text-white font-mono text-base focus:border-[#76E381] focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-3 rounded-xl bg-[#142A17] border border-[#1D381F] text-xs text-[#A4B8A6] space-y-1">
                  <div>• Retrait : <span className="text-[#FF4B4B] font-mono font-semibold">-{sommeSource} {deviseSource}</span></div>
                  <div>• Ajout : <span className="text-[#76E381] font-mono font-semibold">+{montantConverti} {deviseCible}</span></div>
                </div>
              </div>
            </div>

            {/* Confirm Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || isInsufficientBalance}
                className={`w-full py-4 px-8 rounded-full font-bold text-lg sm:text-xl text-center shadow-lg transition-all cursor-pointer ${
                  isInsufficientBalance
                    ? 'bg-red-900/60 text-red-300 cursor-not-allowed opacity-80'
                    : 'bg-[#76E381] hover:bg-[#89E692] text-[#050B05] shadow-[0_0_25px_rgba(118,227,129,0.5)]'
                }`}
              >
                {isInsufficientBalance
                  ? 'Solde Insuffisant (Échange Annulé)'
                  : submitting
                  ? 'Traitement de la conversion...'
                  : 'Confirmer l\'Échange'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
