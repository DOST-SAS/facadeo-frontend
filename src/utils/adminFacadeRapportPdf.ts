import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Facade } from '@/types/scansTypes';
import { getPlaceTypeLabel } from '@/utils/businessTypeConverter';

interface FacadeReportData {
    facade: Facade;
    totalDetected: number;
}

const THEME = {
    primary: '#0F766E', // Teal 700
    primaryLight: '#F0FDFA', // Teal 50
    secondary: '#F8FAFC', // Slate 50
    textDark: '#0F172A', // Slate 900
    textMedium: '#475569', // Slate 600
    textLight: '#94A3B8', // Slate 400
    border: '#E2E8F0', // Slate 200
    white: '#ffffff',
    success: '#10B981',
    warning: '#F59E0B',
    destructive: '#EF4444',
    bgLight: '#F1F5F9',
};

const parseScoreBreakdown = (scoreBreakdown: string | null): string => {
    switch (scoreBreakdown) {
        case 'fissures':
        case 'facade_fissuree':
            return 'Fissures';
        case 'humidite':
            return 'Humidité';
        case 'ecaillage':
        case 'facade_ecailee':
            return 'Écaillage';
        case 'salissures':
        case 'facade_ternie':
            return 'Salissures / Ternie';
        case 'decoloration':
        case 'facade_degradee_tags_ou_temps':
            return 'Décoloration / Dégradée';
        default:
            return scoreBreakdown || '-';
    }
};

const getScoreColor = (score: number) => {
    if (score < 40) return THEME.destructive;
    if (score >= 40 && score <= 75) return THEME.warning;
    return THEME.success;
};

const parseImageUrls = (imageUrl: string | null): string[] => {
    if (!imageUrl) return [];
    try {
        if (imageUrl.startsWith('[')) return JSON.parse(imageUrl);
        return [imageUrl];
    } catch {
        return [];
    }
};

const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
    });
};

