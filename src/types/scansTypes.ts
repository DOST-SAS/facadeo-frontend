export interface Scan {
    id: string
    name: string
    slug: string
    status: "pending" | "running" | "paused" | "completed" | "failed" | "canceled"
    created_at: string
    address_text?: string
    center?: string
    radius_meters?: number
    radius?: number
    facadesCount: number
    estimated_cost_credits?: number
    actual_cost_credits?: number
    totalCredits?: number
    score?: number
    facades?: Facade[]
    businesses?: Business[]
    profile_id?: string
}

export interface Business {
    id: string
    name: string
    business_type: string
    address: string
    location: any
    metadata: Record<string, any>
}

export interface Facade {
    id: string
    business_id: string | null
    location: any
    address: Record<string, any>
    streetview_url: string | null
    streetview_metadata: Record<string, any> | null
    simulated_image_url: string | null
    score: number | null
    score_breakdown: Record<string, any> | null
    surface_m2: number | null
    metadata: Record<string, any> | null
    derived_from_scan_hash: string | null
    source: string | null
    detected_at: string
    created_at: string
    updated_at: string
    facade_number: string
    scan: Scan | null
    businesses_cache: {
        name: string
    }
    business?: Business,
    formatted_address?: string | null;
    formatted_phone_number?: string | null;
    website?: string | null;
    types?: string | null;
    international_phone_number?: string | null;
}

export type ScanStatus = Scan["status"]
