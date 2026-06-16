
export interface Devis {
    id: string
    quote_number?: string
    reference?: string
    total_cents?: number
    amount?: number
    client_name?: string
    clientName?: string
    client_email?: string
    clientEmail?: string
    client_phone?: string
    address: string | null
    client_address?: {
        address: string
    }
    status: "draft" | "ready" | "sent" | "viewed" | "accepted" | "refused" | "expired" | "discussion"
    valid_until?: string
    validUntil?: string
    subtotal_cents?: number
    tax_cents?: number
    discount_cents?: number
    tax_rate?: number
    created_at?: string
    createdAt?: string
    sent_at?: string | Date | null
    viewed_at?: string | Date | null
    metadata?: {
        facade_id?: string
        includeBeforeAfter?: boolean
        items?: any[]
        notes?: string
        metiers?: any[]
    }
    items?: any[]
    accepted_at?: string | null
    refused_at?: string | null
    expired_at?: string | null
    artisan?: {
        id: string
        display_name: string
        email: string
        phone: string
        address: string | null
        avatar: string | null
    }
    pdf_url?: string
}
