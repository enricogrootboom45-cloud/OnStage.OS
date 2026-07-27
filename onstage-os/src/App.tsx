import React, { useState } from 'react';

// Import all 6 module pages
import RunOfShow from './pages/RunOfShow';
import ArtistManager from './pages/ArtistManager';
import MyShifts from './pages/MyShifts';
import EquipmentScanner from './pages/EquipmentScanner';
import DoorScanner from './pages/DoorScanner';
import Financials from './pages/Financials';

export default function App() {
  const [activeTab, setActiveTab] = useState('run-of-show');

  const navigation = [
    { id: 'run-of-show', label: '⏱️ Run of Show', component: <RunOfShow /> },
    { id: 'artists', label: '🎤 Artist & Riders', component: <ArtistManager /> },
    { id: 'shifts', label: '📍 My Shifts & Timecard', component: <MyShifts /> },
    { id: 'equipment', label: '📦 Gear Scanner', component: <EquipmentScanner /> },
    { id: 'door', label: '🎟️ Door Scanner', component: <DoorScanner /> },
    { id: 'financials', label: '📊 Financials & POS', component: <Financials /> },
  ];

  const currentModule = navigation.find((n) => n.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Global Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-lg tracking-tighter">
            OS
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">OnStage OS</h1>
            <span className="text-[10px] text-slate-400 font-mono">Live Show Operations Suite</span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Active Page View */}
      <main className="flex-1">
        {currentModule ? currentModule.component : <RunOfShow />}
      </main>
    </div>
  );
}