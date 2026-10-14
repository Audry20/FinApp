'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Wallet,
  ArrowDownLeft,
  Bell,
  Repeat,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
}

interface UserProfile {
  nom: string
  prenom: string
  email: string
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('nom, prenom, email')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        } else {
          setProfile({
            nom: user.user_metadata?.family_name || user.user_metadata?.nom || '',
            prenom: user.user_metadata?.given_name || user.user_metadata?.prenom || '',
            email: user.email || '',
          })
        }
      }
    }
    loadProfile()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Budget', href: '/budget', icon: Wallet },
    { name: 'Retrait', href: '/retrait', icon: ArrowDownLeft },
    { name: 'Annonces', href: '/annonces', icon: Bell },
    { name: 'Échange', href: '/echange', icon: Repeat },
    { name: 'Paramètres', href: '/parametres', icon: Settings },
  ]

  const userDisplayName = (() => {
    const prenom = profile?.prenom || profile?.email?.split('@')[0] || 'Utilisateur'
    return prenom
  })()

  return (
    <div className="min-h-screen bg-[#050B05] bg-radial from-[#122815]/30 to-transparent text-white flex flex-col antialiased overflow-x-hidden">
      <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-7 min-h-screen overflow-x-hidden">

        {/* Top Header */}
        <header className="flex items-center justify-between py-3 px-2 mb-4 lg:mb-6">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-[#0E1B0F] border border-[#1D381F] text-[#76E381] hover:bg-[#142A17] transition-colors focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#76E381] shadow-[0_0_12px_#76E381]"></span>
              Finance <span className="text-[#A4B8A6] font-normal text-sm sm:text-base">App</span>
            </Link>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-[#0E1B0F]/80 border border-[#1D381F] backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg">
              <span className="text-xs sm:text-sm text-[#A4B8A6] font-medium tracking-wide max-w-[150px] sm:max-w-[200px] truncate">
                {userDisplayName}
              </span>
              <div className="w-8 h-8 rounded-full border border-[#76E381]/40 bg-[#1D381F] flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5 text-[#A4B8A6]" />
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Déconnexion"
              className="p-2 rounded-full bg-[#0E1B0F] border border-[#1D381F] text-[#FF4B4B] hover:bg-[#1D381F] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Layout */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 bg-[#0E1B0F] border border-[#1D381F] rounded-[28px] p-4 sm:p-5 shadow-2xl backdrop-blur-sm sticky top-6">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#76E381] text-[#050B05] font-semibold shadow-[0_0_20px_rgba(118,227,129,0.35)]'
                        : 'text-[#A4B8A6] hover:text-white hover:bg-[#1D381F]/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#050B05]' : 'text-[#A4B8A6]'}`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          {/* Mobile Overlay Menu / Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              ></div>

              {/* Menu Drawer */}
              <div className="relative w-72 max-w-[80%] bg-[#0E1B0F] border-r border-[#1D381F] h-full p-6 flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#76E381]"></span>
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-[#A4B8A6] hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="space-y-3 flex-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-base font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-[#76E381] text-[#050B05] font-semibold shadow-[0_0_20px_rgba(118,227,129,0.35)]'
                            : 'text-[#A4B8A6] hover:text-white hover:bg-[#1D381F]/40'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#050B05]' : 'text-[#A4B8A6]'}`} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>

                <div className="pt-6 border-t border-[#1D381F]">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 font-medium text-sm hover:bg-red-900/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Page Main Content */}
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}
