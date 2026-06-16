import { supabase } from "@/api/api";
import { uploadFacade } from "@/utils/UploadAvatars";
import { ScansServiceInstance } from "./scansServices";

export class FacadeService {

    async getFacadeById(id: string) {
        try {
            const { data: facade, error } = await supabase
                .from("facades")
                .select(`*`)
                .eq("id", id)
                .single();

            if (error) throw error;
            const { data: scan_facade, error: scan_error } = await supabase
                .from("scan_facades")
                .select(`*`)
                .eq("facade_id", id)
                .single();

            if (scan_error) throw scan_error;
            console.log('facade', facade);
            return {
                facade,
                scan_facade,
            };
        } catch (error) {
            console.error("Error getting facade by id:", error);
            throw error;
        }
    }

    async updateScanFacadeSimulationImage(image: string, facade_id: string, slug: string) {
        try {
            // Convert blob URL or data URL to File object
            const response = await fetch(image);
            const blob = await response.blob();
            const file = new File([blob], `simulation_${facade_id}.jpg`, { type: blob.type });

            // Upload the file using the new utility
            const url = await uploadFacade(file, facade_id, slug);

            if (!url) throw new Error("Failed to upload image");
            const scanData = await ScansServiceInstance.getScanIdBySlug(slug)

            const { error } = await supabase
                .from("scan_facades")
                .update({ simulated_facade_image: url })
                .eq("facade_id", facade_id)
                .eq("scan_id", scanData.id)

            if (error) throw error;
            console.log('scan facade updated', url);
            return true;
        } catch (error) {
            console.error("Error updating scan facade:", error);
            throw error;
        }
    }


}

export const FacadeServiceInstance = new FacadeService();
