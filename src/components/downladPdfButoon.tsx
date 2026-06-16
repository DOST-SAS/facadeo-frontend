import { generateDevisPdf } from "@/utils/generateDevisPdf"

export default function DownloadPdfButton() {
    const devisData = {
        ref: "DV-2025-001",
        artisan: {
            name: "Artisan Example",
            companyName: "Entreprise Exemple",
            email: "artisan@example.com",
            phone: "+33 6 12 34 56 78",
            siret: "12345678901234",
            address: "123 Rue Example, 75001 Paris"
        },
        client: "Entreprise ABC",
        date: new Date().toLocaleDateString(),
        items: [
            { label: "Scan façade", quantity: 1, price: 120, unit: "m²" },
            { label: "Analyse technique", quantity: 1, price: 80, unit: "forfait" },
        ],
        subtotal: 200,
        tvaRate: 20,
        tvaAmount: 40,
        totalTTC: 240
    }

    return (
        <button
            onClick={async () => await generateDevisPdf(devisData)}
            className="px-4 py-2 bg-black text-white rounded"
        >
            Télécharger le devis
        </button>
    )
}
