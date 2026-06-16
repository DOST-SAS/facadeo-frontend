import { supabase } from "@/api/api";
import type { User } from "@/types/usersTypes";
import type { Metier, TradeConfiguration } from "@/types/artisanSettinstypes";

export class ProfileService {
    async updateProfile(userId: string, profile: Partial<User>) {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .update(profile)
                .eq("id", userId)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error("Error updating profile:", error)
            throw error
        }
    }

    async getMetiers(): Promise<Metier[]> {
        try {
            const { data, error } = await supabase
                .from("metiers")
                .select()
                .eq('active', true)
                .order('sort_order', { ascending: true })

            if (error) throw error
            return data
        } catch (error) {
            console.error("Error getting metiers:", error)
            throw error
        }
    }

    async getProfileMetiers(profileId: string): Promise<TradeConfiguration[]> {
        try {
            const { data, error } = await supabase
                .from("profile_metiers")
                .select(`
                    id,
                    metier_id,
                    description,
                    metiers (
                        label
                    ),
                    profile_tariffs (
                        id,
                        service_name,
                        unit,
                        unit_price_cents,
                        quantity
                    )
                `)
                .eq("profile_id", profileId)
                .eq("active", true);

            if (error) throw error;

            // Transform to TradeConfiguration for the UI
            return data.map((pm: any) => ({
                id: pm.id,
                metier_id: pm.metier_id,
                metier_label: pm.metiers?.label,
                description: pm.description || "",
                tariffConfigurations: pm.profile_tariffs.map((pt: any) => ({
                    id: pt.id,
                    service_name: pt.service_name,
                    unit: pt.unit,
                    unit_price_cents: pt.unit_price_cents,
                    quantity: pt.quantity || 0
                }))
            }));

        } catch (error) {
            console.error("Error getting profile metiers:", error);
            throw error;
        }
    }

    async addProfileMetier(profileId: string, metierId: string) {
        try {
            // Check if already exists (even if inactive)
            const { data: existing, error: _fetchError } = await supabase
                .from("profile_metiers")
                .select()
                .eq("profile_id", profileId)
                .eq("metier_id", metierId)
                .single();

            if (existing) {
                // If exists but inactive, reactivate it
                if (!existing.active) {
                    const { data, error } = await supabase
                        .from("profile_metiers")
                        .update({ active: true })
                        .eq("id", existing.id)
                        .select()
                        .single();
                    if (error) throw error;
                    return data;
                }
                return existing;
            }

            const { data, error } = await supabase
                .from("profile_metiers")
                .insert({ profile_id: profileId, metier_id: metierId })
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error adding profile metier:", error);
            throw error; // Re-throw to handle in UI
        }
    }

    async removeProfileMetier(id: string) {
        try {
            // Delete associated tariffs first (since cascade delete is not configured)
            const { error: tariffError } = await supabase
                .from("profile_tariffs")
                .delete()
                .eq("profile_metier_id", id);

            if (tariffError) throw tariffError;

            // Then delete the profile metier
            const { error } = await supabase
                .from("profile_metiers")
                .delete()
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Error removing profile metier:", error);
            throw error;
        }
    }

    async updateTradeDescription(id: string, description: string) {
        try {
            const { error } = await supabase
                .from("profile_metiers")
                .update({ description })
                .eq("id", id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating trade description:", error);
            throw error;
        }
    }

    async addTariff(profileMetierId: string) {
        try {
            const { data, error } = await supabase
                .from("profile_tariffs")
                .insert({
                    profile_metier_id: profileMetierId,
                    service_name: "Nouveau service",
                    unit: "m²",
                    unit_price_cents: 0
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error adding tariff:", error);
            throw error;
        }
    }

    async updateTariff(id: string, updates: any) {
        try {
            const { error } = await supabase
                .from("profile_tariffs")
                .update(updates)
                .eq("id", id);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating tariff:", error);
            throw error;
        }
    }

    async deleteTariff(id: string) {
        try {
            const { error } = await supabase
                .from("profile_tariffs")
                .delete()
                .eq("id", id);
            if (error) throw error;
        } catch (error) {
            console.error("Error deleting tariff:", error);
            throw error;
        }
    }
    async batchSaveMetiers(
        userId: string,
        configs: TradeConfiguration[],
        deletedMetierIds: string[],
        deletedTariffIds: string[]
    ) {
        try {
            // 1. Handle Deletions
            if (deletedMetierIds.length > 0) {
                const { error } = await supabase
                    .from("profile_metiers")
                    .delete()
                    .in("id", deletedMetierIds)
                if (error) throw error
            }

            if (deletedTariffIds.length > 0) {
                const { error } = await supabase
                    .from("profile_tariffs")
                    .delete()
                    .in("id", deletedTariffIds)
                if (error) throw error
            }

            // 2. Process Changes
            for (const config of configs) {
                let profileMetierId = config.id

                // Check if it's a new metier (temp ID starting with 'temp_')
                const isNewMetier = config.id.startsWith('temp_')

                if (isNewMetier) {
                    // Insert new profile_metier
                    const { data, error } = await supabase
                        .from("profile_metiers")
                        .insert({
                            profile_id: userId,
                            metier_id: config.metier_id,
                            description: config.description,
                            active: true
                        })
                        .select()
                        .single()

                    if (error) throw error
                    profileMetierId = data.id
                } else {
                    // Update existing profile_metier
                    const { error } = await supabase
                        .from("profile_metiers")
                        .update({ description: config.description })
                        .eq("id", profileMetierId)

                    if (error) throw error
                }

                // Process Tariffs for this metier
                for (const tariff of config.tariffConfigurations) {
                    const isNewTariff = tariff.id.startsWith('temp_')

                    if (isNewTariff) {
                        // Insert new tariff
                        const { error } = await supabase
                            .from("profile_tariffs")
                            .insert({
                                profile_metier_id: profileMetierId,
                                service_name: tariff.service_name,
                                unit: tariff.unit,
                                unit_price_cents: tariff.unit_price_cents,
                                quantity: tariff.quantity
                            })
                        if (error) throw error
                    } else {
                        // Update existing tariff
                        const { error } = await supabase
                            .from("profile_tariffs")
                            .update({
                                service_name: tariff.service_name,
                                unit: tariff.unit,
                                unit_price_cents: tariff.unit_price_cents,
                                quantity: tariff.quantity
                            })
                            .eq("id", tariff.id)
                        if (error) throw error
                    }
                }
            }
        } catch (error) {
            console.error("Error in batch save:", error)
            throw error
        }
    }
}

export const ProfileServiceInstance = new ProfileService();