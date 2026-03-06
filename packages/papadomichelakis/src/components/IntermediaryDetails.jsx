import React from 'react';

function IntermediaryDetails({
  intermediaryChannel,
  reservationNumber,
  guestName,
  checkInDate,
  checkOutDate,
  ama,
  onIntermediaryChannelChange,
  onReservationNumberChange,
  onGuestNameChange,
  onCheckInDateChange,
  onCheckOutDateChange,
  onAmaChange,
}) {
  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Στοιχεία Διαμεσολαβητή</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Κανάλι Διαμεσολάβησης</label>
          <select
            value={intermediaryChannel}
            onChange={(e) => onIntermediaryChannelChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Επιλέξτε...</option>
            <option value="Airbnb">Airbnb</option>
            <option value="Booking">Booking.com</option>
            <option value="Vrbo">Vrbo</option>
            <option value="HomeAway">HomeAway</option>
            <option value="Direct">Άμεση Κράτηση</option>
            <option value="Other">Άλλο</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Αριθμός Κράτησης</label>
          <input
            type="text"
            value={reservationNumber}
            onChange={(e) => onReservationNumberChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="π.χ. ABC123456"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Όνομα Επισκέπτη</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Όνομα και Επώνυμο"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Ημερομηνία Άφιξης</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => onCheckInDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Ημερομηνία Αναχώρησης</label>
          <input
            type="date"
            value={checkOutDate}
            onChange={(e) => onCheckOutDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">AMA (Αριθμός Μητρώου Αρχείου)</label>
          <input
            type="text"
            value={ama}
            onChange={(e) => onAmaChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="π.χ. 123456789"
          />
        </div>
      </div>
    </div>
  );
}

export default IntermediaryDetails;