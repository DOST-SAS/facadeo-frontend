import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DevisPDFData {
  ref: string;
  artisan: {
    name: string;
    companyName?: string;
    email: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
    signatureUrl?: string;
  };
  client: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  date: string;
  validUntil?: string;
  items: Array<{
    label: string;
    quantity: number;
    unit: string;
    price: number;
  }>;
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  totalTTC: number;
  includeBeforeAfter?: boolean;
  imageBefore?: string;
  imageAfter?: string;
  facadeAddress?: string;
  facadeScore?: string | number;
  notes?: string;
}

// HEX theme consistent with application design
const THEME = {
  primary: '#0F766E', // Teal 700
  secondary: '#F1F5F9', // Slate 100
  textDark: '#1E293B', // Slate 800
  textMedium: '#475569', // Slate 600
  textLight: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  white: '#ffffff',
  accentBg: '#F8FAFC', // Slate 50
};

export const generateDevisPdf = async (data: DevisPDFData): Promise<Blob> => {
  const tempElement = document.createElement('div');
  Object.assign(tempElement.style, {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    width: '640px', // A4 width at 72dpi
    fontFamily: "'Inter', system-ui, sans-serif",
    color: THEME.textDark,
    backgroundColor: THEME.white,
    padding: '40px',
    boxSizing: 'border-box'
  });

  tempElement.innerHTML = `
    <div style="width: 100%; box-sizing: border-box;">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid ${THEME.primary}; padding-bottom: 20px;">
        <div style="flex: 1;">
          ${data.artisan.logoUrl
      ? `<img src="${data.artisan.logoUrl}" style="max-height: 80px; max-width: 150px; margin-bottom: 15px; object-fit: contain;" crossorigin="anonymous"/>`
      : `<div style="width: 60px; height: 60px; background: ${THEME.textDark}; color: ${THEME.white}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 24px; border-radius: 8px; margin-bottom: 10px;">${data.artisan.name.charAt(0)}</div>`
    }
          <div style="font-weight: 700; font-size: 18px; margin-bottom: 5px;">${data.artisan.companyName || data.artisan.name}</div>
          <div style="color: ${THEME.textLight}; font-size: 11px; line-height: 1.5;">
            ${data.artisan.address ? `${data.artisan.address}<br/>` : ""}
            ${data.artisan.email}<br/>
            ${data.artisan.phone || ""}
          </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-end;">
          <h1 style="color: ${THEME.primary}; font-size: 36px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">DEVIS</h1>
          <div style="font-size: 14px; font-weight: 500; color: ${THEME.textMedium}; margin-bottom: 2px;">Réf. ${data.ref}</div>
          <div style="font-size: 12px; color: ${THEME.textLight};">Date : ${data.date}</div>
          ${data.validUntil ? `<div style="font-size: 12px; color: ${THEME.textLight}; margin-top: 2px;">Valide jusqu'au : ${data.validUntil}</div>` : ''}
        </div>
      </div>

      <!-- Information Cards Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
        <!-- Client Card -->
        <div style="background-color: ${THEME.accentBg}; padding: 10px; border-radius: 6px; border: 1px solid ${THEME.border}; ">
          <div style="font-size: 12px; font-weight: 700; color: ${THEME.primary}; margin-bottom: 10px; text-transform: uppercase;">Informations Client</div>
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 5px;">${data.client}</div>
          <div style="font-size: 12px; color: ${THEME.textMedium}; line-height: 1.5;">
            ${data.clientAddress ? `${data.clientAddress}<br/>` : ""}
            Email : ${data.clientEmail ? ` ${data.clientEmail}` : "-"} 
            <br/>Téléphone :${data.clientPhone ? ` ${data.clientPhone}` : "-"}
          </div>
        </div>

        <!-- Facade Card -->
        ${(data.facadeAddress || data.facadeScore) ? `
        <div style="background-color: ${THEME.accentBg}; padding: 10px; border-radius: 6px; border: 1px solid ${THEME.border};">
          <div style="font-size: 12px; font-weight: 700; color: ${THEME.primary}; margin-bottom: 10px; text-transform: uppercase;">Façade Concernée</div>
          <div style="font-size: 12px; color: ${THEME.textMedium}; line-height: 1.5;">
            ${data.facadeAddress ? `<div style="margin-bottom: 5px;"><strong>Adresse :</strong><br/>${data.facadeAddress}</div>` : ''}
          </div>
        </div>` : '<div style="visibility: hidden;"></div>'}
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 40px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 12px 10px; color: ${THEME.textMedium}; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid ${THEME.border};">Désignation</th>
              <th style="text-align: right; padding: 12px 10px; color: ${THEME.textMedium}; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid ${THEME.border}; width: 100px;">Prix</th>
              <th style="text-align: right; padding: 12px 10px; color: ${THEME.textMedium}; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid ${THEME.border}; width: 80px;">Qté</th>
              <th style="text-align: right; padding: 12px 10px; color: ${THEME.textMedium}; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid ${THEME.border}; width: 100px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, i) => `
              <tr style="background-color: ${i % 2 === 0 ? THEME.white : '#FCFCFD'};">
                <td style="padding: 12px 10px; border-bottom: 1px solid ${THEME.border}; font-size: 12px; font-weight: 500; color: ${THEME.textDark};">${item.label}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid ${THEME.border}; text-align: right; font-size: 12px; font-family: monospace; color: ${THEME.textMedium};">${item.price.toFixed(2)} €</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid ${THEME.border}; text-align: right; font-size: 12px; font-family: monospace; color: ${THEME.textMedium};">${item.quantity} ${item.unit === 'unit' ? 'Unités' : item.unit}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid ${THEME.border}; text-align: right; font-size: 12px; font-weight: 600; font-family: monospace; color: ${THEME.textDark};">${(item.price * item.quantity).toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 280px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: ${THEME.textMedium};">
            <span>Total HT</span>
            <span style="font-family: monospace; font-weight: 600;">${data.subtotal.toFixed(2)} €</span>
          </div>
          ${data.tvaRate > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; color: ${THEME.textMedium}; border-bottom: 1px solid ${THEME.border}; margin-bottom: 8px;">
            <span>TVA (${data.tvaRate}%)</span>
            <span style="font-family: monospace; font-weight: 600;">${data.tvaAmount.toFixed(2)} €</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${THEME.primary}; color: ${THEME.white}; padding: 12px 16px; border-radius: 6px; margin-top: 5px;">
            <span style="font-weight: 600; font-size: 14px;">Total TTC</span>
            <span style="font-weight: 700; font-size: 18px; font-family: monospace;">${data.totalTTC.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <!-- Before/After Simulation -->
      ${data.includeBeforeAfter && (data.imageBefore || data.imageAfter) ? `
      <div style="margin-bottom: 40px; page-break-inside: avoid;">
        <div style="border-left: 4px solid ${THEME.primary}; padding-left: 12px; margin-bottom: 15px;">
          <h3 style="margin: 0; font-size: 14px; color: ${THEME.textDark}; text-transform: uppercas;">Simulation de Rénovation</h3>
        </div>
        <div style="display: flex; gap: 20px;">
          ${data.imageBefore ? `
          <div style="flex: 1;">
            <div style="font-size: 10px; font-weight: 700; color: ${THEME.textLight}; margin-bottom: 8px; text-transform: uppercase;">État Actuel</div>
            <div style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid ${THEME.border}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <img src="${data.imageBefore}" style="width: 100%; height: 160px; object-fit: cover; display: block;" crossorigin="anonymous"/>
            </div>
          </div>` : ''}
          ${data.imageAfter ? `
          <div style="flex: 1;">
            <div style="font-size: 10px; font-weight: 700; color: ${THEME.primary}; margin-bottom: 8px; text-transform: uppercase;">Simulation Projetée</div>
            <div style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid ${THEME.primary}; box-shadow: 0 4px 6px -1px rgba(15, 118, 110, 0.2);">
              <img src="${data.imageAfter}" style="width: 100%; height: 160px; object-fit: cover; display: block;" crossorigin="anonymous"/>
            </div>
          </div>` : ''}
        </div>
      </div>` : ''}

      <!-- Footer / Notes -->
      <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid ${THEME.border}; text-align: center;">
        ${data.notes ? `<div style="background-color: #FFFBEB; padding: 10px; border-radius: 4px; font-size: 11px; color: ${THEME.textMedium}; margin-bottom: 15px; font-style: italic; border-left: 3px solid #F59E0B;">
          <strong>Notes:</strong> ${data.notes}
        </div>` : ''}
        <div style="color: ${THEME.textLight}; font-size: 10px;">
          ${data.tvaRate === 0 ? '<div style="margin-bottom: 5px; font-style: italic;">TVA non applicable, art. 293 B du CGI</div>' : ''}
          Document généré par <strong>FAÇADEO</strong> - La solution pour les artisans façadiers.
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(tempElement);

  try {
    const canvas = await html2canvas(tempElement, {
      scale: 2, // High resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
    const imgX = (pdfWidth - canvas.width * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'JPEG', imgX, imgY, canvas.width * ratio, canvas.height * ratio);

    return pdf.output('blob');
  } finally {
    document.body.removeChild(tempElement);
  }
};
