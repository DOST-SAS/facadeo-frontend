import { apiRequest, supabase } from "@/api/api"

class LeadService {

    async queueEmail(payload: any) {
        const { data: templates, error: templateError } = await supabase
            .from("email_templates")
            .select("*")
            .eq("name", payload.template_name)
            .single();

        if (templateError) throw templateError;
        let subject = templates.subject;
        let body = templates.body;

        Object.keys(payload.variables || {}).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, "g");
            subject = subject.replace(regex, payload.variables[key]);
            body = body.replace(regex, payload.variables[key]);
        });

        const { data, error } = await supabase.from("email_queue").insert([{
            template_name: payload.template_name,
            to_email: payload.to_email,
            profile_id: payload.profile_id,
            from_email: payload.from_email,
            from_name: payload.from_name,
            subject,
            body,
            variables: payload.variables || {},
            max_attempts: payload.max_attempts || 3,
            metadata: payload.metadata || {}
        }]);

        if (error) throw error;

        return data;
    }


    async SendDevisByWhatsapp(devis: any, status?: string) {
        try {
            const finalStatus = status || "sent"
            const actionLabel = finalStatus === "sent" ? "envoyer" : `mettre à jour le statut (${finalStatus}) de`
            const message = `*Devis ${devis.quote_number}*

Bonjour *${devis.client_name}*,

Nous avons le plaisir de vous ${actionLabel} votre devis.

*Consulter le devis en ligne* :
${window.location.origin}/devis/${devis.id}

_Merci pour votre confiance._
— *FAÇADEO*`;

            const encodedMessage = encodeURIComponent(message)
            const whatsappUrl = `https://wa.me/${devis.client_phone.replace(/[^\d+]/g, '')}?text=${encodedMessage}`
            window.open(whatsappUrl, '_blank')
        } catch (error) {
            console.error("Error sending lead by whatsapp:", error)
            throw error
        }
    }


}

export const LeadServiceInstance = new LeadService();