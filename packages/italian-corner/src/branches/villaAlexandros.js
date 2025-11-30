const villa1 = {
  id: 'villa1',
  label: 'Villa Alexandros',
  series: 'ΤΥΠ_01',
  revenueMapping: {
  documentType: '2.1',
  revenueCategory: 'Υπηρεσίες ενοικίασης επιπλωμένων διαμερισμάτων',
    defaultVat: 13,
    allowedVatRates: [13, 24],
    vatMap: { 13: 'VAT_13', 24: 'VAT_24', 0: 'VAT_0' },
    e3: { code: 'E3_ACCOMMODATION' },
    e3Surcharge: { code: 'E3_SURCHARGE' },
  // Effective ΤΑΚΚ rule: 15€/night for 2025-2026 (subject to official confirmation)
    surchargeRule: { mode: 'seasonalPerNight', summerRate: 15, winterRate: 15, effectiveFrom: '2025-01-01', effectiveTo: '2026-12-31' },
  },
  issuer: {
    name: 'ΣΤΟΥΡΝΑΡΑΣ Β ΚΑΙ ΣΙΑ ΟΕ',
    tradeName: 'ΣΤΟΥΡΝΑΡΑΣ Β ΚΑΙ ΣΙΑ ΟΕ',
    activity: 'Υπηρεσίες ενοικίασης επιπλωμένων διαμερισμάτων',
    vat: '997821267',
    doy: 'ΡΕΘΥΜΝΟΥ',
    address: 'Eparchiaki Odos Viran Episkopis-Monis Arkadiou 35',
    city: 'Σκουλούφια',
    zip: '74052',
    phone: '',
  },
};

export default villa1;
