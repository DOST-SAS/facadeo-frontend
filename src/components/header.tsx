
import { Search, User, FileText, ScanLine, Settings, LogOut, CircleFadingPlus, Loader2, Building } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { Link } from "react-router-dom"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn, statusBadgeConfig } from "@/lib/utils"
import { GlobalSearchServiceInstance } from "@/services/artisan/globalSearchService"
import type { SearchResult } from "@/services/artisan/globalSearchService"
import ArtisanNotifications from "../features/Artisan/notifications/ArtisanNotifications"


export function Header() {
  const { user, signOut } = useAuth()

  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2 && user?.id) {
        setIsSearching(true);
        setShowResults(true);
        try {
          if (user.role === "artisan") {
            const results = await GlobalSearchServiceInstance.ArtisanSearch(searchQuery, user.id);
            setSearchResults(results);
          } else {
            const results = await GlobalSearchServiceInstance.AdminSearch(searchQuery);
            setSearchResults(results);
          }
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        if (searchQuery.length < 2) setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.id]);


  return (
    <header className="bg-card shadow-lg hidden md:block">
      {/* desktop header */}
      <div className="container mx-auto flex h-16 items-center justify-between px-8">
        {/* Search Bar */}
        <div className="relative w-full max-w-sm rounded-sm z-50">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            autoComplete="off"
            placeholder="Rechercher scans, façades, devis..."
            className="pl-10 rounded-sm border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.length >= 2) setShowResults(true) }}
          />

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-lg rounded-md overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="animate-spin" />Recherche en cours...</div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto py-2">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      to={result.url}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className={cn("p-2 rounded-full shrink-0",
                        result.type === 'scan' && "bg-primary/10 text-primary",
                        result.type === 'facade' && "bg-accent/10 text-accent",
                        result.type === 'devis' && "bg-success/10 text-success",
                      )}>
                        {result.type === 'scan' && <ScanLine className="h-4 w-4" />}
                        {result.type === 'facade' && <Building className="h-4 w-4" />}
                        {result.type === 'devis' && <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      {result.status && statusBadgeConfig[result.status] ? (
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider shrink-0", statusBadgeConfig[result.status].className)}>
                          {statusBadgeConfig[result.status].label}
                        </div>
                      ) : result.status ? (
                        <span className="text-xs text-muted-foreground">{result.status}</span>
                      ) : null}
                      {result.score && (
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider shrink-0",
                          result.score >= 75 ? statusBadgeConfig.completed.className :
                            result.score >= 40 ? statusBadgeConfig.pending.className :
                              statusBadgeConfig.failed.className
                        )}>
                          {result.score}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">Aucun résultat trouvé</div>
              )}
            </div>
          )}

          {/* Overlay to close search on click outside */}
          {showResults && (
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowResults(false)}></div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-5">
          {user?.role === "artisan" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/scans/create"
                    className={cn(
                      "flex items-center  bg-primary/10 hover:bg-primary/20 text-primary justify-center p-2 rounded-sm transition-all duration-300 group relative overflow-hidden",
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out",
                    )} />
                    <CircleFadingPlus className={cn(
                      "h-5 w-5 transition-transform duration-300",
                    )} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Création d'un scan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )

          }
          {/* Notifications Popover */}
          <ArtisanNotifications />

          <ModeToggle />
          {/* User Profile */}
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.display_name.charAt(0).toUpperCase() + user.display_name.charAt(1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 pb-2" align="end" forceMount >
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.display_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Separator className="my-2" />
                <div className="p-1">
                  <Link to={`${user.role ==="artisan" ? "" : "admin"}/parametres`} className="flex items-center hover:bg-primary/10 rounded-sm w-full justify-start h-9 px-2 text-sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                  <button
                    className="flex  items-center cursor-pointer rounded-sm w-full justify-start h-9 px-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                    onClick={signOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
