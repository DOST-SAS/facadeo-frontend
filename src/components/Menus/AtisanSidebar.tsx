import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, CreditCard, Settings, Zap, CirclePlus, ChevronLeft, ChevronRight, ScanText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { useTheme } from "../theme-provider"
import { PlansModel } from "../PlansModel"
import { useAuth } from "@/context/AuthContext"
import { AbonnementServiceInstance } from "@/services/artisan/Abonemmentsservices"

const navigation = [
  { name: "Tableau de bord", href: "/artisan", icon: LayoutDashboard },
  { name: "Scans", href: "/scans", icon: ScanText },
  { name: "Devis", href: "/devis", icon: FileText },
  { name: "Abonnement", href: "/abonnement", icon: CreditCard },
  { name: "Paramètres", href: "/parametres", icon: Settings },
]

export function ArtisanSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const [open, setOpen] = useState(true)
  const { theme } = useTheme()
  const [plansModel, setPlansModel] = useState(false)
  const { user, refreshUser } = useAuth()
  const [maxCredits, setMaxCredits] = useState(0)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  const creditBalance = user?.credit_balance ?? 0

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) return
      try {
        const { data } = await AbonnementServiceInstance.getCurrentSubscription(user.id)
        if (data?.plans?.monthly_credit) {
          setMaxCredits(data.plans.monthly_credit)
          setHasActiveSubscription(true)
        } else {
          setHasActiveSubscription(false)
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
        setHasActiveSubscription(false)
      }
    }
    fetchSubscription()
  }, [user?.id])

  // Poll for credit balance updates every 10 seconds
  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      refreshUser()
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [user?.id, refreshUser])

  const progressValue = maxCredits > 0 ? (creditBalance / maxCredits) * 100 : 0

  return (
    <aside className={cn("h-screen hidden sm:flex flex-col bg-card shadow-xl! transition-all duration-200 z-50 relative", open ? "w-16 md:w-56" : "w-16")}>
      {/* close open toggle */}
      <button className=" absolute top-4 -right-3 bg-background rounded-full p-1 hover:bg-primary hover:text-primary-foreground transition-all duration-200"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* Logo */}
      <div className={cn("flex items-center  gap-2 py-6  transition-all duration-200 px-2! justify-center  md:justify-start", open ? "px-6 justify-start" : "px-2 justify-center ")}>
        {theme === "dark" ? (
          <img src="/whiteLogo.png" alt="" className="rounded-full h-10 w-10 border border-border" />
        ) : (
          <img src="/darkLogo.png" alt="" className="rounded-full h-10 w-10 border border-border" />
        )}
        {open && (
          <h1 className="hidden md:block text-lg font-bold text-foreground">FAÇADEO</h1>
        )}
      </div>


      {/* Navigation */}
      <nav className={cn(" flex-1  transition-all duration-200 px-2! ", open ? "px-4 py-6" : "px-2 py-2")}>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (

              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  open ? "justify-start" : "justify-center"
                )}
              >
                <item.icon className="h-5 w-5" />
                {open && (
                  <span className="hidden md:block">{item.name}</span>
                )}
              </Link>
            )
          })}
        </ul>
      </nav>

      {/* Credits Section */}
      <div className="p-2">
        <div className={cn("rounded-sm border border-border bg-secondary/20 p-1 md:p-2 ", open ? "p-2" : "p-1")}>
          {/* Header with icon, title and amount */}
          <div className={cn("mb-3 flex items-center justify-center! md:justify-between!", open ? "justify-between" : "justify-center")}>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary fill-primary" />
              {open && (
                <span className="hidden md:block ml-2">Crédits</span>
              )}
            </div>
            {open && (
              <span className="hidden md:block text-md font-bold text-foreground bg-muted px-2  rounded-full">{creditBalance} </span>
            )}
          </div>

          {/* Recharge Button */}
          <Button
            variant="outline"
            className="w-full rounded-sm border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary dark:hover:text-primary transition-all duration-200"
            onClick={() => setPlansModel(true)}
          >
            <CirclePlus className="h-4 w-4 " />
            {open && (
              <span className="hidden md:block font-semibold">
                {hasActiveSubscription ? "Recharger" : "S'abonner"}
              </span>
            )}
          </Button>
        </div>
      </div>

      <PlansModel open={plansModel} onOpenChange={setPlansModel} />
    </aside>
  )
}
