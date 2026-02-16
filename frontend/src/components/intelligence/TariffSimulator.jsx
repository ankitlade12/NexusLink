import React, { useState } from 'react';

const TariffSimulator = ({ inventory, tariffs }) => {
    const [selectedCountry, setSelectedCountry] = useState(tariffs[0].country);
    const [newRate, setNewRate] = useState(tariffs[0].scenarios[0].rate);

    const countryTariff = tariffs.find(t => t.country === selectedCountry);
    const affectedItems = inventory.filter(item => item.country_of_origin === selectedCountry);

    const calculateImpact = () => {
        return affectedItems.reduce((acc, item) => {
            const currentRate = countryTariff.current_rate;
            const currentCost = item.risk_value; // Simplification: using risk_value as a proxy for cost
            const additionalCost = currentCost * (newRate - currentRate);
            return acc + additionalCost;
        }, 0);
    };

    const totalImpact = calculateImpact();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl">
                <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2 h-6 bg-nexus-accent rounded-full"></span>
                    Geopolitical Tariff Simulator
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Origin Country</label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => {
                                const country = e.target.value;
                                setSelectedCountry(country);
                                const t = tariffs.find(tar => tar.country === country);
                                setNewRate(t.scenarios[0].rate);
                            }}
                            className="w-full bg-nexus-dark border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-nexus-accent outline-none transition-all cursor-pointer"
                        >
                            {tariffs.map(t => (
                                <option key={t.country} value={t.country}>{t.country}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Projected Tariff Rate</label>
                            <span className="text-2xl font-black text-nexus-accent">{(newRate * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={newRate}
                            onChange={(e) => setNewRate(parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-nexus-accent"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-white/5 bg-white/5">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Effected SKU</th>
                                <th className="px-6 py-4">Current Rate</th>
                                <th className="px-6 py-4 text-nexus-danger">Simulated Rate</th>
                                <th className="px-6 py-4 text-right">Annual Impact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {affectedItems.map(item => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-white">{item.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{(countryTariff.current_rate * 100).toFixed(0)}%</td>
                                    <td className="px-6 py-4 text-sm text-nexus-danger font-bold">{(newRate * 100).toFixed(0)}%</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-bold text-nexus-danger">
                                            +${(item.risk_value * (newRate - countryTariff.current_rate) / 1000).toFixed(1)}K
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-nexus-danger/20 bg-nexus-danger/5 backdrop-blur-sm">
                        <span className="text-[10px] font-bold uppercase text-nexus-danger/60 mb-1 block tracking-widest">Total Projected Exposure</span>
                        <div className="text-4xl font-black text-nexus-danger mb-1">${(totalImpact / 1000).toFixed(1)}K</div>
                        <p className="text-xs text-slate-500">Calculated over annual inventory volume</p>
                    </div>

                    <div className="p-6 rounded-2xl border border-nexus-success/20 bg-nexus-success/5 backdrop-blur-sm border-dashed">
                        <div className="flex items-center gap-2 mb-4 text-nexus-success">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-nexus-success/20 px-2 py-0.5 rounded">Recommendation</span>
                        </div>
                        <p className="text-sm text-slate-200 font-medium mb-4">
                            Shift 23% of {selectedCountry} production to <span className="text-nexus-success font-bold">Monterrey, Mexico</span> (0% Tariff) to mitigate exposure.
                        </p>
                        <div className="flex justify-between items-end border-t border-nexus-success/10 pt-4">
                            <span className="text-xs text-slate-500 font-bold uppercase">Estimated Saving</span>
                            <span className="text-lg font-black text-nexus-success">${((totalImpact * 0.23) / 1000).toFixed(1)}K</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TariffSimulator;
