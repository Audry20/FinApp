'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'

interface Transaction {
  id: string
  type: 'AJOUT' | 'RETRAIT'
  somme: number
  devise: 'USD' | 'EUR' | 'GBP' | 'TRY'
  motif: string
  created_at: string
}

export default function DashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balances, setBalances] = useState({
    USD: 0,
    EUR: 0,
    GBP: 0,
    TRY: 0,
  })

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement transactions:', error)
      setLoading(false)
      return
    }

    const txs: Transaction[] = data || []
    setTransactions(txs)

    // Compute balances per currency
    const newBalances = { USD: 0, EUR: 0, GBP: 0, TRY: 0 }
    txs.forEach((tx) => {
      const amount = Number(tx.somme) || 0
      if (tx.type === 'AJOUT') {
        newBalances[tx.devise] += amount
      } else if (tx.type === 'RETRAIT') {
        newBalances[tx.devise] -= amount
      }
    })

    setBalances(newBalances)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatCurrencySymbol = (devise: string) => {
    switch (devise) {
      case 'USD': return '$'
      case 'EUR': return '€'
      case 'GBP': return '£'
      case 'TRY': return 'TL '
      default: return ''
    }
  }

  const formatAmount = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
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

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header Title & Refresh */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-xs sm:text-sm text-[#A4B8A6] mt-1">Vue d'ensemble de vos réserves de trésorerie</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#0E1B0F] border border-[#1D381F] text-[#76E381] hover:bg-[#142A17] transition-colors flex items-center gap-2 text-xs sm:text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Multi-Currency Cards Grid */}
        <section aria-label="Soldes multi-devises" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* USD Card */}
          <article className="bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-[#A4B8A6] font-medium">Solde USD</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1D381F] text-[#76E381]">USD ($)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors">
              ${formatAmount(balances.USD)}
            </div>
          </article>

          {/* EUR Card */}
          <article className="bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-[#A4B8A6] font-medium">Solde Euro</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1D381F] text-[#76E381]">EUR (€)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors">
              €{formatAmount(balances.EUR)}
            </div>
          </article>

          {/* GBP Card */}
          <article className="bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-[#A4B8A6] font-medium">Solde Pounds</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1D381F] text-[#76E381]">GBP (£)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors">
              £{formatAmount(balances.GBP)}
            </div>
          </article>

          {/* TRY Card */}
          <article className="bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-4 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-[#A4B8A6] font-medium">Solde Turkish Lira</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1D381F] text-[#76E381]">TRY (₺)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors">
              TL {formatAmount(balances.TRY)}
            </div>
          </article>
        </section>

        {/* Recent Transactions List */}
        <section aria-label="Transactions récentes" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-wider text-[#A4B8A6] uppercase">Transactions Récentes</h2>
            <span className="text-xs text-[#7F9781]">Historique global</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-[24px] bg-[#0E1B0F]/50 border border-[#1D381F] animate-pulse"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-[#0E1B0F]/40 border border-[#1D381F]/70 rounded-[24px] p-8 text-center text-sm font-mono text-[#7F9781]">
              Aucune transaction enregistrée.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 8).map((tx) => (
                <article
                  key={tx.id}
                  className="bg-[#0E1B0F] border border-[#1D381F] rounded-[24px] p-5 sm:p-6 shadow-md hover:border-[#1D381F]/90 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-mono font-medium text-white tracking-wide">
                        {tx.motif || (tx.type === 'AJOUT' ? 'Ajout de capital' : 'Retrait')}
                      </h3>
                      <p className="font-mono text-sm sm:text-base text-[#A4B8A6]">
                        Amount:{' '}
                        <span className={`font-semibold ${tx.type === 'AJOUT' ? 'text-[#76E381]' : 'text-[#FF4B4B]'}`}>
                          {tx.type === 'AJOUT' ? '+' : '-'}{formatAmount(Number(tx.somme))}
                        </span>{' '}
                        <span className="text-[#A4B8A6]">{tx.devise}</span>
                      </p>
                    </div>
                    <div className="text-right sm:self-end">
                      <time className="font-mono text-xs sm:text-sm text-[#A4B8A6] block">
                        {formatDate(tx.created_at)}
                      </time>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
