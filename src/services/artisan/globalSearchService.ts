import { supabase } from "@/api/api";

export interface SearchResult {
    id: string;
    type: 'scan' | 'facade' | 'devis';
    title: string;
    subtitle: string;
    status?: string;
    score?: number;
    url: string;
}

export class GlobalSearchService {
    async ArtisanSearch(query: string, profileId: string): Promise<SearchResult[]> {
        if (!query || query.length < 2) return [];

        try {
            const results: SearchResult[] = [];

            // 1. Search Scans
            const { data: scans } = await supabase
                .from("scans")
                .select("id, name, slug, address_text, status")
                .eq("profile_id", profileId)
                .ilike("name", `%${query}%`)
                .limit(5);

            if (scans) {
                scans.forEach(scan => {
                    results.push({
                        id: scan.id,
                        type: 'scan',
                        status: scan.status,
                        title: scan.name,
                        subtitle: scan.address_text || 'Scan',
                        url: `/scans/${scan.slug}`
                    });
                });
            }

            // 2. Search Facades (search by address street or facade number)
            // Note: linking facades to scans requires knowing the scan slug, which might be complex in a single query if not joined.
            // We'll join with scan_facades -> scans to get the slug.
            const { data: facades } = await supabase
                .from("facades")
                .select(`
                    id, 
                    address, 
                    facade_number,
                    scan_facades:scan_facades!inner(
                        scan:scans!inner(
                            slug,
                            profile_id
                        )
                    )
                `)
                .eq("scan_facades.scan.profile_id", profileId)
                .or(`facade_number.ilike.%${query}%`)
                // Note: searching inside jsonb address for street/city via raw SQL or simpler ilike if possible, 
                // but standard ilike on jsonb is tricky. For now let's search facade_number.
                .limit(5);

            if (facades) {
                facades.forEach((f: any) => {
                    const scanSlug = f.scan_facades?.[0]?.scan?.slug;
                    if (scanSlug) {
                        const addressStr = f.address?.street ? `${f.address.street}, ${f.address.city}` : 'Unknown Address';
                        results.push({
                            id: f.id,
                            type: 'facade',
                            title: `Façade #${f.facade_number}`,
                            subtitle: addressStr,
                            url: `/scans/${scanSlug}/facades/${f.id}`
                        });
                    }
                });
            }


            // 3. Search Devis (Quotes)
            const { data: quotes } = await supabase
                .from("quotes")
                .select("id, quote_number, client_name, status")
                .eq("profile_id", profileId)
                .or(`quote_number.ilike.%${query}%,client_name.ilike.%${query}%`)
                .limit(5);

            if (quotes) {
                quotes.forEach(quote => {
                    results.push({
                        id: quote.id,
                        type: 'devis',
                        status: quote.status,
                        title: `Devis ${quote.quote_number}`,
                        subtitle: quote.client_name,
                        url: `/devis/${quote.id}`
                    });
                });
            }

            return results;

        } catch (error) {
            console.error("Global search error:", error);
            return [];
        }
    }
    async AdminSearch(query: string): Promise<SearchResult[]> {
        if (!query || query.length < 2) return [];

        try {
            const results: SearchResult[] = [];

            // 1. Search Scans
            const { data: scans } = await supabase
                .from("scans")
                .select("id, name, slug, address_text, status")
                .ilike("name", `%${query}%`)
                .limit(5);

            if (scans) {
                scans.forEach(scan => {
                    results.push({
                        id: scan.id,
                        type: 'scan',
                        status: scan.status,
                        title: scan.name,
                        subtitle: scan.address_text || 'Scan',
                        url: `/admin/scans/${scan.slug}`
                    });
                });
            }

            // 2. Search Facades (search by address street or facade number)
            // Note: linking facades to scans requires knowing the scan slug, which might be complex in a single query if not joined.
            // We'll join with scan_facades -> scans to get the slug.
            const { data: facades } = await supabase
                .from("facades")
                .select(`
                    id, 
                    address, 
                    facade_number,
                    score,
                    scan_facades:scan_facades!inner(
                        scan:scans!inner(
                            slug,
                            profile_id
                        )
                    )
                `)
                .or(`facade_number.ilike.%${query}%`)
                // Note: searching inside jsonb address for street/city via raw SQL or simpler ilike if possible, 
                // but standard ilike on jsonb is tricky. For now let's search facade_number.
                .limit(5);

            if (facades) {
                facades.forEach((f: any) => {
                    const scanSlug = f.scan_facades?.[0]?.scan?.slug;
                    if (scanSlug) {
                        const addressStr = f.address?.street ? `${f.address.street}, ${f.address.city}` : 'Unknown Address';
                        results.push({
                            id: f.id,
                            type: 'facade',
                            score: f.score,
                            title: `Façade #${f.facade_number}`,
                            subtitle: addressStr,
                            url: `/admin/facades/${f.id}`
                        });
                    }
                });
            }


            // 3. Search Devis (Quotes)
            const { data: quotes } = await supabase
                .from("quotes")
                .select("id, quote_number, client_name, status")
                .or(`quote_number.ilike.%${query}%,client_name.ilike.%${query}%`)
                .limit(5);

            if (quotes) {
                quotes.forEach(quote => {
                    results.push({
                        id: quote.id,
                        type: 'devis',
                        status: quote.status,
                        title: `Devis ${quote.quote_number}`,
                        subtitle: quote.client_name,
                        url: `/admin/devis/${quote.id}`
                    });
                });
            }

            return results;

        } catch (error) {
            console.error("Global search error:", error);
            return [];
        }
    }
}

export const GlobalSearchServiceInstance = new GlobalSearchService();
