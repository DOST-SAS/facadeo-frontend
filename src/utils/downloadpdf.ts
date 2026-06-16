
import { toast } from "react-hot-toast"

export const downloadPdf = async (pdfUrl: string, fileName: string = 'devis.pdf', setLoading?: (loading: boolean) => void) => {
    if (!pdfUrl) {
        toast.error("Aucun PDF disponible")
        return
    }

    try {
        if (setLoading) setLoading(true)
        const response = await fetch(pdfUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error("Error downloading PDF:", error)
        toast.error("Erreur lors du téléchargement du PDF")
    } finally {
        if (setLoading) setLoading(false)
    }
}
