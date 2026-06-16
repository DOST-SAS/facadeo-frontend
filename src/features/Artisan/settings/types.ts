export type TariffConfiguration = {
    id: string
    service_name: string
    unit: string
    unit_price_cents: number
    quantity: number
}

export type TradeConfiguration = {
    id: string
    metier_id: string
    metier_label: string
    description: string
    tariffConfigurations: TariffConfiguration[]
}

export type EnterpriseProfile = {
    activityType: "auto" | "entreprise"
    companyName: string
    sirenNumber: string | null
    tradeConfigurations: TradeConfiguration[]
    companyLogo: string
    signature: string
    professionalAddress: string
    city: string
    zipCode: string
    country: string
    professionalEmail: string
    professionalPhone: string
    p_provider: string
}
