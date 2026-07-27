import React, { useState } from 'react';

export default function EquipmentScanner() {
  const [scanInput, setScanInput] = useState('');
  const [scanMode, setScanMode] = useState('LoadIn'); // 'LoadIn' | 'LoadOut'
  const [lastScannedItem, setLastScannedItem] = useState(null);

  // Simulated Equipment Inventory Database
  const [scannedLogs, setScannedLogs] = useState([
    { id: 'EQ-8092', name: 'Behringer X32 Digital Mixer', category: 'Audio', status: 'Loaded In', time: '14:15' },
    { id: 'EQ-4011', name: 'Chauvet DJ Intimidator Spot 375', category: 'Lighting', status: 'Loaded In', time: '14:18' },
  ]);

  const handleSimulatedScan = (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const newItem = {
      id: scanInput.toUpperCase(),
      name: `Gear Item (${scanInput.toUpperCase()})`,
      category: 'Stage Equipment',
      status: scanMode === 'LoadIn' ? 'Loaded In' : 'Loaded Out (Returned)',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLastScannedItem(newItem);
    setScannedLogs([newItem, ...scannedLogs]);
    setScanInput('');
  };

  return (
    <div className="p-6 text-white min-h-screen bg-slate-950">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment QR & Barcode Scanner</h1>
          <p className="text-slate-400 text-sm mt-1">Track gear, road cases, and cables during load-in and load-out to eliminate lost inventory.</p>
        </div>
        
        {/* Toggle Load-In vs Load-Out */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setScanMode('LoadIn')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${scanMode === 'LoadIn' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            LOAD-IN (CHECK-OUT TO VENUE)
          </button>
          <button
            onClick={() => setScanMode('LoadOut')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${scanMode === 'LoadOut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            LOAD-OUT (RETURN TO WAREHOUSE)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera / Barcode Scanner Interface */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="w-full aspect-square max-w-xs bg-slate-950 border-2 border-dashed border-indigo-500/60 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden mb-4">
            <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-pulse top-1/2"></div>
            <div className="text-4xl mb-2">📷</div>
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Point Camera at Barcode / QR</p>
            <p className="text-[10px] text-slate-500 mt-1">Scanning auto-detects asset IDs</p>
          </div>

          {/* Manual Input / USB Scanner Input */}
          <form onSubmit={handleSimulatedScan} className="w-full space-y-2">
            <input
              type="text"
              placeholder="Or type/scan barcode (e.g. EQ-104)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold uppercase tracking-wider transition"
            >
              Scan Asset
            </button>
          </form>
        </div>

        {/* Real-time Scan Feed & Asset Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last Scanned Quick Confirmation Card */}
          {lastScannedItem && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">Just Scanned</span>
                <span className="font-mono text-lg font-bold text-white">{lastScannedItem.id}</span>
                <span className="text-xs text-emerald-200 ml-3">{lastScannedItem.name}</span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-md uppercase border border-emerald-500/30">
                {lastScannedItem.status}
              </span>
            </div>
          )}

          {/* Live Scan Log Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold mb-4">Active Session Scan History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">Asset ID</th>
                    <th className="py-2.5 px-3">Equipment Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Scan Action</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {scannedLogs.map((log, index) => (
                    <tr key={index} className="text-slate-300">
                      <td className="py-3 px-3 font-bold text-indigo-400">{log.id}</td>
                      <td className="py-3 px-3 font-sans font-medium">{log.name}</td>
                      <td className="py-3 px-3 font-sans text-slate-400">{log.category}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.status.includes('Loaded In') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}