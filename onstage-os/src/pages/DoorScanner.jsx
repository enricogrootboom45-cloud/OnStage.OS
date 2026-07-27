import React, { useState, useEffect } from 'react';

export default function DoorScanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ticketInput, setTicketInput] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [vipAlert, setVipAlert] = useState(null);

  // Simulated Master Ticket Database
  const mockTickets = {
    'TICK-VIP-1001': { name: 'Sarah Jenkins', type: 'VIP Backstage Access', status: 'Valid', isVip: true, note: 'Artist Guest of Honor' },
    'TICK-GA-2042': { name: 'Michael Chen', type: 'General Admission', status: 'Valid', isVip: false },
    'TICK-GA-3099': { name: 'David Smith', type: 'General Admission', status: 'Already Scanned', isVip: false },
  };

  // Monitor network status for offline capability
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineScans();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  const syncOfflineScans = () => {
    if (offlineQueue.length > 0) {
      console.log('Syncing offline scans to server...', offlineQueue);
      setOfflineQueue([]);
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    const code = ticketInput.trim().toUpperCase();
    if (!code) return;

    const ticket = mockTickets[code] || { name: 'Unknown Guest', type: 'General Admission', status: 'Invalid Ticket', isVip: false };
    const scanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const scanResult = {
      code,
      ...ticket,
      time: scanTime,
      synced: isOnline,
    };

    // Trigger VIP Alert if applicable
    if (ticket.isVip && ticket.status === 'Valid') {
      triggerVipNotification(ticket);
    }

    // Queue locally if offline
    if (!isOnline) {
      setOfflineQueue((prev) => [...prev, scanResult]);
    }

    setRecentScans([scanResult, ...recentScans]);
    setTicketInput('');
  };

  const triggerVipNotification = (ticket) => {
    setVipAlert({
      name: ticket.name,
      type: ticket.type,
      note: ticket.note || 'Special guest entry verified.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Auto-dismiss alert after 6 seconds
    setTimeout(() => {
      setVipAlert(null);
    }, 6000);
  };

  return (
    <div className="p-6 text-white min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Top Banner: Online / Offline Sync Bar */}
      <div className={`mb-6 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg transition ${
        isOnline ? 'bg-slate-900 border-slate-800' : 'bg-amber-950/60 border-amber-800 text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
          <div>
            <span className="font-bold text-sm">
              {isOnline ? 'Door Scanner Online' : 'OFFLINE MODE ACTIVE (Poor Connectivity)'}
            </span>
            <p className="text-xs text-slate-400">
              {isOnline 
                ? 'Direct real-time database validation.' 
                : 'Scans are cached locally in device memory and will auto-sync when connection restores.'}
            </p>
          </div>
        </div>

        {/* Offline Queue Badge */}
        {offlineQueue.length > 0 && (
          <div className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono font-bold">
            {offlineQueue.length} Scans Cached Locally
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Scan Station */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center justify-between">
          <div className="w-full text-center">
            <h2 className="text-xl font-bold mb-1">Gate 1 Entry Scanner</h2>
            <p className="text-xs text-slate-400 mb-6">Scan QR Code, Barcode, or enter Ticket ID manually.</p>

            {/* Simulated Camera Viewfinder */}
            <div className="w-full aspect-square max-w-xs mx-auto bg-slate-950 border-2 border-indigo-500/60 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden mb-6">
              <div className="absolute inset-x-0 h-0.5 bg-indigo-400 animate-pulse top-1/2" />
              <div className="text-5xl mb-3">🎟️</div>
              <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Ready to Scan</p>
            </div>
          </div>

          <form onSubmit={handleScan} className="w-full space-y-2">
            <input
              type="text"
              placeholder="Enter Ticket ID (e.g. TICK-VIP-1001)..."
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              Validate Ticket Entry
            </button>
          </form>
        </div>

        {/* Live Entry Stream */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold mb-4">Gate Scan Activity Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Holder Name</th>
                    <th className="py-2.5 px-3">Tier / Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentScans.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500 font-sans">
                        No tickets scanned yet in this session.
                      </td>
                    </tr>
                  ) : (
                    recentScans.map((scan, idx) => (
                      <tr key={idx} className={scan.isVip ? 'bg-amber-950/20' : 'text-slate-300'}>
                        <td className="py-3 px-3 font-bold text-indigo-400">{scan.code}</td>
                        <td className="py-3 px-3 font-sans font-medium text-white">{scan.name}</td>
                        <td className="py-3 px-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            scan.isVip ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {scan.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            scan.status === 'Valid' ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800' : 'text-red-400 bg-red-950/60 border border-red-800'
                          }`}>
                            {scan.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400">{scan.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Pop-up Alert for VIP Entries */}
      {vipAlert && (
        <div className="fixed bottom-6 right-6 max-w-md bg-amber-950 border-2 border-amber-500 rounded-xl p-5 shadow-2xl z-50 animate-bounce">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block">VIP ARRIVAL ALERT</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{vipAlert.name}</h3>
              </div>
            </div>
            <button onClick={() => setVipAlert(null)} className="text-amber-400 hover:text-white font-bold">✕</button>
          </div>
          <p className="text-xs text-amber-200/80 mt-2 font-mono bg-amber-900/50 p-2 rounded border border-amber-700/50">
            {vipAlert.note}
          </p>
          <div className="mt-3 flex justify-between items-center text-[10px] text-amber-400/80 font-mono">
            <span>SMS Alert Sent to Venue Manager</span>
            <span>{vipAlert.time}</span>
          </div>
        </div>
      )}
    </div>
  );
}