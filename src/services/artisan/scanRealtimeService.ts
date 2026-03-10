import { supabase } from "@/api/api"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Scan, Facade } from "@/types/scansTypes"

export type FacadeUpdateCallback = (facade: Facade, isNew: boolean) => void
export type ScanUpdateCallback = (scan: Partial<Scan>) => void

export class ScanRealtimeService {
    private facadesChannel: RealtimeChannel | null = null
    private scanChannel: RealtimeChannel | null = null

    /**
     * Fetch a single facade by ID with its business relation
     */
    async fetchFacadeById(facadeId: string): Promise<Facade | null> {
        try {
            const { data, error } = await supabase
                .from("facades")
                .select(`
                    id,
                    address,
                    location,
                    score,
                    surface_m2,
                    streetview_url,
                    types,
                    metadata,
                    detected_at,
                    facade_number,
                    business_id,
                    streetview_metadata,
                    simulated_image_url,
                    score_breakdown,
                    derived_from_scan_hash,
                    source,
                    created_at,
                    updated_at,
                    formatted_address,
                    formatted_phone_number,
                    website,
                    international_phone_number,
                    business:businesses_cache (
                        id,
                        external_id,
                        name,
                        business_type,
                        address,
                        location,
                        metadata
                    )
                `)
                .eq("id", facadeId)
                .single()

            if (error) {
                console.error("Error fetching facade:", error)
                return null
            }

            // Transform the data to match Facade type
            const businessData = Array.isArray(data.business) ? data.business[0] : data.business
            
            const facade: Facade = {
                ...data,
                business: businessData || undefined,
                scan: null,
                businesses_cache: businessData ? { name: businessData.name } : { name: '' }
            }

            return facade
        } catch (error) {
            console.error("Error in fetchFacadeById:", error)
            return null
        }
    }

    /**
     * Subscribe to new facades being added to a scan
     */
    subscribeToScanFacades(
        scanId: string,
        onFacadeChange: FacadeUpdateCallback
    ): void {
        // Clean up existing subscription
        this.unsubscribeFromFacades()

        console.log(`[Realtime] Setting up subscription for scan: ${scanId}`)

        this.facadesChannel = supabase
            .channel(`scan_facades_${scanId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'scan_facades',
                    filter: `scan_id=eq.${scanId}`
                },
                async (payload) => {
                    console.log('[Realtime] New scan_facade detected:', payload)
                    const newRecord = payload.new as { facade_id: string }
                    if (newRecord.facade_id) {
                        console.log(`[Realtime] Fetching facade data for: ${newRecord.facade_id}`)
                        const facade = await this.fetchFacadeById(newRecord.facade_id)
                        if (facade) {
                            console.log('[Realtime] Facade fetched successfully:', facade)
                            onFacadeChange(facade, true)
                        } else {
                            console.warn('[Realtime] Failed to fetch facade data')
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'scan_facades',
                    filter: `scan_id=eq.${scanId}`
                },
                async (payload) => {
                    console.log('[Realtime] Scan_facade updated:', payload)
                    const updatedRecord = payload.new as { facade_id: string }
                    if (updatedRecord.facade_id) {
                        const facade = await this.fetchFacadeById(updatedRecord.facade_id)
                        if (facade) {
                            console.log('[Realtime] Updated facade fetched:', facade)
                            onFacadeChange(facade, false)
                        }
                    }
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('[Realtime] Subscription error:', err)
                } else {
                    console.log('[Realtime] Facades subscription status:', status)
                    if (status === 'SUBSCRIBED') {
                        console.log('[Realtime] ✅ Successfully subscribed to scan_facades changes')
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('[Realtime] ❌ Channel error - check if realtime is enabled in Supabase')
                    } else if (status === 'TIMED_OUT') {
                        console.error('[Realtime] ❌ Subscription timed out')
                    }
                }
            })
    }

    /**
     * Subscribe to scan status changes
     */
    subscribeToScanStatus(
        scanId: string,
        onScanUpdate: ScanUpdateCallback
    ): void {
        // Clean up existing subscription
        this.unsubscribeFromScanStatus()

        this.scanChannel = supabase
            .channel(`scan_status_${scanId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'scans',
                    filter: `id=eq.${scanId}`
                },
                (payload) => {
                    console.log('Scan status updated:', payload)
                    const updatedScan = payload.new as Partial<Scan>
                    onScanUpdate(updatedScan)
                }
            )
            .subscribe((status) => {
                console.log('Scan status realtime subscription status:', status)
            })
    }

    /**
     * Unsubscribe from facades channel
     */
    unsubscribeFromFacades(): void {
        if (this.facadesChannel) {
            supabase.removeChannel(this.facadesChannel)
            this.facadesChannel = null
        }
    }

    /**
     * Unsubscribe from scan status channel
     */
    unsubscribeFromScanStatus(): void {
        if (this.scanChannel) {
            supabase.removeChannel(this.scanChannel)
            this.scanChannel = null
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll(): void {
        this.unsubscribeFromFacades()
        this.unsubscribeFromScanStatus()
    }
}

export const ScanRealtimeServiceInstance = new ScanRealtimeService()
