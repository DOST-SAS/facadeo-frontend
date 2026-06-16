export type UserRole = "admin" | "artisan"

export type UserStatus = "active" | "inactive" | "suspended"

export interface User {
    id: string
    role: UserRole
    status: UserStatus
    is_admin: boolean
    display_name: string
    company_name: string
    siret: string
    phone: string
    address: any
    metier_id: string
    logo_url: string
    signature_url: string
    pricing_overrides: any
    settings: any
    onboarding_completed: boolean
    created_at: string
    updated_at: string
    lastLogin: string
    deleted_at: string
    email: string
    avatar: string
    pro_email: string
    pro_phone: string
    adresse: string
    numberScans: number
    numberDevis: number
    is_entreprise?: boolean
    ville: string
    code_postal: string
    pays: string
    credit_balance: number
    p_provider: string
    scans_number: number
    
}
