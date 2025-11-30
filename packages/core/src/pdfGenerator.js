import QRCode from 'qrcode';
import { formatDate } from './utils/date.js';

const DEFAULT_DATE_FORMAT = 'DD-MM-YYYY';

function formatCurrency(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0,00';
  try {
    return new Intl.NumberFormat('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  } catch {
    return num.toFixed(2).replace('.', ',');
  }
}

function formatCurrencyWithSymbol(value) {
  return formatCurrency(value) + ' €';
}

function computeVatSummary(items) {
  const summary = new Map();
  (items || []).forEach(item => {
    const qty = Number(item?.qty || 0);
    const price = Number(item?.price || 0);
    const rate = Number(item?.vatRate || 0);
    if (!(qty > 0)) return;
    const gross = qty * price;
    const factor = 1 + (rate / 100);
    const net = factor > 0 ? gross / factor : gross;
    const vat = gross - net;
    const previous = summary.get(rate) || { net: 0, vat: 0, gross: 0 };
    summary.set(rate, {
      net: previous.net + net,
      vat: previous.vat + vat,
      gross: previous.gross + gross,
    });
  });
  return Array.from(summary.entries())
    .map(([rate, totals]) => ({ rate, ...totals }))
    .sort((a, b) => a.rate - b.rate);
}

function resolvePaymentLabel(method, receiptCfg) {
  const normalized = (method || '').toLowerCase();
  if (receiptCfg?.paymentLabels?.[normalized]) {
    return receiptCfg.paymentLabels[normalized];
  }
  switch (normalized) {
    case 'cash':
      return 'Μετρητοίς';
    case 'card':
      return 'Κάρτα';
    case 'bank':
      return 'Κατάθεση';
    case 'credit':
      return 'Επί Πιστώσει';
    default:
      return method || '-';
  }
}

function formatVatRateDisplay(rate) {
  if (rate == null || rate === '') return '-';
  const num = Number(rate);
  if (!Number.isFinite(num)) return String(rate);
  return String(num).replace('.', ',');
}

/**
 * PDF Generator Module for Italian Corner Invoice App
 * Handles all PDF generation functionality using PDFMake
 */

/**
 * Converts an image URL to base64 data URL
 * @param {string} url - Image URL
 * @param {function} callback - Callback function that receives the base64 data URL
 */
function getImageDataURL(url, callback) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = this.width;
    canvas.height = this.height;
    ctx.drawImage(this, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    callback(dataURL);
  };
  img.onerror = function() {
    // Fallback to empty transparent image if logo fails to load
    callback('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
  };
  img.src = url;
}

/**
 * Creates PDF document definition for PDFMake
 * @param {Object} invoice - Invoice data object
 * @param {Object} branchInfo - Branch information
 * @param {string} logoBase64 - Logo image as base64 string
 * @returns {Object} PDFMake document definition
 */
function createPDFDocumentDefinition(invoice, branchInfo, logoBase64, options = {}) {
  const issuer = branchInfo.issuer || {};
  const qrCodeDataUrl = options.qrCodeDataUrl;
  const paymentMethod = invoice.paymentMethod || 'cash';
  const paymentLabel = resolvePaymentLabel(paymentMethod);
  const docType = branchInfo?.revenueMapping?.documentType || '';
  const revenueCategory = branchInfo?.revenueMapping?.revenueCategory || '';
  const currency = 'EUR';
  const markValue = invoice.mark || invoice.MARK || invoice?.totals?.mark || '';

  // Calculate totals (prefer provided totals to avoid double counting)
  const netTotal = Number(invoice.totals?.net || 0);
  const vatTotal = Number(invoice.totals?.vat || 0);
  const surchargeTotal = Number(
    (invoice.totals && invoice.totals.surcharge != null)
      ? invoice.totals.surcharge
      : (invoice.surcharge || 0)
  );
  const grandTotal = Number(
    (invoice.totals && invoice.totals.gross != null)
      ? invoice.totals.gross
      : (netTotal + vatTotal + surchargeTotal)
  );

  // Create table rows for items
  const itemRows = (invoice.items || []).map(item => {
    const qty = Number(item.qty || 0);
    const grossUnit = Number(item.price || 0);
    const rate = Number(item.vatRate || 0);
    const factor = 1 + (rate / 100);
    const totalAmount = qty * grossUnit; // display gross total per line
    const netAmount = factor > 0 ? totalAmount / factor : totalAmount;
    const vatAmount = totalAmount - netAmount;

    return [
      { text: item.description || '', fontSize: 9 },
      { text: (item.qty || 0).toString(), alignment: 'center', fontSize: 9 },
      { text: (item.price || 0).toFixed(2) + ' €', alignment: 'right', fontSize: 9 },
      { text: '0%', alignment: 'center', fontSize: 9 },
      { text: (item.vatRate || 0) + '%', alignment: 'center', fontSize: 9 },
      { text: totalAmount.toFixed(2) + ' €', alignment: 'right', fontSize: 9 }
    ];
  });

  // Add empty rows to fill the table
  const emptyRowsNeeded = Math.max(0, 6 - (invoice.items?.length || 0));
  for (let i = 0; i < emptyRowsNeeded; i++) {
    itemRows.push([
      { text: '', fontSize: 9 },
      { text: '', fontSize: 9 },
      { text: '', fontSize: 9 },
      { text: '', fontSize: 9 },
      { text: '', fontSize: 9 },
      { text: '', fontSize: 9 }
    ]);
  }

  return {
    content: [
      // Header Section
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: issuer.name || '', style: 'companyName' },
              { text: (issuer.address || '') + ', ' + (issuer.city || '') + ' ' + (issuer.zip || ''), style: 'companyDetails' },
              { text: 'Τηλ.: ' + (issuer.phone || ''), style: 'companyDetails' },
              { text: 'Α.Φ.Μ.: ' + (issuer.vat || ''), style: 'companyDetails' }
            ],
            alignment: 'center'
          },
          {
            width: 180,
            stack: [
              {
                table: {
                  body: [
                    [{ text: 'ΤΙΜΟΛΟΓΙΟ ΠΑΡΑΣΤΑΤΙΚΟΥ', style: 'invoiceHeader' }],
                    [{ text: 'ΣΕΙΡΑ: ' + (branchInfo.series || ''), style: 'invoiceDetails' }],
                    [{ text: 'ΑΡΙΘΜΟΣ: ' + (invoice.invoiceNumber || ''), style: 'invoiceDetails' }],
                    [{ text: 'ΗΜΕΡΟΜΗΝΙΑ: ' + formatDate(invoice.issueDate || '', invoice.dateFormat || DEFAULT_DATE_FORMAT) + (invoice.issueTime ? ' Ώρα: ' + invoice.issueTime : ''), style: 'invoiceDetails' }],
                    ...(markValue ? [[{ text: 'MARK: ' + markValue, style: 'invoiceDetails' }]] : []),
                    [{ text: 'ΝΟΜΙΣΜΑ: ' + currency, style: 'invoiceDetails' }]
                  ]
                },
                layout: 'noBorders'
              },
              ...(qrCodeDataUrl
                ? [{
                    marginTop: 12,
                    stack: [
                      { text: 'Σάρωσε για επιβεβαίωση', style: 'qrLabel', alignment: 'center', marginBottom: 6 },
                      { image: qrCodeDataUrl, fit: [100, 100], alignment: 'center' }
                    ]
                  }]
                : [])
            ]
          }
        ],
        marginBottom: 15
      },

      // Customer and Invoice Details (AADE-relevant fields)
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: [
                  { text: 'ΣΤΟΙΧΕΙΑ ΣΥΜΒΑΛΛΟΜΕΝΟΥ', style: 'sectionHeader' },
                  { text: 'ΚΩΔ.: ' + (invoice.customer?.vat || ''), style: 'customerDetails' },
                  { text: 'ΕΠΩΝΥΜΙΑ: ' + (invoice.customer?.name || ''), style: 'customerDetails' },
                  { text: 'ΕΠΑΓΓΕΛΜΑ:', style: 'customerDetails' },
                  { text: 'ΔΙΕΥΘΥΝΣΗ: ' + (invoice.customer?.address || ''), style: 'customerDetails' },
                  { text: 'ΠΟΛΗ - Τ.Κ.: ' + (invoice.customer?.city || ''), style: 'customerDetails' },
                  { text: 'ΤΗΛ.:', style: 'customerDetails' },
                  { text: 'Α.Φ.Μ.: ' + (invoice.customer?.vat || ''), style: 'customerDetails' },
                  { text: 'Δ.Ο.Υ.:', style: 'customerDetails' }
                ]
              },
              {
                stack: [
                  { text: 'ΣΤΟΙΧΕΙΑ ΠΑΡΑΣΤΑΤΙΚΟΥ', style: 'sectionHeader' },
                  { text: 'ΤΥΠΟΣ ΠΑΡΑΣΤΑΤΙΚΟΥ: ' + docType, style: 'customerDetails' },
                  { text: 'ΚΑΤ. ΕΣΟΔΟΥ: ' + revenueCategory, style: 'customerDetails' },
                  { text: 'ΤΟΠΟΣ ΠΡΟΟΡΙΣΜΟΥ: ' + (issuer.address || ''), style: 'customerDetails' },
                  { text: 'ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ: ' + paymentLabel, style: 'customerDetails' },
                  ...(markValue ? [{ text: 'MARK: ' + markValue, style: 'customerDetails' }] : []),
                  { text: 'ΝΟΜΙΣΜΑ: ' + currency, style: 'customerDetails' }
                ]
              }
            ]
          ]
        },
        layout: 'noBorders',
        marginBottom: 15
      },

      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['40%', '10%', '12%', '10%', '10%', '18%'],
          body: [
            [
              { text: 'Περιγραφή', style: 'tableHeader' },
              { text: 'Ποσότητα', style: 'tableHeader', alignment: 'center' },
              { text: 'Τιμή (€)', style: 'tableHeader', alignment: 'right' },
              { text: 'Έκπτωση (%)', style: 'tableHeader', alignment: 'center' },
              { text: 'ΦΠΑ (%)', style: 'tableHeader', alignment: 'center' },
              { text: 'Αξία (€)', style: 'tableHeader', alignment: 'right' }
            ],
            ...itemRows
          ]
        },
        layout: 'noBorders',
        marginBottom: 15
      },

      // Totals Section
      {
        columns: [
          {
            width: '50%',
            table: {
              body: [
                  [{ text: 'Παρατηρήσεις', style: 'sectionHeader' }],
                  [{ text: 'IBAN ΤΡΑΠΕΖΑΣ ΠΕΙΡΑΙΩΣ - GR7101715600006021443427251\nΔΙΚΑΙΟΥΧΟΣ - ' + (issuer.name || ''), style: 'remarks' }]
                ],
              },
              // make remarks visually lighter and add spacing so it sits lower on the page
              layout: 'noBorders',
              margin: [0, 12, 0, 0]
          },
          {
            width: '50%',
            table: {
              widths: ['25%', '25%', '25%', '25%'],
              body: [
                [
                  { text: 'ΠΡΟΦ. ΥΠΟΛΟΙΠΟ:', style: 'totalsLabel' },
                  { text: '0,00 €', style: 'totalsValue' },
                  { text: 'ΚΑΘΑΡΗ ΑΞΙΑ', style: 'totalsLabel' },
                  { text: netTotal.toFixed(2) + ' €', style: 'totalsValue' }
                ],
                [
                  { text: 'ΝΕΟ ΥΠΟΛΟΙΠΟ:', style: 'totalsLabel' },
                  { text: '0,00 €', style: 'totalsValue' },
                  { text: 'ΦΠΑ %', style: 'totalsLabel' },
                  { text: 'Αξία ΦΠΑ', style: 'totalsValue' }
                ],
                [
                  { text: 'ΣΥΝ. ΠΟΣΟΤΗΤΑ:', style: 'totalsLabel' },
                  { text: ((invoice.items || []).reduce((sum, item) => sum + (item.qty || 0), 0)).toString(), style: 'totalsValue' },
                  { text: ((invoice.items || []).map(item => item.vatRate).filter((v, i, a) => a.indexOf(v) === i).join(', ')) + '%', style: 'totalsValue' },
                  { text: vatTotal.toFixed(2) + ' €', style: 'totalsValue' }
                ],
                [
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΕΚΠΤΩΣΗ', style: 'totalsLabel' },
                  { text: '0,00 €', style: 'totalsValue' }
                ],
                [
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΕΚΠΤ. ΣΥΝΑΛΛΑΓΩΝ', style: 'totalsLabel' },
                  { text: '0%', style: 'totalsValue' }
                ],
                [
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΚΑΘΑΡΗ ΑΞΙΑ', style: 'totalsLabel' },
                  { text: netTotal.toFixed(2) + ' €', style: 'totalsValue' }
                ],
                ...(surchargeTotal > 0 ? [[
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΤΕΛΟΣ ΔΙΑΜΟΝΗΣ', style: 'totalsLabel' },
                  { text: surchargeTotal.toFixed(2) + ' €', style: 'totalsValue' }
                ]] : []),
                [
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΦΠΑ ΠΟΣΟ', style: 'totalsLabel' },
                  { text: vatTotal.toFixed(2) + ' €', style: 'totalsValue' }
                ],
                [
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΕΠΙΒΑΡΥΝΣΕΙΣ', style: 'totalsLabel' },
                  { text: '0,00 €', style: 'totalsValue' }
                ],
                [
                  { text: '', style: 'totalsLabel' },
                  { text: '', style: 'totalsValue' },
                  { text: 'ΦΠΑ ΕΠΙΒ.', style: 'totalsLabel' },
                  { text: '0,00 €', style: 'totalsValue' }
                ],
                [
                  { text: '', style: 'grandTotalLabel' },
                  { text: '', style: 'grandTotalLabel' },
                  { text: 'ΣΥΝΟΛΙΚΗ ΑΞΙΑ', style: 'grandTotalLabel' },
                  { text: grandTotal.toFixed(2) + ' €', style: 'grandTotalValue' }
                ]
              ]
            },
            layout: 'noBorders'
          }
        ]
      },

      // Footer
      {
        text: 'Εκδότης: ' + (issuer.name || '') + ' | ΑΦΜ: ' + (issuer.vat || '') + ' | Διεύθυνση: ' + (issuer.address || '') + ', ' + (issuer.city || ''),
        style: 'footer',
        marginTop: 20
      }
    ],

    styles: {
      companyName: {
        fontSize: 16,
        bold: true,
        alignment: 'center',
        marginBottom: 5
      },
      companyDetails: {
        fontSize: 10,
        alignment: 'center',
        marginBottom: 2
      },
      invoiceHeader: {
        fontSize: 12,
        bold: true,
        alignment: 'center',
        fillColor: '#f0f0f0'
      },
      invoiceDetails: {
        fontSize: 10,
        alignment: 'center'
      },
      sectionHeader: {
        fontSize: 9,
        bold: true,
        fillColor: '#f0f0f0',
        marginBottom: 5
      },
      customerDetails: {
        fontSize: 9,
        marginBottom: 2
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        fillColor: '#f0f0f0'
      },
      totalsLabel: {
        fontSize: 8,
        bold: true,
        fillColor: '#f0f0f0'
      },
      totalsValue: {
        fontSize: 9,
        alignment: 'right'
      },
      grandTotalLabel: {
        fontSize: 9,
        bold: true,
        fillColor: '#e0e0e0'
      },
      grandTotalValue: {
        fontSize: 11,
        bold: true,
        alignment: 'right',
        fillColor: '#e0e0e0'
      },
      remarks: {
        fontSize: 8,
        marginTop: 5
      },
      qrLabel: {
        fontSize: 8,
        color: '#0ea5e9',
        bold: true,
        letterSpacing: 1
      },
      footer: {
        fontSize: 8,
        alignment: 'center',
        color: 'gray'
      }
    },

    defaultStyle: {
      font: 'Roboto'
    }
  };
}

