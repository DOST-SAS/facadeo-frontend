import { useRef } from "react"
import { Plus, Minus, Crosshair, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import GoogleMap, { type GoogleMapRef } from "@/components/GoogleMap"

export interface MapFacade {
    id: string
    name: string
    coordinates: { lat: number; lng: number }
    address: string
    types: string[]
    score?: number
}

interface ScanMapSectionProps {
    facades: MapFacade[]
    center: { lat: number; lng: number }
    radius: number
    loading: boolean
    isScanning?: boolean
}

export function ScanMapSection({ facades, center, radius, loading, isScanning = false }: ScanMapSectionProps) {
    const mapRef = useRef<GoogleMapRef>(null)

    return (
        <section className="flex-1 min-w-0">
            <div className={`relative rounded-xl border w-full h-96 lg:h-full overflow-hidden ${isScanning
                ? 'border-primary/60 shadow-[inset_0_0_0_2px_rgba(var(--primary),0.3)] animate-[shadow-pulse_2s_ease-in-out_infinite]'
                : 'border-border/50'
                }`}>
                {/* Inner container with background */}
                <div className="relative w-full h-full bg-muted/30 overflow-hidden">
                    {/* Animated scanning overlay */}
                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none z-5">
                            {/* Pulsing inset glow */}
                            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(var(--primary),0.15)] animate-pulse" />
                            {/* Rotating gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[scan-sweep_3s_ease-in-out_infinite]" />
                        </div>
                    )}
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-3"></div>
                                <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
                            </div>
                        </div>
                    ) : (
                        <GoogleMap
                            ref={mapRef}
                            center={center}
                            zoom={14}
                            radius={radius}
                            facades={facades}
                            className="w-full h-full"
                        />
                    )}


                    {/* Enhanced Ultra-Minimalist Horizontal Legend */}
                    <div className="absolute w-[65%] bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-5 px-5 py-2.5 rounded-full bg-secondary shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-border z-20 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:border-border/80">

                        <div className="flex items-center justify-center w-full gap-3">
                            <div className="flex items-center gap-3 group cursor-default">
                                <div className="relative">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-transform duration-300 group-hover:scale-125" />
                                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-20" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-bold text-emerald-500/90 uppercase tracking-wider">Bon</span>
                                    <span className="text-[11px] font-mono font-medium text-foreground/60 tabular-nums">75-100</span>
                                </div>
                            </div>

                            <div className="w-px h-4 bg-border/40" />

                            <div className="flex items-center gap-3 group cursor-default">
                                <div className="relative">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-transform duration-300 group-hover:scale-125" />
                                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-yellow-500 animate-ping opacity-20" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-bold text-yellow-500/90 uppercase tracking-wider">Moyen</span>
                                    <span className="text-[11px] font-mono font-medium text-foreground/60 tabular-nums">40-75</span>
                                </div>
                            </div>

                            <div className="w-px h-4 bg-border/40" />

                            <div className="flex items-center gap-3 group cursor-default">
                                <div className="relative">
                                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] transition-transform duration-300 group-hover:scale-125" />
                                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-red-500 animate-ping opacity-20" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-bold text-red-500/90 uppercase tracking-wider">Critique</span>
                                    <span className="text-[11px] font-mono font-medium text-foreground/60 tabular-nums">0-40</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Animation keyframes */}
            <style>{`
                @keyframes shadow-pulse {
                    0%, 100% { 
                        box-shadow: inset 0 0 0 2px rgba(var(--primary), 0.3),
                                    inset 0 0 20px rgba(var(--primary), 0.1);
                    }
                    50% { 
                        box-shadow: inset 0 0 0 3px rgba(var(--primary), 0.5),
                                    inset 0 0 40px rgba(var(--primary), 0.2);
                    }
                }
                @keyframes scan-sweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </section>
    )
}
