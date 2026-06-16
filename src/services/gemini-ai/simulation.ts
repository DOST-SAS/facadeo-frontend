import { GoogleGenAI } from "@google/genai";
import { supabase } from "@/api/api";
import { CreditLedger } from "@/services/creditLedgerService";
import { SimulationCostCalculator } from "./simulationCostCalculator";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ArtisanMetier {
    id: string;
    metier_id: string;
    metier_label: string;
    description: string | null;
    metier_key: string;
}

export interface Prestation {
    description: string;
    unit: string;
    quantity: number | string;
    unitPrice: number | string;
    metierLabel?: string;
}

export interface SimulationRequest {
    facadeId: string;
    scanFacadeId: string;
    facadeImageUrl: string;
    profileId: string;
    facadeScore?: number;
    scoreBreakdown?: {
        fissures?: number;
        humidite?: number;
        ecaillage?: number;
        salissures?: number;
        decoloration?: number;
    };
    prestations?: Prestation[];
    isRegeneration?: boolean;
}

export interface SimulationResult {
    success: boolean;
    localImageUrl?: string;  // Blob URL for immediate display
    storedImageUrl?: string; // Supabase URL after storage
    error?: string;
}

class GeminiSimulationService {
    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });
    }

    /**
     * Fetch active métiers for the artisan profile
     */
    async getArtisanMetiers(profileId: string): Promise<ArtisanMetier[]> {
        try {
            const { data, error } = await supabase
                .from("profile_metiers")
                .select(`
                    id,
                    metier_id,
                    description,
                    metiers (
                        key,
                        label,
                        description
                    )
                `)
                .eq("profile_id", profileId)
                .eq("active", true);

            if (error) throw error;

            return data.map((pm: Record<string, unknown>) => ({
                id: pm.id as string,
                metier_id: pm.metier_id as string,
                metier_label: (pm.metiers as Record<string, string>)?.label || "",
                metier_key: (pm.metiers as Record<string, string>)?.key || "",
                description: (pm.description as string) || (pm.metiers as Record<string, string>)?.description || null,
            }));
        } catch (error) {
            console.error("Error fetching artisan metiers:", error);
            return [];
        }
    }

    /**
     * Build the simulation prompt based on artisan métiers and facade condition
     */
    private buildSimulationPrompt(
        metiers: ArtisanMetier[],
        scoreBreakdown?: SimulationRequest["scoreBreakdown"],
        prestations?: Prestation[]
    ): string {
        const metiersList = metiers.map(m => m.metier_label).join(", ");
        const metierDescriptions = metiers
            .filter(m => m.description)
            .map(m => `${m.metier_label}: ${m.description}`)
            .join("; ");

        const issuesJson = scoreBreakdown ? {
            fissures: scoreBreakdown.fissures || 0,
            humidite: scoreBreakdown.humidite || 0,
            ecaillage: scoreBreakdown.ecaillage || 0,
            salissures: scoreBreakdown.salissures || 0,
            decoloration: scoreBreakdown.decoloration || 0
        } : null;

        // Build prestations context if provided
        const prestationsContext = prestations && prestations.length > 0
            ? prestations.map(p => `${p.description} (${p.quantity} ${p.unit})`).join(", ")
            : null;

        return `
{
  "role": "expert_facade_renovation",
  "task": "simulation_travaux_metier_specifique_sans_changement_identite",
  "output_format": "image_modifiee_photo_realiste_comparative",

  "simulation_scope": {
    "objective": "montrer_uniquement_les_travaux_que_l_expert_facade_peut_realiser",
    "basis": "metiers_selectionnes",
    "interdiction": "toute_transformation_non_liee_aux_metiers"
  },

  "artisan_profile": {
    "metiers": "${metiersList}",
    "specialisations": "${metierDescriptions || 'travaux_exterieurs'}",
    "niveau": "expert_professionnel"
  },

  "facade_condition_actuelle": ${issuesJson ? JSON.stringify(issuesJson) : "{\"etat\": \"a_renover\"}"},

  ${prestationsContext ? `"prestations_prevues": "${prestationsContext}",` : ""}

  "simulation_focus": ${prestationsContext ? `"appliquer_les_travaux_decrits_dans_prestations_prevues"` : `"renovation_generale_selon_metiers"`},

  "allowed_interventions": {
    "facadier": ["nettoyage_facade","reparation_fissures","rebouchage_defauts","enduit_identique","peinture_conforme_existant"],
    "peintre": ["reprise_peinture_exterieure","uniformisation_teintes","finitions_soignees"],
    "serrurier_metallier": ["restauration_elements_metalliques_existants","traitement_anticorrosion","remise_en_etat_sans_modification"],
    "vitrier": ["nettoyage_vitrage","remplacement_vitre_abimee_a_l_identique","joints_neufs_discrets"],
    "macon": ["reparation_maconnerie","rejointoiement_identique","consolidation_structurelle"]
  },

  "strict_exclusions": {
    "interdits": [
      "changement_style_architectural",
      "modification_vitrine",
      "changement_enseignes",
      "ajout_elements_decoratifs",
      "suppression_elements",
      "modernisation_esthetique",
      "reinterpretation_creative",
      "travaux_hors_metiers"
    ]
  },

  "preservation_obligatoire": {
    "identite_commerciale": ["enseigne_inchangee","logo_inchange","vitrine_identique"],
    "architecture": ["proportions_originales","rythme_facade","ouvertures_inchangees"],
    "composition_image": ["cadrage_identique","angle_de_vue_identique","perspective_conservee"],
    "environnement": ["arriere_plan_inchange","elements_adjacent_preserves"],
    "lumiere": ["conditions_lumineuses_identiques","ombres_naturelles"]
  },

  "variation_autorisee": {
    "texture_facade": "legeres_variations_naturelles",
    "repartition_dirt": "nettoyage_aleatoire_realiste",
    "peinture_teinte": "petites_variations_subtiles",
    "reflets_vitre": "variation_lumineuse_naturelle"
  },

  "resultat_attendu": {
    "type": "comparatif_facade_apres",
    "effet": "facade_plus_propre_saine_et_professionnelle",
    "interpretation": "AUCUNE_CREATION_OU_REDESIGN"
  },

  "quality_requirements": {
    "realisme": "photo_realiste_indiscernable",
    "coherence": "travaux_credibles_metier",
    "details": "finitions_professionnelles_precises",
    "resolution": "qualite_image_preservee"
  },

  "output_instruction": "GENERER_IMAGE_APRES_SEULEMENT_SANS_TEXTE_NI_EXPLICATION"
}
`;

    }

    /**
     * Fetch image and convert to base64
     */
    private async fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result as string;
                const base64Data = base64.split(",")[1];
                resolve({
                    data: base64Data,
                    mimeType: blob.type || "image/jpeg"
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Generate simulation using Gemini 2.5 Flash
     */
    async generateSimulation(request: SimulationRequest, userCredits: number): Promise<SimulationResult> {
        if (!GEMINI_API_KEY) {
            return { success: false, error: "Clé API Gemini non configurée" };
        }

        try {
            // 1. Check if user has enough credits
            const costEstimate = await SimulationCostCalculator.estimateSimulationCost(userCredits, request.isRegeneration);

            if (!costEstimate.hasEnoughCredits) {
                return {
                    success: false,
                    error: `Crédits insuffisants. Requis: ${costEstimate.creditsRequired}, Disponibles: ${userCredits}`
                };
            }

            // 2. Fetch artisan métiers
            const metiers = await this.getArtisanMetiers(request.profileId);

            if (metiers.length === 0) {
                return { success: false, error: "Aucun métier configuré pour cet artisan" };
            }

            // 2. Build the prompt
            const prompt = this.buildSimulationPrompt(metiers, request.scoreBreakdown, request.prestations);

            // 3. Fetch the facade image and convert to base64
            const imageData = await this.fetchImageAsBase64(request.facadeImageUrl);

            // 4. Configure Gemini for image generation
            const config = {
                responseModalities: ["IMAGE"] as string[],
            };

            const model = "gemini-2.5-flash-image";

            const contents = [
                {
                    role: "user" as const,
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: imageData.mimeType,
                                data: imageData.data,
                            },
                        },
                    ],
                },
            ];

            console.log("Generating facade renovation simulation...");

            // 5. Charge credits BEFORE generating
            try {
                await CreditLedger.createEntry({
                    profileId: request.profileId,
                    type: "simulation",
                    amount: -Math.abs(costEstimate.creditsRequired),
                    referenceId: request.scanFacadeId,
                    referenceType: "simulation_generation",
                    idempotencyKey: `simulation_${request.scanFacadeId}_${Date.now()}`,
                    metadata: {
                        facade_id: request.facadeId,
                        api_cost: costEstimate.apiCostInDollars,
                        charged_at: new Date().toISOString()
                    }
                });
                console.log(`Charged ${costEstimate.creditsRequired} credits for simulation generation`);
            } catch (chargeError) {
                console.error("Failed to charge credits:", chargeError);
                return {
                    success: false,
                    error: "Échec de la facturation des crédits"
                };
            }

            // 6. Call Gemini API with streaming
            const response = await this.ai.models.generateContentStream({
                model,
                config,
                contents,
            });

            // 7. Extract generated image from response
            let generatedBlob: Blob | null = null;

            for await (const chunk of response) {
                if (!chunk.candidates?.[0]?.content?.parts) {
                    continue;
                }

                const part = chunk.candidates[0].content.parts[0];
                if (part?.inlineData?.data) {
                    console.log("Found generated image data in response");

                    const binaryString = atob(part.inlineData.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    generatedBlob = new Blob([bytes], {
                        type: part.inlineData.mimeType || "image/png"
                    });
                    break;
                }
            }

            if (!generatedBlob) {
                return { success: false, error: "Aucune image générée par l'IA" };
            }

            // 8. Create local blob URL for immediate display
            const localImageUrl = URL.createObjectURL(generatedBlob);

            // 9. Store in background and update database (non-blocking)
            this.storeAndUpdateInBackground(generatedBlob, request.facadeId, request.scanFacadeId);

            return { success: true, localImageUrl };

        } catch (error) {
            console.error("Simulation generation error:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Erreur inconnue"
            };
        }
    }

    /**
     * Store image and update database in background (non-blocking)
     */
    private async storeAndUpdateInBackground(
        blob: Blob,
        facadeId: string,
        scanFacadeId: string
    ): Promise<void> {
        try {
            const storedUrl = await this.uploadSimulatedImage(blob, facadeId);
            if (storedUrl) {
                await this.updateScanFacadeSimulatedImage(scanFacadeId, storedUrl);
                console.log("Simulation image stored successfully:", storedUrl);
            }
        } catch (error) {
            console.error("Error storing simulation image in background:", error);
        }
    }

    /**
     * Upload simulated image to Supabase storage
     */
    private async uploadSimulatedImage(blob: Blob, facadeId: string): Promise<string | null> {
        try {
            const timestamp = Date.now();
            const fileName = `simulations/${facadeId}/${timestamp}_simulation.png`;

            const { data, error } = await supabase.storage
                .from("facades")
                .upload(fileName, blob, {
                    contentType: blob.type || "image/png",
                    upsert: true
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("facades")
                .getPublicUrl(data.path);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error uploading simulated image:", error);
            return null;
        }
    }

    /**
     * Update scan_facades record with simulated image URL
     */
    private async updateScanFacadeSimulatedImage(scanFacadeId: string, imageUrl: string): Promise<void> {
        try {
            const { error } = await supabase
                .from("scan_facades")
                .update({ simulated_facade_image: imageUrl })
                .eq("id", scanFacadeId);

            if (error) throw error;
        } catch (error) {
            console.error("Error updating scan_facades simulated image:", error);
            throw error;
        }
    }
}

export const GeminiSimulationServiceInstance = new GeminiSimulationService();
