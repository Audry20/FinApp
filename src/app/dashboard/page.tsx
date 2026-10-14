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
            <p className="text-xs sm:text-sm text-[#A4B8A6] mt-1">Overview of your cash reserves</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#0E1B0F] border border-[#1D381F] text-[#76E381] hover:bg-[#142A17] transition-colors flex items-center gap-2 text-xs sm:text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Multi-Currency Cards Grid */}
        <section aria-label="Soldes multi-devises" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          {/* USD Card */}
          <article className="min-w-0 bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-3 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#A4B8A6] font-medium leading-tight break-words">USD balance</span>
              <span className="text-[9px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#1D381F] text-[#76E381] whitespace-nowrap">USD ($)</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors break-all">
              ${formatAmount(balances.USD)}
            </div>
          </article>

          {/* EUR Card */}
          <article className="min-w-0 bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-3 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#A4B8A6] font-medium leading-tight break-words">Euro balance</span>
              <span className="text-[9px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#1D381F] text-[#76E381] whitespace-nowrap">EUR (€)</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors break-all">
              €{formatAmount(balances.EUR)}
            </div>
          </article>

          {/* GBP Card */}
          <article className="min-w-0 bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-3 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#A4B8A6] font-medium leading-tight break-words">Pounds balance</span>
              <span className="text-[9px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#1D381F] text-[#76E381] whitespace-nowrap">GBP (£)</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors break-all">
              £{formatAmount(balances.GBP)}
            </div>
          </article>

          {/* TRY Card */}
          <article className="min-w-0 bg-[#0E1B0F] border border-[#1D381F] hover:border-[#76E381]/50 rounded-2xl p-3 sm:p-5 shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[#A4B8A6] font-medium leading-tight break-words">Turkish Lira balance</span>
              <span className="text-[9px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#1D381F] text-[#76E381] whitespace-nowrap">TRY (₺)</span>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono tracking-tight text-white group-hover:text-[#76E381] transition-colors break-all">
              TL {formatAmount(balances.TRY)}
            </div>
          </article>
        </section>

        {/* Recent Transactions List */}
        <section aria-label="Transactions récentes" className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-wider text-[#A4B8A6] uppercase">Recent Transactions</h2>
            <span className="text-xs text-[#7F9781]">Overall history</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-[24px] bg-[#0E1B0F]/50 border border-[#1D381F] animate-pulse"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-[#0E1B0F]/40 border border-[#1D381F]/70 rounded-[24px] p-8 text-center text-sm font-mono text-[#7F9781]">
              No transactions recorded.
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
