import type { UserRole, UserStatus } from "./usersTypes";

export interface TariffConfiguration {
    id: string;
    service_name: string;
    unit: string;
    unit_price_cents: number;
    quantity: number;
}

export interface TradeConfiguration {
    id: string; // profile_metier_id
    metier_id: string;

    // Joined metier info
    metier_label?: string;

    description: string;
    tariffConfigurations: TariffConfiguration[];
}

export interface Metier {
    id: string;
    key: string;
    label: string;
    default_pricing: any;
    description: string | null;
    icon_url: string | null;
    active: boolean;
    sort_order: number;
}

export interface ProfileTariff {
    id: string;
    profile_metier_id: string;
    service_name: string;
    unit: string;
    unit_price_cents: number;
    quantity: number | null;
    metadata: any;
}

export interface ProfileMetier {
    id: string;
    profile_id: string;
    metier_id: string;
    description: string | null;
    active: boolean;

    // Joined data
    metiers?: Metier;
    profile_tariffs?: ProfileTariff[];
}

export interface ArtisanProfile {
    id: string
    role: UserRole
    status: UserStatus
    is_admin: boolean
    display_name: string
    company_name: string
    siret: string
    phone: string
    address: any
    metier_id: string
    logo_url: string
    signature_url: string
    pricing_overrides: any
    settings: any
    onboarding_completed: boolean
    created_at: string
    updated_at: string
    lastLogin: string
    deleted_at: string
    email: string
    avatar: string
    pro_email: string
    pro_phone: string
    adresse: string
    numberScans: number
    numberDevis: number
    is_entreprise?: boolean
    ville: string
    code_postal: string
    pays: string
}

export interface EnterpriseProfile {
    tradeConfigurations: TradeConfiguration[];

}

export interface SecuritySettings {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}


export interface NotificationSettings {
    emailNotifications: boolean;
    smsNotifications: boolean;
}