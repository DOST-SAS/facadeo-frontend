export interface FeatureDefinition {
    label: string
    type: "number" | "boolean"
    key: string
    value?: number | boolean | string
}

export interface PlanFeatures {
    max_radius_km?: number
    max_scans_per_month?: number
    priority_support?: boolean
    dedicated_account_manager?: boolean
    [key: string]: number | boolean | undefined
}

export interface Plan {
    // Database fields (exact match)
    id: string
    name: string
    slug: string
    monthly_credit: number
    price_cents: number
    currency: string
    features: FeatureDefinition[]
    stripe_product_id?: string | null
    stripe_price_id?: string | null
    description?: string | null
    active: boolean
    is_public: boolean
    sort_order?: number | null
    created_at?: string
    updated_at?: string
    sub_features?: string[] | null  // json array
    type?: "free" | "starter" | "professional" | "enterprise" | null

    // Frontend-only fields (not in database)
    icon?: React.ComponentType | string
    isPopular?: boolean
    popularLabel?: string
    isCurrent?: boolean
}

export enum TransactionType {
    MONTHLY_GRANT = 'monthly_grant',
    TOP_UP = 'top_up',
    SCAN_CHARGE = 'scan_charge',
    REFUND = 'refund',
    ADMIN_ADJUST = 'admin_adjust',
    BONUS = 'bonus',
    EXPIRY = 'expiry',
    DETECTION = 'detection',
    SCAN_REFUND = 'scan_refund',
    EMAIL_SEARCH = 'email_search'
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
    [TransactionType.MONTHLY_GRANT]: 'Crédits mensuels',
    [TransactionType.TOP_UP]: 'Achat de pack',
    [TransactionType.SCAN_CHARGE]: 'Scan de façade',
    [TransactionType.REFUND]: 'Remboursement',
    [TransactionType.ADMIN_ADJUST]: 'Ajustement administratif',
    [TransactionType.BONUS]: 'Bonus',
    [TransactionType.EXPIRY]: 'Expiration',
    [TransactionType.DETECTION]: 'Détection',
    [TransactionType.SCAN_REFUND]: 'Remboursement de scan',
    [TransactionType.EMAIL_SEARCH]: 'Recherche d\'emails'
}

export interface Transaction {
    id: string
    date: string
    amount: string
    type?: TransactionType
    metadata?: {
        note?: string
    }
}

import type { CreditPack } from "./packstypes"

export type { CreditPack }

export interface Subscription {
    id: string
    profile_id: string
    plan_id: string
    status: string
    current_period_start?: string
    current_period_end?: string
    plans?: Plan
    created_at?: string
    updated_at?: string
}