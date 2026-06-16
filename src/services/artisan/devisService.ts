import { supabase } from "@/api/api";

export class DevisService {
    async getDevis(profileId: string, page: number = 1, pageSize: number = 10, filters?: { search?: string, status?: string }) {
        try {
            const query = supabase
                .from("quotes")
                .select(`*, items:quote_items(*)`, { count: "exact" })
                .eq("profile_id", profileId);

            if (filters?.search) {
                query.or(`quote_number.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`);
            }
            if (filters?.status && filters.status !== "all") {
                query.eq("status", filters.status);
            }
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data: devis, error, count } = await query
                .range(from, to)
                .order("created_at", { ascending: false });

            if (error) throw error;
            console.log('devis', devis);
            return {
                data: devis || [],
                total: count,
                page,
                pageSize,
                totalPages: count ? Math.ceil(count / pageSize) : 0,
            };
        } catch (error) {
            console.error("Error getting devis:", error);
            throw error;
        }
    }

    async getDevisById(id: string) {
        try {
            const { data, error } = await supabase
                .from("quotes")
                .select(`*, items:quote_items(*)`)
                .eq("id", id)
                .single();

            if (error) throw error;
            console.log('devis detail fetched', data);
            return {
                data,
            };
        } catch (error) {
            console.error("Error getting devis by id:", error);
            throw error;
        }
    }

    async createDevis(devis: any, prestations: any, facade_id: string) {
        try {
            // 1. Insert Quote
            const { data: quoteData, error: quoteError } = await supabase
                .from("quotes")
                .insert(devis)
                .select()
                .single();

            if (quoteError) throw quoteError;

            // 2. Insert Quote Items if any
            const items = prestations;
            if (items.length > 0 && quoteData) {
                const quoteItemsPayload = items.map((item: any, index: number) => ({
                    quote_id: quoteData.id,
                    facade_id: facade_id || null,
                    description: item.description || "",
                    quantity: Number(item.quantity) || 0,
                    unit_price_cents: Math.round(Number(item.unitPrice || 0) * 100),
                    total_cents: Math.round((Number(item.quantity || 0) * Number(item.unitPrice || 0)) * 100),
                    sort_order: index,
                    unit: item.unit || "m²"
                    // Removed metier_id and metier_label as they are not in the database schema
                }));

                console.log('Inserting quote items:', quoteItemsPayload.length);

                const { error: itemsError } = await supabase
                    .from("quote_items")
                    .insert(quoteItemsPayload);

                if (itemsError) {
                    console.error("Error inserting quote items:", itemsError);
                    throw itemsError;
                }
                console.log("Quote items inserted successfully");
            }
            console.log("Quote created successfully");
            return { data: quoteData };
        } catch (error) {
            console.error("Error creating devis:", error);
            throw error;
        }
    }

    async updateDevis(id: string, updates: any, prestations?: any[], facade_id?: string) {
        try {
            console.log('--- START updateDevis ---');

            // 1. Update Quote
            const { data: quoteData, error: quoteError } = await supabase
                .from("quotes")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (quoteError) {
                console.error("Error updating quote table:", quoteError);
                throw quoteError;
            }

            // 2. Update Quote Items if prestations are provided
            if (Array.isArray(prestations)) {
                const effectiveFacadeId = facade_id || quoteData.metadata?.facade_id;

                // First, delete existing quote items for this quote
                await supabase
                    .from("quote_items")
                    .delete()
                    .eq("quote_id", id);

                if (prestations.length > 0) {
                    // Then, insert updated quote items
                    const quoteItemsPayload = prestations.map((item: any, index: number) => ({
                        quote_id: id,
                        facade_id: effectiveFacadeId || null,
                        description: item.description || "",
                        quantity: Number(item.quantity || 0),
                        unit_price_cents: Math.round(Number(item.unitPrice || item.unit_price_cents / 100 || 0) * 100),
                        total_cents: Math.round((Number(item.quantity || 0) * (Number(item.unitPrice) || Number(item.unit_price_cents / 100) || 0)) * 100),
                        sort_order: index,
                        unit: item.unit || "m²"
                        // Removed metier_id and metier_label as they are not in the database schema
                    }));

                    console.log(`Inserting ${quoteItemsPayload.length} updated quote items`);

                    const { error: itemsError } = await supabase
                        .from("quote_items")
                        .insert(quoteItemsPayload);

                    if (itemsError) {
                        console.error("Error inserting updated quote items:", itemsError);
                        throw itemsError;
                    }
                }
            }

            console.log('--- END updateDevis successfully ---');
            return { data: quoteData };
        } catch (error) {
            console.error("Error in updateDevis:", error);
            throw error;
        }
    }

    async deleteDevis(id: string) {
        try {
            const { data, error } = await supabase
                .from("quotes")
                .delete()
                .eq("id", id);

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error("Error deleting devis:", error);
            throw error;
        }
    }
    async getArtisanMetiers(profileId: string) {
        try {
            const { data, error } = await supabase
                .from("profile_metiers")
                .select(`
                    *,
                    metiers(label),
                    tariffs:profile_tariffs(*)
                `)
                .eq("profile_id", profileId)
                .eq("active", true);

            if (error) throw error;
            return {
                data: data || [],
            };
        } catch (error) {
            console.error("Error getting artisan metiers:", error);
            throw error;
        }
    }
}

export const DevisServiceInstance = new DevisService();