/**
 * Main function to generate and download PDF invoice
 * @param {Object} invoice - Invoice data object
 * @param {Object} branches - All branch configurations
 * @param {string} logoPath - Path to logo image (optional, defaults to Italian Corner logo)
 */
async function generateInvoiceQRCode(invoice, branchInfo) {
  const issuer = branchInfo.issuer || {};
  const net = Number(invoice.totals?.net || 0).toFixed(2);
  const vat = Number(invoice.totals?.vat || 0).toFixed(2);
  const gross = Number(invoice.totals?.gross || Number(net) + Number(vat) + Number(invoice.surcharge || 0)).toFixed(2);
  const issueTime = invoice.issueTime || invoice.invoiceTime || '';
  const payload = [
  'myData Invoice App',
    `Series: ${branchInfo.series || ''}`,
    `Invoice: ${invoice.invoiceNumber || ''}`,
    `Date: ${formatDate(invoice.issueDate || '', invoice.dateFormat || DEFAULT_DATE_FORMAT)}`,
    ...(issueTime ? [`Time: ${issueTime}`] : []),
    `Branch: ${issuer.name || branchInfo.label || ''}`,
    `Customer: ${invoice.customer?.name || ''}`,
    `VAT: ${invoice.customer?.vat || ''}`,
    `Net: ${net} €`,
    `VAT: ${vat} €`,
    `Total: ${gross} €`
  ].join('\n');

  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      scale: 4,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.warn('QR code generation failed', error);
    return null;
  }
}

