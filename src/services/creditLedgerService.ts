import { supabase } from "@/api/api"

export type CreditTransactionType =
    | "purchase"
    | "bonus"
    | "detection"
    | "refund"
    | "scan_charge"
    | "adjustment"
    | "email_search"
    | "simulation"

export interface CreditLedgerEntry {
    id: string
    profile_id: string
    type: CreditTransactionType
    amount: number // negative for charges, positive for credits
    balance_after: number | null
    reference_id: string | null
    reference_type: string | null
    idempotency_key: string | null
    metadata: Record<string, unknown>
    created_by: string | null
    created_at: string
}

export interface CreateLedgerEntryParams {
    profileId: string
    type: CreditTransactionType
    amount: number
    referenceId?: string
    referenceType?: string
    idempotencyKey?: string
    metadata?: Record<string, unknown>
}

class CreditLedgerService {
    /**
     * Check if a string is a valid UUID
     */
    private isValidUUID(str: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRegex.test(str)
    }

    /**
     * Create a credit ledger entry and update user's balance
     */
    async createEntry(params: CreateLedgerEntryParams): Promise<{
        entry: CreditLedgerEntry
        newBalance: number
    }> {
        const {
            profileId,
            type,
            amount,
            referenceId,
            referenceType,
            idempotencyKey,
            metadata = {}
        } = params

        // Check for duplicate transaction using idempotency key
        if (idempotencyKey) {
            const { data: existing } = await supabase
                .from("credit_ledger")
                .select("*")
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle()

            if (existing) {
                console.log("Duplicate transaction detected, returning existing entry")
                return {
                    entry: existing as CreditLedgerEntry,
                    newBalance: existing.balance_after
                }
            }
        }

        // Get current balance
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("credit_balance")
            .eq("id", profileId)
            .single()

        if (profileError) {
            throw new Error(`Failed to get profile: ${profileError.message}`)
        }

        const currentBalance = profile.credit_balance ?? 0
        const newBalance = currentBalance + amount

        // Validate sufficient balance for charges
        if (amount < 0 && newBalance < 0) {
            throw new Error("Insufficient credits")
        }

        // Handle reference_id - only use UUID format, otherwise store in metadata
        const validReferenceId = referenceId && this.isValidUUID(referenceId) ? referenceId : null
        const enhancedMetadata = {
            ...metadata,
            // Store non-UUID reference in metadata if provided
            ...(referenceId && !this.isValidUUID(referenceId) ? { reference_string: referenceId } : {})
        }

        // Create ledger entry
        const { data: entry, error: entryError } = await supabase
            .from("credit_ledger")
            .insert({
                profile_id: profileId,
                type,
                amount,
                balance_after: newBalance,
                reference_id: validReferenceId,
                reference_type: referenceType || null,
                idempotency_key: idempotencyKey || null,
                metadata: enhancedMetadata,
                created_by: profileId
            })
            .select()
            .single()

        if (entryError) {
            throw new Error(`Failed to create ledger entry: ${entryError.message}`)
        }

        // Update profile balance
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ credit_balance: newBalance })
            .eq("id", profileId)

        if (updateError) {
            // Rollback ledger entry if balance update fails
            await supabase.from("credit_ledger").delete().eq("id", entry.id)
            throw new Error(`Failed to update balance: ${updateError.message}`)
        }

        return {
            entry: entry as CreditLedgerEntry,
            newBalance
        }
    }

    /**
     * Charge credits for facade detection (always max estimation)
     */
    async chargeDetection(params: {
        profileId: string
        estimatedCredits: number
        radius: number
        coordinates: { lat: number; lng: number }
        detectionId: string
    }): Promise<{ entry: CreditLedgerEntry; newBalance: number }> {
        const { profileId, estimatedCredits, radius, coordinates, detectionId } = params

        return this.createEntry({
            profileId,
            type: "detection",
            amount: -Math.abs(estimatedCredits), // Always negative
            referenceId: detectionId,
            referenceType: "facade_detection",
            idempotencyKey: `detection_${detectionId}`,
            metadata: {
                radius,
                coordinates,
                estimated_facades: this.estimateMaxFacades(radius),
                charged_at: new Date().toISOString()
            }
        })
    }

    /**
     * Refund credits if actual facades found is less than max
     */
    async refundUnusedCredits(params: {
        profileId: string
        detectionId: string
        estimatedCredits: number
        actualCredits: number
        actualFacades: number
        maxFacades: number
    }): Promise<{ entry: CreditLedgerEntry; newBalance: number } | null> {
        const {
            profileId,
            detectionId,
            estimatedCredits,
            actualCredits,
            actualFacades,
            maxFacades
        } = params

        const refundAmount = estimatedCredits - actualCredits

        // Only refund if there's a difference
        if (refundAmount <= 0) {
            console.log("No refund needed - actual cost equals or exceeds estimate")
            return null
        }

        return this.createEntry({
            profileId,
            type: "refund",
            amount: Math.abs(refundAmount), // Always positive
            referenceId: detectionId,
            referenceType: "facade_detection_refund",
            idempotencyKey: `refund_${detectionId}`,
            metadata: {
                original_detection_id: detectionId,
                estimated_facades: maxFacades,
                actual_facades: actualFacades,
                estimated_credits: estimatedCredits,
                actual_credits: actualCredits,
                refund_amount: refundAmount,
                refunded_at: new Date().toISOString()
            }
        })
    }

    /**
     * Get ledger history for a profile
     */
    async getHistory(profileId: string, limit = 50): Promise<CreditLedgerEntry[]> {
        const { data, error } = await supabase
            .from("credit_ledger")
            .select("*")
            .eq("profile_id", profileId)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (error) {
            throw new Error(`Failed to get ledger history: ${error.message}`)
        }

        return data as CreditLedgerEntry[]
    }

    /**
     * Estimate max facades based on radius (for charging)
     */
    private estimateMaxFacades(radius: number): number {
        // Google Places returns max 60 results (3 pages of 20)
        if (radius <= 500) return 20
        if (radius <= 1000) return 40
        return 60 // Max for any radius > 1000m
    }
}

export const CreditLedger = new CreditLedgerService()
