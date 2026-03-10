import { supabase } from "@/api/api";

export async function generatePublicQuoteNumber(profileId: string): Promise<string> {
    try {
        // Get current year
        const currentYear = new Date().getFullYear();

        // Get the count of quotes for the current year
        const { count, error } = await supabase
            .from("quotes")
            .select("*", { count: "exact", head: true })
            .like("quote_number", `Devis ${currentYear}-%`)
            .eq("profile_id", profileId)
            .not("quote_number", "is", null);

        if (error) {
            console.error("Error counting quotes:", error);
            throw error;
        }

        let incrementalValue = (count || 0) + 1;
        let isUnique = false;
        let finalQuoteNumber = "";

        // Loop to ensure artisan uniqueness
        while (!isUnique) {
            // Format: Devis YYYY-NNNNN (5 digits with leading zeros)
            const sequentialNumber = String(incrementalValue).padStart(5, '0');
            finalQuoteNumber = `Devis ${currentYear}-${sequentialNumber}`;

            // Check if this number already exists for this artisan
            const { data: existingQuote } = await supabase
                .from("quotes")
                .select("id")
                .eq("quote_number", finalQuoteNumber)
                .eq("profile_id", profileId)
                .maybeSingle();

            if (!existingQuote) {
                isUnique = true;
            } else {
                incrementalValue++;
            }
        }

        return finalQuoteNumber;
    } catch (error) {
        console.error("Error generating public quote number:", error);
        // Fallback to timestamp-based number if generation fails
        const currentYear = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-6);
        return `Devis ${currentYear}-${timestamp}`;
    }
}

export async function generateInternalReference(
    businessType: string,
    businessName: string,
    profileId: string
): Promise<string> {
    try {
        // Extract first two letters from business type
        const typePrefix = businessType
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 2)
            .toUpperCase() || "XX";

        // Extract first two letters from business name
        const namePrefix = businessName
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 2)
            .toUpperCase() || "XX";

        // Use a part of the profile ID to increase uniqueness probability
        const shortProfileId = profileId.substring(0, 3).toUpperCase();

        // Get the count as a starting point for the sequence
        const { count, error } = await supabase
            .from("quotes")
            .select("*", { count: "exact", head: true })
            .eq("profile_id", profileId)
            .not("reference", "is", null);

        if (error) {
            console.error("Error counting quotes:", error);
            throw error;
        }

        let incrementalValue = (count || 0) + 1;
        let isUnique = false;
        let finalReference = "";

        // Loop to ensure global uniqueness
        while (!isUnique) {
            const incrementalCode = String(incrementalValue).padStart(3, '0');
            // Format: DV-{TYPE}-{NAME}-{SHORT_ID}-{SEQ}
            finalReference = `DV-${typePrefix}-${namePrefix}-${shortProfileId}-${incrementalCode}`;

            const { data: existingQuote } = await supabase
                .from("quotes")
                .select("id")
                .eq("reference", finalReference)
                .maybeSingle();

            if (!existingQuote) {
                isUnique = true;
            } else {
                incrementalValue++;
            }
        }

        return finalReference;
    } catch (error) {
        console.error("Error generating internal reference:", error);
        // Fallback to timestamp-based reference if generation fails
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `DV-XX-XX-${timestamp}${random}`;
    }
}


export async function generateArtisanQuoteNumber(
    businessType: string,
    businessName: string,
    profileId: string
): Promise<{ quoteNumber: string; reference: string }> {
    const [quoteNumber, reference] = await Promise.all([
        generatePublicQuoteNumber(profileId),
        generateInternalReference(businessType, businessName, profileId)
    ]);

    return { quoteNumber, reference };
}


export async function getBusinessTypeLabel(metierId: string): Promise<string> {
    try {
        const { data, error } = await supabase
            .from("metiers")
            .select("label")
            .eq("id", metierId)
            .single();

        if (error) throw error;
        return data?.label || "Artisan";
    } catch (error) {
        console.error("Error fetching business type:", error);
        return "Artisan";
    }
}
