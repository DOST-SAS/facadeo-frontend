export interface CreditPack {
    id: string
    name: string
    slug: string
    credit_amount: number
    price_cents: number
    currency: string
    stripe_product_id?: string | null
    stripe_price_id?: string | null
    description?: string | null
    active: boolean
    is_public: boolean
    sort_order?: number | null
    created_at?: string
    updated_at?: string
}