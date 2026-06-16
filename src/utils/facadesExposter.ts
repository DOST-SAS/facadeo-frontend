import jsPDF from "jspdf"
import type { Facade } from "@/types/scansTypes"
import { getPlaceTypeLabel } from "./businessTypeConverter"

// --- HELPERS ---

const getStreetviewImage = (facade: Facade): string | null => {
    if (!facade.streetview_url) return null
    try {
        if (typeof facade.streetview_url === 'string') {
            if (facade.streetview_url.startsWith('[')) {
                const urls = JSON.parse(facade.streetview_url)
                return urls[0] || null
            }
            return facade.streetview_url
        }
    } catch {
        return null
    }
    return null
}

const getImageDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                } catch (e) {
                    resolve('');
                }
            } else {
                resolve('');
            }
        };
        img.onerror = () => {
            resolve('');
        };
        img.src = url;
    });
}

// --- CONSTANTS ---
const COLORS = {
    primary: [59, 130, 246] as [number, number, number],
    primaryLight: [219, 234, 254] as [number, number, number],
    accent: [139, 92, 246] as [number, number, number],
    bg: [255, 255, 255] as [number, number, number],
    bgGray: [249, 250, 251] as [number, number, number],
    cardBorder: [226, 232, 240] as [number, number, number],
    textDark: [15, 23, 42] as [number, number, number],
    textMuted: [100, 116, 139] as [number, number, number],
    badgeGreen: [34, 197, 94] as [number, number, number],
    badgeYellow: [234, 179, 8] as [number, number, number],
    badgeRed: [239, 68, 68] as [number, number, number],
}

// --- MAIN FUNCTION ---

export const generateFacadesPdf = async (facades: Facade[], scanName: string) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Card dimensions - horizontal list item (compact)
    const cardHeight = 20;
    const cardSpacing = 4;

    let yPos = 30; // Start after simple header

    // --- SIMPLE HEADER ---
    // Title
    doc.setFontSize(18);
    doc.setTextColor(...COLORS.textDark);
    doc.setFont("helvetica", "bold");
    doc.text(scanName, margin, 15);

    // Info line
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textMuted);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString('fr-FR');
    doc.text(`Date: ${dateStr} | ${facades.length} facades analysees`, margin, 22);

    // Simple separator line
    doc.setDrawColor(...COLORS.cardBorder);
    doc.setLineWidth(0.5);
    doc.line(margin, 26, pageWidth - margin, 26);

    // --- FACADES LIST ---
    for (let i = 0; i < facades.length; i++) {
        const facade = facades[i];

        // Page break logic
        if (yPos + cardHeight > pageHeight - margin - 10) {
            doc.addPage();
            yPos = margin;
        }

        // Fetch Image
        const imageUrl = getStreetviewImage(facade);
        let imageData = '';
        if (imageUrl) {
            imageData = await getImageDataUrl(imageUrl);
        }

        // --- CARD BACKGROUND ---
        // Subtle alternating background
        if (i % 2 === 0) {
            doc.setFillColor(...COLORS.bgGray);
            doc.roundedRect(margin - 2, yPos - 2, pageWidth - (margin * 2) + 4, cardHeight + 4, 3, 3, 'F');
        }

        // Card border
        doc.setDrawColor(...COLORS.cardBorder);
        doc.setLineWidth(0.3);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, yPos, pageWidth - (margin * 2), cardHeight, 2, 2, 'FD');

        // --- LEFT: IMAGE ---
        const imgSize = 15;
        const imgX = margin + 2;
        const imgY = yPos + 2;

        doc.setDrawColor(...COLORS.cardBorder);
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 4, 4, 'S');

        if (imageData) {
            try {
                doc.addImage(imageData, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch (e) { }
        } else {
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(imgX, imgY, imgSize, imgSize, 2, 2, 'F');
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(8);
            doc.text("-", imgX + imgSize / 2, imgY + imgSize / 2 + 0.5, { align: 'center' });
        }

        // --- MIDDLE: INFO ---
        const infoX = imgX + imgSize + 5;
        const infoWidth = pageWidth - margin - infoX - 25; // Leave space for score

        // Name
        let name = facade.business?.name || facade.address?.name || `Facade #${facade.facade_number}`;
        if (name.length > 50) name = name.substring(0, 47) + "...";

        doc.setTextColor(...COLORS.textDark);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(name, infoX, yPos + 6);

        // Address (compact, single line)
        let address = facade.formatted_address || facade.address?.street || "Adresse non specifiee";
        if (address.length > 60) address = address.substring(0, 57) + "...";

        doc.setTextColor(...COLORS.textMuted);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(address, infoX, yPos + 11);

        // Tags row (compact)
        const tagY = yPos + 13;
        let tagX = infoX;

        // Type tag - get first type from comma-separated string and convert to French
        let type = "Autre";
        if (facade.types) {
            const types = facade.types.split(',').map(t => t.trim());
            if (types.length > 0) {
                type = getPlaceTypeLabel(types[0]);
            }
        }
        type = type.toUpperCase();
        const typeWidth = doc.getTextWidth(type) + 3;

        doc.setFillColor(...COLORS.primaryLight);
        doc.roundedRect(tagX, tagY, typeWidth, 4, 0.5, 0.5, 'F');
        doc.setTextColor(...COLORS.primary);
        doc.setFontSize(6);
        doc.setFont("helvetica", "bold");
        doc.text(type, tagX + 1.5, tagY + 2.8);

        tagX += typeWidth + 2;

        // Surface tag
        const surface = facade.surface_m2 ? `${facade.surface_m2} m²` : "N/A";
        const surfaceWidth = doc.getTextWidth(surface) + 3;

        doc.setFillColor(243, 244, 246);
        doc.roundedRect(tagX, tagY, surfaceWidth, 4, 0.5, 0.5, 'F');
        doc.setTextColor(...COLORS.textMuted);
        doc.setFont("helvetica", "normal");
        doc.text(surface, tagX + 1.5, tagY + 2.8);

        // --- RIGHT: SCORE CIRCLE ---
        const score = facade.score || 0;
        let scoreColor = COLORS.textMuted;
        if (score >= 75) scoreColor = COLORS.badgeGreen;
        else if (score >= 40) scoreColor = COLORS.badgeYellow;
        else scoreColor = COLORS.badgeRed;

        const circleSize = 12;
        const circleX = pageWidth - margin - circleSize - 2;
        const circleY = yPos + cardHeight / 2;

        // Outer ring
        doc.setDrawColor(...scoreColor);
        doc.setLineWidth(1);
        doc.circle(circleX, circleY, circleSize / 2, 'S');

        // Inner fill
        doc.setFillColor(...scoreColor);
        doc.circle(circleX, circleY, (circleSize / 2) - 1.5, 'F');

        // Score text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(String(score), circleX, circleY + 0.8, { align: 'center', baseline: 'middle' });

        yPos += cardHeight + cardSpacing;
    }

    // --- FOOTER ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(...COLORS.cardBorder);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Page number
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.textMuted);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

        // Footer text
        doc.setFontSize(7);
        doc.text("Genere par Scan Manager", margin, pageHeight - 6);
        doc.text(new Date().toLocaleString('fr-FR'), pageWidth - margin, pageHeight - 6, { align: 'right' });
    }

    const filename = `Rapport_${scanName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
}