import React, { useState } from 'react';

export default function ArtistManager() {
  const [selectedArtist, setSelectedArtist] = useState(0);

  const artists = [
    {
      id: 1,
      name: 'Electric Neon Dreams',
      genre: 'Synthwave / Electronic',
      setStart: '21:30',
      setEnd: '23:00',
      soundcheck: '16:00 - 17:00',
      contractSigned: true,
      depositPaid: true,
      rider: {
        inputs: ['Ch 1: Lead Vocals (Wireless Shure KSM9)', 'Ch 2-3: Main Synth L/R (DI Box)', 'Ch 4: Sample Drum Machine'],
        backline: ['2x Active Stage Monitors', '1x Keyboard Stand (Double X heavy duty)'],
        hospitality: ['12x Bottled Spring Water (Room temp)', 'Assorted Fruit & Protein Snacks', '2x Clean Black Hand Towels'],
      }
    },
    {
      id: 2,
      name: 'The Midnight Echoes',
      genre: 'Indie Rock',
      setStart: '20:00',
      setEnd: '21:00',
      soundcheck: '15:00 - 16:00',
      contractSigned: true,
      depositPaid: false,
      rider: {
        inputs: ['Ch 1: Lead Vocals', 'Ch 2: Guitar Amp (Sennheiser e609)', 'Ch 3: Bass DI', 'Ch 4-8: Drum Kit Mics'],
        backline: ['1x Ampeg SVT Bass Cab + Head', '1x Fender Twin Reverb Amp'],
        hospitality: ['6x Local Craft Beers', '1x Sparkling Water', 'Hot Meals for 4 Band/Crew Members'],
      }
    }
  ];

  const current = artists[selectedArtist];

  return (
    <div className="p-6 text-white min-h-screen bg-slate-950">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Artist & Rider Management</h1>
        <p className="text-slate-400 text-sm mt-1">Manage performance contracts, tech inputs, backline needs, and green room hospitality.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roster List Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-fit">
          <h2 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">Lineup Roster</h2>
          <div className="space-y-2">
            {artists.map((artist, idx) => (
              <div
                key={artist.id}
                onClick={() => setSelectedArtist(idx)}
                className={`p-3.5 rounded-lg cursor-pointer border transition ${selectedArtist === idx ? 'bg-indigo-950/60 border-indigo-500' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-slate-200">{artist.name}</h3>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/50">{artist.setStart}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{artist.genre}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Artist Technical & Hospitality Detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Timing Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold">{current.name}</h2>
                <span className="text-sm font-medium text-indigo-400">{current.genre}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${current.contractSigned ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 'bg-red-900/40 text-red-400 border border-red-800'}`}>
                  {current.contractSigned ? '✓ Contract Signed' : '✕ Contract Pending'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${current.depositPaid ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 'bg-amber-900/40 text-amber-400 border border-amber-800'}`}>
                  {current.depositPaid ? '✓ Deposit Paid' : '! Deposit Due'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-sm">
              <div>
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Set Time</div>
                <div className="font-mono text-slate-200 font-semibold mt-1">{current.setStart} - {current.setEnd}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Soundcheck</div>
                <div className="font-mono text-slate-200 font-semibold mt-1">{current.soundcheck}</div>
              </div>
            </div>
          </div>

          {/* Riders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tech Rider */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
              <h3 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-4 pb-2 border-b border-slate-800">
                Technical Rider & Inputs
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <div className="font-semibold text-slate-300 mb-2">Input Patch List:</div>
                  <ul className="space-y-1.5 text-slate-400">
                    {current.rider.inputs.map((item, i) => (
                      <li key={i} className="bg-slate-800/50 p-2 rounded border border-slate-800 font-mono text-[11px]">{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-slate-300 mb-2">Backline Requirements:</div>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    {current.rider.backline.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Hospitality Rider */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
              <h3 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-4 pb-2 border-b border-slate-800">
                Hospitality & Green Room
              </h3>
              <div className="text-xs">
                <div className="font-semibold text-slate-300 mb-2">Catering & Setup Checklist:</div>
                <ul className="space-y-2 text-slate-400">
                  {current.rider.hospitality.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 bg-slate-800/40 p-2 rounded border border-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}