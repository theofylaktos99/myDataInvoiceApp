const papadomichelakis = {
  id: 'papadomichelakis',
  label: 'Τεντοπέργκολες Παπαδομιχελάκης',
  series: 'ΤΔΑ',
  revenueMapping: {
    documentType: '1.1',
    revenueCategory: 'Πωλήσεις αγαθών και υπηρεσιών',
    defaultVat: 24,
    allowedVatRates: [24, 13],
    vatMap: { 13: 'VAT_13', 24: 'VAT_24', 0: 'VAT_0' },
    e3: { code: 'E3_GENERIC' },
  },
  issuer: {
    name: 'Παπαδομιχελάκης Εμμανουήλ Κ.',
    tradeName: 'Τεντοπέργκολες Παπαδομιχελάκης',
    activity: 'Τέντες - Πέργκολες - Σκίαστρα',
    vat: '801234567', // TODO: Replace with actual VAT number before production
    doy: 'ΡΕΘΥΜΝΟΥ',
    address: 'Γιαμπουδάκη 43',
    city: 'Ρέθυμνο',
    zip: '74100',
    phone: '2831 025964',
    fax: '',
  },
  receipt: {
    headerTitle: 'Τεντοπέργκολες Παπαδομιχελάκης',
    headerSubtitle: 'Τέντες - Πέργκολες - Σκίαστρα',
    documentTitle: 'Τιμολόγιο - Δελτίο Αποστολής',
    movementPurpose: 'Πώληση',
    dispatchMethod: '-',
    thankYouMessage: 'Ευχαριστούμε για την εμπιστοσύνη σας',
    paymentLabels: {
      cash: 'Μετρητά',
      card: 'Κάρτα',
      bank: 'Κατάθεση',
      credit: 'Επί Πιστώσει',
    },
  },
};

export default papadomichelakis;
