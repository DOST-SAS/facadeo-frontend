import { Link } from "react-router-dom"
import { ArrowLeft, ScanLine, Activity, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn, statusBadgeConfig } from "@/lib/utils"
import type { Scan } from "@/types/scansTypes"

interface ScanHeaderProps {
    scan?: Scan
    isRunning: boolean
    notifyEnabled: boolean
    isSubscribing: boolean
    onNotifyToggle: () => void
}

export function ScanHeader({ scan, isRunning, notifyEnabled, isSubscribing, onNotifyToggle }: ScanHeaderProps) {
    return (
        <>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/scans">Scans</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Résultat du scan</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-3 mb-2">
                    <Link to="/scans">
                        <ArrowLeft className="h-6 w-6 text-foreground bg-muted rounded-full p-1 hover:bg-primary/10 transition-colors" />
                    </Link>
                    <h1 className="text-lg md:text-3xl font-bold text-foreground/70">
                        {scan?.name}
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {scan?.status && statusBadgeConfig[scan.status] && (() => {
                        const StatusIcon = statusBadgeConfig[scan.status].icon
                        const isAnimated = scan.status === 'running' || scan.status === 'pending'
                        return (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium tracking-wide rounded-lg border transition-all",
                                    statusBadgeConfig[scan.status].className
                                )}
                            >
                                <StatusIcon className={cn("h-3.5 w-3.5", isAnimated && "animate-spin")} />
                                {statusBadgeConfig[scan.status].label}
                            </span>
                        )
                    })()}
                    {/* {isRunning && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNotifyToggle}
                            disabled={isSubscribing}
                            className="gap-1.5"
                        >
                            {notifyEnabled ? (
                                <>
                                    <BellOff className="h-4 w-4" />
                                    <span>Notifications activées</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="h-4 w-4" />
                                    <span>Me notifier</span>
                                </>
                            )}
                        </Button>
                    )} */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <ScanLine className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{scan?.facades?.length || 0}</span>
                        <span>façades détectées</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>Score moyen:</span>
                        <span className="font-semibold text-foreground">
                            {scan?.facades && scan.facades.length > 0
                                ? (scan.facades.reduce((acc, f) => acc + (f.score || 0), 0) / scan.facades.length).toFixed(0)
                                : '0'}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
