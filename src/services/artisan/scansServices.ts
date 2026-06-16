import { supabase } from "@/api/api";
import console from "console";

export class ScansService {
  async getScans(profileId: string, page: number = 1, pageSize: number = 10, filters?: { search?: string, status?: string }) {
    try {
      const query = supabase.from("scans").select(`
                    *,
                    scan_facades(id)
                `, { count: "exact" }).eq("profile_id", profileId);

      if (filters?.search) {
        query.ilike("name", `%${filters.search}%`);
      }
      if (filters?.status && filters.status !== "all") {
        query.eq("status", filters.status);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const scansWithFacadesCount = data.map(scan => ({
        ...scan,
        facadesCount: scan.scan_facades?.length ?? 0,
      }));

      return {
        data: scansWithFacadesCount,
        total: count,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    } catch (error) {
      console.error("Error getting scans:", error);
      throw error;
    }
  }
  async getScanBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select(`
        *,
        scan_facades:scan_facades(
          *,
          facade:facades(
            id,
            address,
            location,
            score,
            surface_m2,
            streetview_url,
            types,
            metadata,
            detected_at,
            business:businesses_cache (
              id,
              external_id,
              name,
              business_type,
              address,
              location,
              metadata
            )
          )
        )
      `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const notFoundError: any = new Error("Scan not found");
        notFoundError.code = 'PGRST116';
        throw notFoundError;
      }

      // Handle case where scan has no facades yet
      if (!data.scan_facades || !Array.isArray(data.scan_facades) || data.scan_facades.length === 0) {
        return {
          ...data,
          facades: [],
          facadesCount: 0,
          businesses: [],
          businessesCount: 0,
        };
      }

      // 1️⃣ facades
      const facades = data.scan_facades
        .map((sf: any) => sf.facade)
        .filter((f: any) => f !== null); // Filter out null facades

      // 2️⃣ businesses (unique)
      const businessesMap = new Map();

      facades.forEach((f: any) => {
        if (f.business?.id) {
          businessesMap.set(f.business.id, f.business);
        }
      });

      const businesses = Array.from(businessesMap.values());

      return {
        ...data,
        facades,
        facadesCount: facades.length,
        businesses,
        businessesCount: businesses.length,
      };

    } catch (error) {
      console.error("Error getting scan by slug:", error);
      throw error;
    }
  }
  async getScanIdBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select(`id`)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const notFoundError: any = new Error("Scan not found");
        notFoundError.code = 'PGRST116';
        throw notFoundError;
      }

      return data;

    } catch (error) {
      console.error("Error getting scan by slug:", error);
      throw error;
    }
  }
  async deleteScan(id: string) {
    try {
      const { error } = await supabase
        .from("scans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error("Error deleting scan:", error);
      throw error;
    }
  }

  async getFacadeById(id: string, slug: string) {
    try {
      const { data, error } = await supabase
        .from("facades")
        .select(`
        *,
        business:businesses_cache (*),
        scan_facades:scan_facades!inner (
          scan:scans!inner (*)
        )
      `)
        .eq("id", id)
        .eq("scan_facades.scan.slug", slug)
        .single()

      if (error) throw error

      return {
        ...data,
        scan: data.scan_facades?.[0]?.scan ?? null
      }
    } catch (error) {
      console.error("Error getting facade by id:", error)
      throw error
    }
  }

  async getFacadeTotalDetected(facadeId: string) {
    try {
      const { count, error } = await supabase
        .from("scan_facades")
        .select("*", { count: "exact", head: true })
        .eq("facade_id", facadeId)

      if (error) throw error

      return count ?? 0
    } catch (error) {
      console.error("Error counting facade detections:", error)
      throw error
    }
  }

  async getFacadesByScanSlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from("scan_facades")
        .select(`
                    facade_id,
                    facades (
                        id,
                        facade_number,
                        address,
                        business:businesses_cache (name)
                    ),
                    scan:scans!inner (slug)
                `)
        .eq("scan.slug", slug)
        .order("created_at", { ascending: true })

      if (error) throw error

      return data?.map(sf => {
        const facade = Array.isArray(sf.facades) ? sf.facades[0] : sf.facades;
        const business = Array.isArray(facade?.business) ? facade?.business[0] : facade?.business;
        const address = facade?.address;
        return {
          id: sf.facade_id,
          facade_number: facade?.facade_number,
          name: business?.name || address?.name || `Façade ${facade?.facade_number}`
        };
      }) || []
    } catch (error) {
      console.error("Error getting facades by scan slug:", error)
      throw error
    }
  }

  async uploadFacadeImage(facadeId: string, imageBlob: Blob): Promise<string> {
    try {
      const timestamp = Date.now()
      const fileName = `facade-${facadeId}-${timestamp}.jpg`
      const filePath = `facades/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('facades')
        .upload(filePath, imageBlob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('facades')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading facade image:", error)
      throw error
    }
  }

  async updateFacadeStreetviewUrl(facadeId: string, newImageUrl: string): Promise<void> {
    try {
      // Get current streetview_url
      const { data: facade, error: fetchError } = await supabase
        .from("facades")
        .select("streetview_url")
        .eq("id", facadeId)
        .single()

      if (fetchError) throw fetchError

      // Parse existing URLs
      let existingUrls: string[] = []
      if (facade?.streetview_url) {
        try {
          existingUrls = typeof facade.streetview_url === 'string'
            ? JSON.parse(facade.streetview_url)
            : facade.streetview_url

          if (!Array.isArray(existingUrls)) {
            existingUrls = [facade.streetview_url]
          }
        } catch {
          existingUrls = [facade.streetview_url]
        }
      }

      // Add new URL at the beginning
      const updatedUrls = [newImageUrl, ...existingUrls]

      // Update facade
      const { error: updateError } = await supabase
        .from("facades")
        .update({
          streetview_url: JSON.stringify(updatedUrls),
          updated_at: new Date().toISOString()
        })
        .eq("id", facadeId)

      if (updateError) throw updateError
    } catch (error) {
      console.error("Error updating facade streetview_url:", error)
      throw error
    }
  }

  async getSettings() {
    try {
      const { data, error } = await supabase.from('app_setting').select('*');
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }


}

export const ScansServiceInstance = new ScansService();
