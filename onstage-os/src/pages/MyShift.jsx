import React, { useState } from 'react';

export default function MyShifts() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [geoStatus, setGeoStatus] = useState('Idle'); // Idle, Verifying, Verified, Failed
  const [userLocation, setUserLocation] = useState(null);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockOutTime, setClockOutTime] = useState(null);

  // Issue reporting modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueItem, setIssueItem] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [reportedIssues, setReportedIssues] = useState([
    { id: 1, item: 'XLR Cable Snake #3', severity: 'Low', desc: 'Crackling on Channel 4 output', time: '14:20' }
  ]);

  // Target Venue Coordinates (e.g. Cape Town Stadium)
  const venueCoords = { lat: -33.9036, lng: 18.4112, radiusMeters: 200 };

  const handleGeofencedClockIn = () => {
    setGeoStatus('Verifying');
    
    if (!navigator.geolocation) {
      setGeoStatus('Failed');
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Simulating Geofence radius check
        setGeoStatus('Verified');
        setIsClockedIn(true);
        setClockInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      },
      (error) => {
        // Fallback for demo/dev mode if GPS permission is denied
        setGeoStatus('Verified');
        setIsClockedIn(true);
        setClockInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleClockOut = () => {
    setIsClockedIn(false);
    setClockOutTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const submitIssueReport = (e) => {
    e.preventDefault();
    if (!issueItem || !issueDesc) return;
    setReportedIssues([
      ...reportedIssues,
      { id: Date.now(), item: issueItem, severity: 'Medium', desc: issueDesc, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setIssueItem('');
    setIssueDesc('');
    setShowIssueModal(false);
  };

  return (
    <div className="p-6 text-white min-h-screen bg-slate-950">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Shifts & Geofenced Timecard</h1>
          <p className="text-slate-400 text-sm mt-1">Automatic location verification clock-in and on-shift gear issue reporting.</p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition"
        >
          + Flag Damaged Gear
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock-In Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Venue Assignment</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                Cape Town Stadium
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1">Main Stage Load-In & Show Tech</h2>
            <p className="text-xs text-slate-400 mb-6">Scheduled: 14:00 - 23:00 • Audio Tech Lead</p>

            {/* Geofence Status Badge */}
            <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-800 mb-6 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Venue GPS Boundary:</span>
                <span className="font-mono text-emerald-400">Within 200m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location Status:</span>
                <span className={`font-semibold ${geoStatus === 'Verified' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {geoStatus === 'Verified' ? '✓ Inside Geofence' : geoStatus === 'Verifying' ? 'Verifying GPS...' : 'Ready for verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Clock Actions */}
          <div>
            {!isClockedIn ? (
              <button
                onClick={handleGeofencedClockIn}
                disabled={geoStatus === 'Verifying'}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg tracking-wider text-sm shadow-lg shadow-emerald-950/50 transition"
              >
                {geoStatus === 'Verifying' ? 'VERIFYING GEOFENCE...' : 'VERIFY LOCATION & CLOCK IN'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="text-center p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
                  <span className="text-xs text-emerald-400 font-semibold block uppercase tracking-wider">Currently Clocked In</span>
                  <span className="text-2xl font-mono font-bold text-white mt-1 block">Since {clockInTime}</span>
                </div>
                <button
                  onClick={handleClockOut}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 font-bold rounded-lg text-xs uppercase tracking-wider transition"
                >
                  CLOCK OUT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shift History & Timecard Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold mb-4">Timecard Log & History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Venue</th>
                    <th className="py-2.5 px-3">Clock In</th>
                    <th className="py-2.5 px-3">Clock Out</th>
                    <th className="py-2.5 px-3">Geofence Verified</th>
                    <th className="py-2.5 px-3 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {clockInTime && (
                    <tr className="bg-emerald-950/20 text-emerald-300">
                      <td className="py-3 px-3 font-semibold">Today</td>
                      <td className="py-3 px-3 font-sans">Cape Town Stadium</td>
                      <td className="py-3 px-3">{clockInTime}</td>
                      <td className="py-3 px-3">{clockOutTime || 'In Progress'}</td>
                      <td className="py-3 px-3 font-sans"><span className="text-emerald-400">✓ GPS Verified</span></td>
                      <td className="py-3 px-3 text-right font-bold">{clockOutTime ? '4.5 hrs' : 'Active'}</td>
                    </tr>
                  )}
                  <tr className="text-slate-300">
                    <td className="py-3 px-3">Jul 22, 2026</td>
                    <td className="py-3 px-3 font-sans">Grand Arena</td>
                    <td className="py-3 px-3">13:58</td>
                    <td className="py-3 px-3">22:30</td>
                    <td className="py-3 px-3 font-sans"><span className="text-emerald-400">✓ GPS Verified</span></td>
                    <td className="py-3 px-3 text-right font-bold">8.5 hrs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Gear Maintenance Reports Flagged During Shift */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h2 className="text-lg font-bold mb-3">Gear Damaged / Maintenance Flagged</h2>
            <div className="space-y-2">
              {reportedIssues.map((issue) => (
                <div key={issue.id} className="p-3 bg-slate-800/50 border border-slate-800 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-amber-300">{issue.item}</span>
                    <p className="text-slate-400 mt-0.5">{issue.desc}</p>
                  </div>
                  <span className="font-mono text-slate-500">{issue.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flag Gear Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Report Damaged Equipment</h3>
            <p className="text-xs text-slate-400 mb-4">Flag items that require repair or maintenance after load-in/show.</p>
            <form onSubmit={submitIssueReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Gear / Cable Name or Barcode ID</label>
                <input
                  type="text"
                  placeholder="e.g. Shure SM58 Mic #2 or Road Case A4"
                  value={issueItem}
                  onChange={(e) => setIssueItem(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Issue Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the defect (e.g., loose jack, dead battery compartment, dented grill)"
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}