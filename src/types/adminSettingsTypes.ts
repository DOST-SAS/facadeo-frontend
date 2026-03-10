export type Settings = {
    id: string;
    // Global
    maxScanRadiusMeters: number;
    extractedDataExpirationDays: number;
    retainUnusedCredits: boolean;

    // API & Tariffs
    googleMapsKey: { key: string, tarif: number };
    googlePlacesKey: { key: string, tarif: number };
    streetViewKey: { key: string, tarif: number };
    geminiNanoKey: { key: string, tarif: number };
    geminiNanoImageKey: { key: string, tarif: number };
    apifyApiKey: { key: string, tarif: number };
    BREVO_API_KEY: string;
    emailSender: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_SECRET_KEY: string;

    // Notifications
    emailEnabled: boolean;
    notifyOnScan: boolean;
    notifyOnDevis: boolean;
    alertEmail: string;

    // Sender Identities
    emailGeneral: { email: string, name: string };
    emailOffers: { email: string, name: string };
    emailSupport: { email: string, name: string };
    emailNoReply: { email: string, name: string };
}