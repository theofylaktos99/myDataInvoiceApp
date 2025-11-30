const central = {
  id: 'central',
  label: 'Italian Corner',
  series: 'ΤΔΑ',
  revenueMapping: {
    documentType: '1.1',
  revenueCategory: 'Πωλήσεις αγαθών και υπηρεσιών',
    defaultVat: 13,
    allowedVatRates: [13, 24],
    vatMap: { 13: 'VAT_13', 24: 'VAT_24', 0: 'VAT_0' },
    e3: { code: 'E3_RESTAURANT' },
    e3Surcharge: { code: 'E3_SURCHARGE' },
  },
  issuer: {
    name: 'ΣΤΟΥΡΝΑΡΑΣ Β ΚΑΙ ΣΙΑ ΟΕ',
    tradeName: 'ΣΤΟΥΡΝΑΡΑΣ Β ΚΑΙ ΣΙΑ ΟΕ',
    activity: 'Εστιατόριο - Πιτσαρία',
  vat: '997821267',
    doy: 'ΡΕΘΥΜΝΟΥ',
    address: 'Μ. Πορτάλιου και Σαουνατσίου 25',
    city: 'Ρέθυμνο',
    zip: '74100',
    phone: '28310 20010',
    fax: '28310 20010',
  },
  receipt: {
    headerTitle: 'Italian Corner',
    headerSubtitle: 'Εστιατόριο - Πιτσαρία',
    documentTitle: 'Τιμολόγιο - Δελτίο Αποστολής',
    movementPurpose: 'Πώληση',
    dispatchMethod: '-',
    thankYouMessage: 'Σας ευχαριστούμε για την προτίμησή σας',
    paymentLabels: {
      cash: 'Μετρητά',
      card: 'Κάρτα',
      bank: 'Κατάθεση',
      credit: 'Επί Πιστώσει',
    },
  },
};

export default central;
