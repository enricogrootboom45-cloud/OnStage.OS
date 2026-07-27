import React, { useState } from 'react';

export default function Financials() {
  const [activeTab, setActiveTab] = useState('settlement');

  // Show Settlement State
  const [settlement, setSettlement] = useState({
    showTitle: 'Electric Dreams Tour - Night 2',
    date: '2026-08-15',
    artist: 'Synthetica',
    guarantee: 15000,
    doorSplitPercentage: 80,
    ticketPrice: 45,
    ticketsSold: 850,
    capacity: 1000,
    expenses: [
      { id: 1, category: 'Production', description: 'Audio & Lighting Rig', cost: 3500 },
      { id: 2, category: 'Staffing', description: 'Security & Door Crew', cost: 1800 },
      { id: 3, category: 'Hospitality', description: 'Artist Rider & Catering', cost: 850 },
      { id: 4, category: 'Marketing', description: 'Local Ads & Promo', cost: 600 },
    ],
  });

  // Concessions & Merch Inventory State
  const [inventory, setInventory] = useState([
    { id: 1, type: 'Merch', name: 'Tour T-Shirt (Black)', price: 35, stock: 42, initial: 120, sold: 78 },
    { id: 2, type: 'Merch', name: 'Limited Edition Hoodie', price: 75, stock: 8, initial: 50, sold: 42 },
    { id: 3, type: 'Merch', name: 'Vinyl Album', price: 30, stock: 25, initial: 60, sold: 35 },
    { id: 4, type: 'Concession', name: 'Craft IPA', price: 9, stock: 180, initial: 400, sold: 220 },
    { id: 5, type: 'Concession', name: 'Signature Cocktail', price: 14, stock: 65, initial: 200, sold: 135 },
    { id: 6, type: 'Concession', name: 'Artisan Pizza Slice', price: 8, stock: 12, initial: 100, sold: 88 },
  ]);

  // Calculated Financial Metrics
  const grossTicketRevenue = settlement.ticketsSold * settlement.ticketPrice;
  const totalExpenses = settlement.expenses.reduce((acc, exp) => acc + exp.cost, 0);
  const netDoorRevenue = grossTicketRevenue - totalExpenses;
  const doorSplitPayout = (netDoorRevenue * settlement.doorSplitPercentage) / 100;
  
  // Payout is whichever is higher: Guarantee vs Door Split
  const finalArtistPayout = Math.max(settlement.guarantee, doorSplitPayout);
  const venueNetProfit = netDoorRevenue - finalArtistPayout;

  const totalMerchRevenue = inventory
    .filter((i) => i.type === 'Merch')
    .reduce((acc, item) => acc + item.sold * item.price, 0);

  const totalConcessionRevenue = inventory
    .filter((i) => i.type === 'Concession')
    .reduce((acc, item) => acc + item.sold * item.price, 0);

  // Instant POS Sale simulator
  const handleQuickSale = (id) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id && item.stock > 0
          ? { ...item, stock: item.stock - 1, sold: item.sold + 1 }
          : item
      )
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>📊</span> Show Settlement & Real-time Sales
          </h1>
          <p className="text-sm text-slate-400">
            {settlement.showTitle} • {settlement.artist}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('settlement')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'settlement'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Show Settlement
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Concessions & Merch POS
          </button>
        </div>
      </div>

      {activeTab === 'settlement' ? (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Gross Ticket Sales</span>
              <p className="text-2xl font-black text-emerald-400">${grossTicketRevenue.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">{settlement.ticketsSold} / {settlement.capacity} Tickets Sold</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Production Expenses</span>
              <p className="text-2xl font-black text-rose-400">${totalExpenses.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">{settlement.expenses.length} Line Items</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Artist Final Payout</span>
              <p className="text-2xl font-black text-indigo-400">${finalArtistPayout.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">
                {doorSplitPayout > settlement.guarantee ? '80% Door Split Applied' : 'Base Guarantee Applied'}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs font-mono text-slate-400 uppercase">Venue Net Profit</span>
              <p className="text-2xl font-black text-amber-400">${venueNetProfit.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">Post Artist Payout</span>
            </div>
          </div>

          {/* Detailed Settlement Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Show Ledger / Deal Terms */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Deal Terms & Revenue</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Guaranteed Artist Fee:</span>
                  <span className="font-mono text-white">${settlement.guarantee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Back-end Door Split:</span>
                  <span className="font-mono text-white">{settlement.doorSplitPercentage}% Net Door</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Ticket Price:</span>
                  <span className="font-mono text-white">${settlement.ticketPrice}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Net Door Revenue:</span>
                  <span className="font-mono text-emerald-400">${netDoorRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Show Deductions</h3>
              <ul className="divide-y divide-slate-800/60 text-sm">
                {settlement.expenses.map((exp) => (
                  <li key={exp.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="text-white font-medium block">{exp.description}</span>
                      <span className="text-[11px] text-slate-500">{exp.category}</span>
                    </div>
                    <span className="font-mono text-rose-400 font-semibold">-${exp.cost}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Totals Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Live Merch Sales</span>
                <p className="text-2xl font-black text-indigo-400">${totalMerchRevenue.toLocaleString()}</p>
              </div>
              <span className="text-3xl">👕</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Bar & Concessions</span>
                <p className="text-2xl font-black text-emerald-400">${totalConcessionRevenue.toLocaleString()}</p>
              </div>
              <span className="text-3xl">🍺</span>
            </div>
          </div>

          {/* Inventory & POS Counter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-4">Live Inventory Register</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition ${
                    item.stock <= 15
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono uppercase text-slate-500">{item.type}</span>
                      <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                    </div>
                    <span className="text-sm font-black text-emerald-400">${item.price}</span>
                  </div>

                  <div className="my-4 flex justify-between items-center text-xs">
                    <span className="text-slate-400">
                      Stock: <strong className={item.stock <= 15 ? 'text-rose-400' : 'text-slate-200'}>{item.stock}</strong> / {item.initial}
                    </span>
                    <span className="text-slate-400">
                      Sold: <strong className="text-indigo-400">{item.sold}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => handleQuickSale(item.id)}
                    disabled={item.stock === 0}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition ${
                      item.stock > 0
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {item.stock > 0 ? '+ Record Sale' : 'Sold Out'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}