export const generateAdminFacadeReportPdf = async (data: FacadeReportData): Promise<Blob> => {
    const { facade, totalDetected } = data;

    // Extract data with fallbacks (checking both top-level and businesses_cache)
    const website = facade.website || (facade as any).businesses_cache?.website || 'N/A';
    const phone = facade.formatted_phone_number || (facade as any).businesses_cache?.formatted_phone_number || 'N/A';
    const address = facade.formatted_address || (facade as any).businesses_cache?.formatted_address || (facade as any).address?.formatted_address || 'Adresse non spécifiée';

    const imageUrls = parseImageUrls(facade.streetview_url || facade.simulated_image_url || null);
    const mainImage = imageUrls[0] || window.location.origin + '/facade.png';
    const logoUrl = window.location.origin + '/darkLogo.png';
    const scoreColor = getScoreColor(facade.score || 0);

    await Promise.all([
        preloadImage(mainImage),
        preloadImage(logoUrl),
    ]);

    const tempElement = document.createElement('div');
    Object.assign(tempElement.style, {
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '800px',
        height: '1132px', // Strict A4
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: THEME.textDark,
        backgroundColor: THEME.white,
        padding: '0',
        boxSizing: 'border-box',
        overflow: 'hidden'
    });

    tempElement.innerHTML = `
  <div style="width: 100%; height: 100%; box-sizing: border-box; background: white; padding: 40px; position: relative;">
    
    <!-- Top Accent Bar -->
    <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${THEME.primary}, ${THEME.success});"></div>

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; margin-top: 5px;">
      <div style="display: flex; flex-direction: column;">
        <img src="${logoUrl}" style="height: 40px; width: auto; max-width: 140px; margin-bottom: 8px; object-fit: contain;" crossorigin="anonymous"/>
        <div style="font-size: 10px; font-weight: 600; color: ${THEME.textLight}; letter-spacing: 0.5px; text-transform: uppercase;">
          Expertise IA d'Inspection de Façade
        </div>
      </div>
      <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
        <div style="background: ${THEME.primaryLight}; color: ${THEME.primary}; padding: 4px 12px; border-radius: 6px; font-size: 10px; font-weight: 700; display: inline-block; margin-bottom: 4px; border: 1px solid ${THEME.primary}20; text-transform: uppercase;">
          Rapport #${facade.facade_number || facade.id.substring(0, 8)}
        </div>
        <div style="font-size: 11px; color: ${THEME.textMedium}; font-weight: 500;">Le ${new Date().toLocaleDateString('fr-FR')}</div>
      </div>
    </div>

    <!-- Hero Section -->
    <div style="position: relative; margin-bottom: 25px; border-radius: 16px; overflow: hidden; background: ${THEME.secondary}; height: 380px;">
      <img src="${mainImage}" style="width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous"/>
      
      <!-- Score Card -->
      <div style="position: absolute; bottom: 15px; right: 15px; background: rgba(255, 255, 255, 0.95); padding: 15px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.8); width: 110px; text-align: center; box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
        <div style="font-size: 9px; font-weight: 800; color: ${THEME.textMedium}; text-transform: uppercase; margin-bottom: 3px;">Santé</div>
        <div style="font-size: 30px; font-weight: 900; color: ${scoreColor}; line-height: 1;">${facade.score}</div>
        <div style="font-size: 11px; font-weight: 700; color: ${THEME.textLight}; margin-top: 1px;">/ 100</div>
      </div>

      <!-- Location Badge -->
      <div style="position: absolute; top: 15px; left: 15px; background: rgba(255, 255, 255, 0.95); padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 80%;">
        <div style="font-size: 12px; font-weight: 700; color: ${THEME.textDark}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${address}
        </div>
      </div>
    </div>

    <!-- Key Metrics Row -->
    <div style="display: flex; gap: 12px; margin-bottom: 25px; width: 100%;">
      <div style="flex: 1; background: ${THEME.secondary}; padding: 12px; border-radius: 10px; border: 1px solid ${THEME.border}; min-width: 0;">
        <div style="color: ${THEME.textLight}; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; font-size: 8px;">Détection</div>
        <div style="font-size: 11px; font-weight: 700; color: ${THEME.textDark}; font-family: 'Inter', sans-serif;">${new Date(facade.detected_at).toLocaleDateString('fr-FR')}</div>
      </div>
      <div style="flex: 1; background: ${THEME.secondary}; padding: 12px; border-radius: 10px; border: 1px solid ${THEME.border}; min-width: 0;">
        <div style="color: ${THEME.textLight}; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; font-size: 8px;">Fréquence</div>
        <div style="font-size: 11px; font-weight: 700; color: ${THEME.textDark}; font-family: 'Inter', sans-serif;">${totalDetected} fois</div>
      </div>
      <div style="flex: 1.2; background: ${THEME.secondary}; padding: 12px; border-radius: 10px; border: 1px solid ${THEME.border}; min-width: 0;">
        <div style="color: ${THEME.textLight}; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; font-size: 8px;">Site Web</div>
        <div style="font-size: 10px; font-weight: 700; color: ${THEME.primary}; word-break: break-all; line-height: 1.2;">${website}</div>
      </div>
      <div style="flex: 1; background: ${THEME.secondary}; padding: 12px; border-radius: 10px; border: 1px solid ${THEME.border}; min-width: 0;">
        <div style="color: ${THEME.textLight}; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; font-size: 8px;">Téléphone</div>
        <div style="font-size: 11px; font-weight: 700; color: ${THEME.textDark}; font-family: 'Inter', sans-serif;">${phone}</div>
      </div>
    </div>

    <!-- Analysis Section -->
    <div style="display: flex; gap: 20px; margin-bottom: 25px;">
      
      <!-- Defects Breakdown -->
      <div style="flex: 1.6; background: white; border-radius: 16px; border: 1px solid ${THEME.border}; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
          <div style="width: 3px; height: 16px; background: ${THEME.primary}; border-radius: 2px;"></div>
          <h3 style="font-size: 14px; font-weight: 800; color: ${THEME.textDark}; margin: 0; text-transform: uppercase;">Diagnostic Technique</h3>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${facade.score_breakdown ? Object.entries(facade.score_breakdown)
            .filter(([name]) => name !== 'surface_m')
            .map(([name, value]) => {
                const percentage = typeof value === 'number' ? value : 0;
                let color = THEME.success;
                if (percentage > 40 && percentage <= 75) color = THEME.warning;
                if (percentage > 75) color = THEME.destructive;

                return `
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 4px;">
                    <span style="font-size: 11px; font-weight: 700; color: ${THEME.textMedium};">${parseScoreBreakdown(name)}</span>
                    <span style="font-size: 10px; font-weight: 800; color: ${color};">${percentage}%</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: ${THEME.secondary}; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 10px;"></div>
                  </div>
                </div>
              `;
            }).join('') : '<div style="font-size: 11px; font-style: italic; color: ${THEME.textLight};">Données non disponibles</div>'}
        </div>
      </div>

      <!-- Side Section -->
      <div style="flex: 1; display: flex; flex-direction: column; gap: 15px;">
        <!-- Commerce Type -->
        <div style="background: white; border-radius: 16px; border: 1px solid ${THEME.border}; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div style="width: 3px; height: 16px; background: ${THEME.warning}; border-radius: 2px;"></div>
            <h3 style="font-size: 12px; font-weight: 800; color: ${THEME.textDark}; margin: 0; text-transform: uppercase;">Activité</h3>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${facade.types ? facade.types.split(',').slice(0, 4).map(type => `
              <span style="background: ${THEME.primary}10; color: ${THEME.primary}; padding: 3px 8px; border-radius: 4px; font-size: 8px; font-weight: 800; border: 1px solid ${THEME.primary}15;">
                ${getPlaceTypeLabel(type.trim())}
              </span>
            `).join('') : '<span style="font-size: 9px; font-style: italic; color: ${THEME.textLight};">N/A</span>'}
          </div>
        </div>

        <!-- Conclusion -->
        <div style="background: ${THEME.primary}; border-radius: 16px; padding: 20px; color: white; box-shadow: 0 8px 16px ${THEME.primary}25;">
          <div style="font-size: 11px; font-weight: 700; margin-bottom: 6px;">Diagnostic</div>
          <p style="font-size: 9px; font-weight: 500; line-height: 1.5; margin: 0; opacity: 0.95;">
            ${facade.score && facade.score < 50
            ? "Intervention prioritaire requise. Dégradations majeures impactant la valeur et l'image."
            : facade.score && facade.score < 80
                ? "Entretien préventif nécessaire pour ralentir le processus d'usure identifié."
                : "État global satisfaisant. Aucun défaut critique nécessitant des travaux immédiats."}
          </p>
        </div>
      </div>
    </div>

    <!-- Secondary Images (Thumbnails) -->
    ${imageUrls.length > 1 ? `
    <div style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div style="width: 3px; height: 16px; background: ${THEME.textLight}; border-radius: 2px;"></div>
        <h3 style="font-size: 13px; font-weight: 800; color: ${THEME.textDark}; margin: 0; text-transform: uppercase;">Points de Vue</h3>
      </div>
      <div style="display: flex; gap: 10px; width: 100%;">
        ${imageUrls.slice(1, 4).map(url => `
          <div style="flex: 1; border-radius: 10px; overflow: hidden; border: 1px solid ${THEME.border}; height: 90px; background: ${THEME.secondary};">
            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; display: block;" crossorigin="anonymous"/>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- Footer -->
    <div style="position: absolute; bottom: 30px; left: 40px; right: 40px; text-align: center; border-top: 1px solid ${THEME.border}; padding-top: 15px;">
      <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 10px;">
         <span style="font-size: 7px; font-weight: 800; color: ${THEME.textLight}; text-transform: uppercase; display: flex; align-items: center; gap: 3px;">
            <div style="width: 3px; height: 3px; border-radius: 50%; background: ${THEME.success};"></div> Précis
         </span>
         <span style="font-size: 7px; font-weight: 800; color: ${THEME.textLight}; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            <div style="width: 3px; height: 3px; border-radius: 50%; background: ${THEME.primary};"></div> Rapide
         </span>
         <span style="font-size: 7px; font-weight: 800; color: ${THEME.textLight}; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            <div style="width: 3px; height: 3px; border-radius: 50%; background: ${THEME.warning};"></div> Expertise
         </span>
      </div>
      <div style="font-size: 8px; color: ${THEME.textLight}; font-weight: 500; font-style: italic;">
        Inspecté par <strong>FAÇADEO Digital Signature</strong> • Document non contractuel de diagnostic visuel.
      </div>
    </div>

  </div>
  `;

    document.body.appendChild(tempElement);

    try {
        const canvas = await html2canvas(tempElement, {
            scale: 2.2, // Balanced for file size and quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 800,
            windowHeight: 1132
        });

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        return pdf.output('blob');
    } finally {
        document.body.removeChild(tempElement);
    }
};