function downloadInvoicePDF(invoice, branches, logoPath = `${import.meta.env.BASE_URL || '/'}assets/italiancornerDesktop App Icon.png`) {
  // Check if PDFMake is available
  if (typeof pdfMake === 'undefined') {
    alert('Η βιβλιοθήκη PDFMake δεν είναι διαθέσιμη. Παρακαλώ φορτώστε τη σελίδα ξανά.');
    return;
  }

  const branchInfo = branches[invoice.branchId] || {};

  // Get logo as base64 and then create PDF
  getImageDataURL(logoPath, async function(logoBase64) {
    try {
      const qrCodeDataUrl = await generateInvoiceQRCode(invoice, branchInfo);
      const docDefinition = createPDFDocumentDefinition(invoice, branchInfo, logoBase64, { qrCodeDataUrl });
      pdfMake.createPdf(docDefinition).download(`invoice_${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('Σφάλμα κατά τη δημιουργία του PDF: ' + error.message);
    }
  });
}

/**
 * Alternative function to open PDF in new tab instead of downloading
 * @param {Object} invoice - Invoice data object
 * @param {Object} branches - All branch configurations
 * @param {string} logoPath - Path to logo image (optional)
 */
function openInvoicePDF(invoice, branches, logoPath = `${import.meta.env.BASE_URL || '/'}assets/italiancornerDesktop App Icon.png`) {
  if (typeof pdfMake === 'undefined') {
    alert('Η βιβλιοθήκη PDFMake δεν είναι διαθέσιμη. Παρακαλώ φορτώστε τη σελίδα ξανά.');
    return;
  }

  const branchInfo = branches[invoice.branchId] || {};

  getImageDataURL(logoPath, async function(logoBase64) {
    try {
      const qrCodeDataUrl = await generateInvoiceQRCode(invoice, branchInfo);
      const docDefinition = createPDFDocumentDefinition(invoice, branchInfo, logoBase64, { qrCodeDataUrl });
      pdfMake.createPdf(docDefinition).open();
    } catch (error) {
      console.error('Error creating PDF:', error);
      alert('Σφάλμα κατά τη δημιουργία του PDF: ' + error.message);
    }
  });
}

function generateInvoicePDFBlob(invoice, branches, logoPath = `${import.meta.env.BASE_URL || '/'}assets/italiancornerDesktop App Icon.png`) {
  return new Promise((resolve, reject) => {
    if (typeof pdfMake === 'undefined') {
      reject(new Error('Η βιβλιοθήκη PDFMake δεν είναι διαθέσιμη.'));
      return;
    }

    const branchInfo = branches[invoice.branchId] || {};

    getImageDataURL(logoPath, async function(logoBase64) {
      try {
        const qrCodeDataUrl = await generateInvoiceQRCode(invoice, branchInfo);
        const docDefinition = createPDFDocumentDefinition(invoice, branchInfo, logoBase64, { qrCodeDataUrl });
        pdfMake.createPdf(docDefinition).getBlob((blob) => resolve(blob));
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Export functions for use in other modules
// Export functions for use in other modules
window.PDFGenerator = {
  downloadInvoicePDF,
  openInvoicePDF,
  createPDFDocumentDefinition,
  getImageDataURL,
  generateInvoicePDFBlob
};

/**
 * Create a compact thermal/receipt PDF definition (approx 80mm width)
 * @param {Object} invoice
 * @param {Object} branchInfo
 * @param {string} logoBase64
 */
function createThermalReceiptDefinition(invoice, branchInfo, logoBase64, options = {}) {
  const issuer = branchInfo.issuer || {};
  const receiptCfg = branchInfo.receipt || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const totals = invoice.totals || {};
  const net = Number(totals.net || 0);
  const vat = Number(totals.vat || 0);
  const surcharge = Number(totals.surcharge || 0);
  const gross = Number(totals.gross != null ? totals.gross : net + vat + surcharge);
  const issueDateRaw = invoice.issueDate || invoice.invoiceDate || '';
  const issueDate = formatDate(issueDateRaw, invoice.dateFormat || DEFAULT_DATE_FORMAT);
  const issueTime = invoice.issueTime || invoice.invoiceTime || '';
  const paymentLabel = resolvePaymentLabel(invoice.paymentMethod, receiptCfg);
  const movementPurpose = receiptCfg.movementPurpose || invoice.movementPurpose || '-';
  const dispatchMethod = receiptCfg.dispatchMethod || '-';
  const markValue = invoice.mark || invoice.MARK || totals.mark || '';
  const vatSummary = computeVatSummary(items);

  // (debug logging removed for production-ready output)

  const pageWidth = 226.77; // ~80mm
  const body = [];
  const dashLineText = '------------------------------------------------';
  const dashedLine = (margin = [0, 6, 0, 6]) => ({ text: dashLineText, style: 'rDivider', alignment: 'center', margin });
  const headerStack = [];

  const headerTitle = receiptCfg.headerTitle || issuer.tradeName || issuer.name || branchInfo.label || 'Τιμολόγιο';
  headerStack.push({ text: headerTitle, style: 'rCompanyTitle', alignment: 'center' });

  const headerSubtitle = receiptCfg.headerSubtitle || issuer.activity;
  if (headerSubtitle) {
    headerStack.push({ text: headerSubtitle, style: 'rCompanySubtitle', alignment: 'center' });
  }

  // Optional debug marker to help confirm which thermal template/version is used at preview time
    // No debug header in production; keep headerStack clean

  const contactLines = receiptCfg.contactLines || [
    [issuer.vat ? `ΑΦΜ: ${issuer.vat}` : null, issuer.doy ? `ΔΟΥ: ${issuer.doy}` : null].filter(Boolean).join(' · '),
    [issuer.address, issuer.city && `${issuer.city}`, issuer.zip && `${issuer.zip}`].filter(Boolean).join(', '),
    issuer.phone ? `ΤΗΛ: ${issuer.phone}` : null,
    issuer.fax && issuer.fax !== issuer.phone ? `ΦΑΞ: ${issuer.fax}` : null,
  ].filter(Boolean);

  contactLines.forEach((line) => {
    if (line) headerStack.push({ text: line, style: 'rMeta', alignment: 'center' });
  });

  body.push({ stack: headerStack, margin: [0, 0, 0, 4] });

  const documentTitle = receiptCfg.documentTitle || 'Τιμολόγιο Παροχής Υπηρεσιών';
  body.push({ text: documentTitle, style: 'rSectionTitle', alignment: 'center', margin: [0, 4, 0, 6] });

  body.push({
    columns: [
      { text: `Ημερομηνία: ${issueDate}`, style: 'rSmall' },
      { text: `Ώρα: ${issueTime || '-'}`, style: 'rSmall', alignment: 'right' },
    ],
  });
  body.push({ text: `Σειρά: ${branchInfo.series || '-'} - Αριθμός: ${invoice.invoiceNumber || '-'}`, style: 'rSmall' });
  body.push({ text: `Πελάτης: ${invoice.customer?.name || ''}`, style: 'rSmall', margin: [0, 6, 0, 0] });
  // Always include customer address line (may be empty) so layout matches samples
  body.push({ text: `Διεύθυνση: ${invoice.customer?.address || ''}`, style: 'rSmall' });
  const cityPieces = [invoice.customer?.city, invoice.customer?.zip].filter(Boolean);
  body.push({ text: `Πόλη: ${cityPieces.length ? cityPieces.join(' - ΤΚ: ') : ''}`, style: 'rSmall' });
  body.push({ text: `ΑΦΜ: ${invoice.customer?.vat || ''}${invoice.customer?.vat ? (invoice.customer?.doy ? ' - ΔΟΥ: ' + invoice.customer.doy : '') : ''}`, style: 'rSmall' });

  body.push({ text: `Σκοπός Διακίνησης: ${movementPurpose || '-'}`, style: 'rSmall', margin: [0, 6, 0, 0] });
  body.push({ text: `Τρόπος Αποστολής: ${dispatchMethod || '-'}`, style: 'rSmall' });
  body.push({ text: `Τρόπος Πληρωμής: ${paymentLabel}`, style: 'rSmall' });

  body.push(dashedLine());

  const itemTableBody = [
    [
      { text: 'ΕΙΔΟΣ', style: 'rSmallBold' },
      { text: 'ΠΟΣ.', style: 'rSmallBold', alignment: 'right' },
      { text: 'ΑΞΙΑ', style: 'rSmallBold', alignment: 'right' },
      { text: 'ΦΠΑ %', style: 'rSmallBold', alignment: 'right' },
    ],
  ];

  if (items.length) {
    items.forEach((it) => {
      const qty = Number(it.qty || 0);
      const priceGross = Number(it.price || 0);
      const grossLine = qty * priceGross;
      const rate = Number(it.vatRate || 0);
      const desc = (it.description || it.note || '').toString();
      const descText = desc || (it.period ? `${it.period}` : '');
      itemTableBody.push([
        { text: descText, style: 'rSmall' },
        { text: formatCurrency(qty), style: 'rSmall', alignment: 'right' },
        { text: formatCurrency(grossLine), style: 'rSmall', alignment: 'right' },
        { text: formatVatRateDisplay(rate), style: 'rSmall', alignment: 'right' },
      ]);
    });
  } else {
    itemTableBody.push([
      { text: '—', style: 'rSmall', colSpan: 4, alignment: 'center' },
      {},
      {},
      {},
    ]);
  }

  body.push({
    table: {
      widths: ['*', 'auto', 'auto', 'auto'],
      body: itemTableBody,
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: (rowIndex) => (rowIndex === 0 ? 2 : 3),
      paddingBottom: () => 2,
    },
  });

  body.push(dashedLine());

  const totalsTable = [
    ['ΑΞΙΑ ΠΡΟ ΕΚΠΤΩΣΕΩΝ', formatCurrency(net)],
    ['ΕΚΠΤΩΣΗ', formatCurrency(0)],
    ['ΦΠΑ', formatCurrency(vat)],
    ['ΤΕΛΙΚΗ ΑΞΙΑ', formatCurrency(net + vat)],
    ['ΕΠΙΒΑΡΥΝΣΕΙΣ', formatCurrency(surcharge)],
    ['ΠΛΗΡΩΤΕΟ', formatCurrency(gross)],
  ];

  body.push({
    table: {
      widths: ['*', 'auto'],
      body: totalsTable.map(([label, value]) => [
        { text: label, style: 'rTotalsLabel' },
        { text: value, style: 'rTotalsValue', alignment: 'right' },
      ]),
    },
    layout: 'noBorders',
  });

  body.push(dashedLine([0, 4, 0, 4]));

  if (vatSummary.length) {
    const vatBody = [
      [
        { text: '%', style: 'rSmallBold', alignment: 'left' },
        { text: 'ΚΑΘ. ΑΞΙΑ', style: 'rSmallBold', alignment: 'right' },
        { text: 'ΑΞΙΑ ΦΠΑ', style: 'rSmallBold', alignment: 'right' },
        { text: 'ΜΙΚΤΗ ΑΞΙΑ', style: 'rSmallBold', alignment: 'right' },
      ],
      ...vatSummary.map(({ rate, net: netVal, vat: vatVal, gross: grossVal }) => {
        return [
        { text: formatVatRateDisplay(rate), style: 'rSmall' },
        { text: formatCurrency(netVal), style: 'rSmall', alignment: 'right' },
        { text: formatCurrency(vatVal), style: 'rSmall', alignment: 'right' },
        { text: formatCurrency(grossVal), style: 'rSmall', alignment: 'right' },
      ];
      }),
    ];

    const minVatRows = 3;
    for (let i = vatSummary.length; i < minVatRows; i += 1) {
      vatBody.push([
        { text: '0', style: 'rSmall' },
        { text: formatCurrency(0), style: 'rSmall', alignment: 'right' },
        { text: formatCurrency(0), style: 'rSmall', alignment: 'right' },
        { text: formatCurrency(0), style: 'rSmall', alignment: 'right' },
      ]);
    }

    body.push({
      table: {
        widths: ['auto', 'auto', 'auto', 'auto'],
        body: vatBody,
      },
      layout: 'noBorders',
      margin: [0, 6, 0, 4],
    });
  }

  if (markValue) {
    body.push({ text: `mark: ${markValue}`, style: 'rMeta', alignment: 'left', margin: [0, 4, 0, 4] });
  }

  if (options.qrCodeDataUrl) {
    body.push({ image: options.qrCodeDataUrl, width: 100, alignment: 'center', margin: [0, 6, 0, 6] });
  }

  const thankYou = options.footerText || receiptCfg.thankYouMessage || 'Σας ευχαριστούμε για την προτίμησή σας';
  body.push({ text: thankYou, style: 'rFooter', alignment: 'center', margin: [0, 6, 0, 0] });

  // Calculate dynamic page height based on content
  // For 80mm thermal receipts: estimate ~4.5pt per pixel of content + margins
  // Minimum 600pt (~210mm), maximum 1200pt (~423mm) to avoid extreme scaling
  const estimatedContentHeight = body.length * 25 + 100; // Rough estimate
  const pageHeight = Math.min(Math.max(estimatedContentHeight, 600), 1200);

  const docDefinition = {
    // Generate continuous thermal receipt: 80mm width (226.77pt), height calculated for content
    // (thermal printers use continuous rolls, so one long page avoids pagination breaks)
    pageSize: { width: pageWidth, height: pageHeight },
    pageMargins: [8, 8, 8, 8],
    content: body,
    styles: {
      rCompanyTitle: { fontSize: 11, bold: true },
  rCompanySubtitle: { fontSize: 9, italics: true },
      rSectionTitle: { fontSize: 9, bold: true },
      rMeta: { fontSize: 8, bold: true, color: '#000000' },
      rSmall: { fontSize: 8 },
      rSmallBold: { fontSize: 8, bold: true },
      rTotalsLabel: { fontSize: 8, bold: true },
      rTotalsValue: { fontSize: 8 },
      rFooter: { fontSize: 8 },
      rDivider: { fontSize: 8 },
    },
    defaultStyle: { font: 'Roboto' },
  };

  // (removed debug docDefinition logging)

  return docDefinition;
}

function downloadThermalReceiptPDF(invoice, branches, logoPath = `${import.meta.env.BASE_URL || '/'}assets/italiancornerDesktop App Icon.png`, options = {}) {
  if (typeof pdfMake === 'undefined') {
    alert('Η βιβλιοθήκη PDFMake δεν είναι διαθέσιμη.');
    return;
  }
  const branchInfo = branches[invoice.branchId] || {};
  getImageDataURL(logoPath, async function(logoBase64) {
    try {
  const qrCodeDataUrl = options.qr ? await generateInvoiceQRCode(invoice, branchInfo) : null;
  const defOptions = Object.assign({}, options, { qrCodeDataUrl, footerText: options.footerText });
  const docDefinition = createThermalReceiptDefinition(invoice, branchInfo, logoBase64, defOptions);
      pdfMake.createPdf(docDefinition).download(`receipt_${invoice.invoiceNumber || 'print'}.pdf`);
    } catch (err) {
      console.error('Thermal receipt create error', err);
      alert('Σφάλμα κατά τη δημιουργία του αποδείκτη: ' + (err.message || String(err)));
    }
  });
}

function generateThermalReceiptPDFBlob(invoice, branches, logoPath = `${import.meta.env.BASE_URL || '/'}assets/italiancornerDesktop App Icon.png`, options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof pdfMake === 'undefined') {
      reject(new Error('pdfMake unavailable'));
      return;
    }
    const branchInfo = branches[invoice.branchId] || {};
    getImageDataURL(logoPath, async function(logoBase64) {
      try {
  const qrCodeDataUrl = options.qr ? await generateInvoiceQRCode(invoice, branchInfo) : null;
  const defOptions = Object.assign({}, options, { qrCodeDataUrl, footerText: options.footerText });
  const docDefinition = createThermalReceiptDefinition(invoice, branchInfo, logoBase64, defOptions);
        pdfMake.createPdf(docDefinition).getBlob((blob) => resolve(blob));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// add new functions to exported API
window.PDFGenerator = Object.assign(window.PDFGenerator || {}, {
  createThermalReceiptDefinition,
  downloadThermalReceiptPDF,
  generateThermalReceiptPDFBlob
});
