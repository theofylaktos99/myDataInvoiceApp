const kandavlos = {
  id: 'kandavlos',
  label: 'ΚΑΝΔΑΥΛΟΣ',
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
    name: 'ΚΑΝΔΑΥΛΟΣ - ΣΤΟΥΡΝΑΡΑΣ Β ΚΑΙ ΣΙΑ ΟΕ',
    tradeName: 'ΚΑΝΔΑΥΛΟΣ - ΣΤΟΥΡΝΑΡΑΣ Β ΚΑΙ ΣΙΑ ΟΕ',
    activity: 'Εστιατόριο',
    vat: '079648871',
    doy: 'ΡΕΘΥΜΝΟΥ',
    address: 'Μάρκου Πορταλίου 29',
    city: 'Ρέθυμνο',
    zip: '74133',
    phone: '28310 50140',
    fax: '28310 50140',
  },
  receipt: {
    headerTitle: 'ΚΑΝΔΑΥΛΟΣ',
    headerSubtitle: 'Εστιατόριο',
    documentTitle: 'Τιμολόγιο - Δελτίο Αποστολής',
    movementPurpose: 'Πώληση',
    dispatchMethod: '-',
    thankYouMessage: 'Ευχαριστούμε για την προτίμησή σας',
    paymentLabels: {
      cash: 'Μετρητά',
      card: 'Κάρτα',
      bank: 'Κατάθεση',
      credit: 'Επί Πιστώσει',
    },
  },
};

export default kandavlos;
