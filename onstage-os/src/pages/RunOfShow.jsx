import React, { useState, useEffect } from 'react';

export default function RunOfShow() {
  // Live Timer State
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Department Filter & Cues State
  const [filterDept, setFilterDept] = useState('All');
  const [cues, setCues] = useState([
    { id: '1.0', time: '19:00:00', dept: 'Audio', title: 'House Music Fade', action: 'Fade house playlist to 20%', status: 'Completed' },
    { id: '1.1', time: '19:02:00', dept: 'Video', title: 'Intro Roll', action: 'Play 4K intro teaser on main LED wall', status: 'GO' },
    { id: '1.2', time: '19:02:30', dept: 'Lighting', title: 'Stage Blackout & Spot', action: 'Kill house lights, Stage Left Followspot ON', status: 'Standby' },
    { id: '1.3', time: '19:03:00', dept: 'Stage', title: 'Artist Entrance', action: 'Escort lead artist to Stage Left mic', status: 'Pending' },
    { id: '2.0', time: '19:05:00', dept: 'SFX', title: 'Opening Pyro', action: 'Fire cold spark jets on chorus drop', status: 'Pending' },
  ]);

  // Show Timer Hook
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSecs) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const updateCueStatus = (id, newStatus) => {
    setCues(cues.map(cue => cue.id === id ? { ...cue, status: newStatus } : cue));
  };

  const filteredCues = filterDept === 'All' 
    ? cues 
    : cues.filter(c => c.dept === filterDept);

  return (
    <div className="p-6 text-white min-h-screen bg-slate-950">
      {/* Live Show Clock Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Live Show Clock</span>
          <h1 className="text-5xl font-mono font-bold mt-1 tracking-tight text-emerald-300">{formatTime(seconds)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-3 rounded-lg font-bold tracking-wider transition ${isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
          >
            {isRunning ? 'PAUSE TIMER' : 'START SHOW'}
          </button>
          <button 
            onClick={() => { setIsRunning(false); setSeconds(0); }}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Filter and Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold">Interactive Run of Show</h2>
          <p className="text-xs text-slate-400">Real-time cues for audio, lighting, video, and stage crew.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['All', 'Audio', 'Lighting', 'Video', 'Stage', 'SFX'].map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterDept === dept ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Cue Sheet Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-4">Cue #</th>
              <th className="py-3 px-4">Target Time</th>
              <th className="py-3 px-4">Dept</th>
              <th className="py-3 px-4">Action / Notes</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Trigger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {filteredCues.map((cue) => (
              <tr key={cue.id} className={cue.status === 'GO' ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500' : ''}>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{cue.id}</td>
                <td className="py-3.5 px-4 font-mono text-slate-400">{cue.time}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-indigo-300 border border-indigo-900/60">
                    {cue.dept}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-200">{cue.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{cue.action}</div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    cue.status === 'Completed' ? 'bg-slate-800 text-slate-500' :
                    cue.status === 'GO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' :
                    cue.status === 'Standby' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {cue.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => updateCueStatus(cue.id, 'Standby')} className="px-2.5 py-1 text-xs bg-amber-950 hover:bg-amber-900 border border-amber-800/80 text-amber-300 rounded font-medium">STANDBY</button>
                    <button onClick={() => updateCueStatus(cue.id, 'GO')} className="px-2.5 py-1 text-xs bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 rounded font-bold">GO</button>
                    <button onClick={() => updateCueStatus(cue.id, 'Completed')} className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 rounded font-medium">DONE</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}