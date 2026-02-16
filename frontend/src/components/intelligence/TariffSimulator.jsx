import React, { useState } from 'react';

const TariffSimulator = ({ inventory, tariffs }) => {
    const [selectedCountry, setSelectedCountry] = useState(tariffs[0].country);
    const [newRate, setNewRate] = useState(tariffs[0].scenarios[0].rate);

    const countryTariff = tariffs.find(t => t.country === selectedCountry);
    const affectedItems = inventory.filter(item => item.country_of_origin === selectedCountry);

    const calculateImpact = () => {
        return affectedItems.reduce((acc, item) => {
            const currentRate = countryTariff.current_rate;
            const currentCost = item.risk_value;
            const additionalCost = currentCost * (newRate - currentRate);
            return acc + additionalCost;
        }, 0);
    };

    const totalImpact = calculateImpact();

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-white/[0.06]">
                <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-5 bg-nexus-accent rounded-full"></span>
                    Geopolitical Tariff Simulator
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-400">Origin Country</label>
                        <select
                            value={selectedCountry}
                            onChange={(e) => {
                                const country = e.target.value;
                                setSelectedCountry(country);
                                const t = tariffs.find(tar => tar.country === country);
                                setNewRate(t.scenarios[0].rate);
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent/30 outline-none transition-all cursor-pointer"
                        >
                            {tariffs.map(t => (
                                <option key={t.country} value={t.country}>{t.country}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-slate-400">Projected Tariff Rate</label>
                            <span className="text-xl font-bold text-nexus-accent tabular-nums">{(newRate * 100).toFixed(0)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={newRate}
                            onChange={(e) => setNewRate(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nexus-accent"
                        />
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 overflow-hidden rounded-xl border border-white/[0.06] bg-slate-800/50">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-xs text-slate-400">
                            <tr>
                                <th className="px-5 py-3.5 font-medium">Affected SKU</th>
                                <th className="px-5 py-3.5 font-medium">Current Rate</th>
                                <th className="px-5 py-3.5 font-medium text-red-400">Simulated Rate</th>
                                <th className="px-5 py-3.5 font-medium text-right">Annual Impact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {affectedItems.map(item => (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3.5">
                                        <span className="text-sm font-medium text-white">{item.name}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-400 tabular-nums">{(countryTariff.current_rate * 100).toFixed(0)}%</td>
                                    <td className="px-5 py-3.5 text-sm text-red-400 font-medium tabular-nums">{(newRate * 100).toFixed(0)}%</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <span className="text-sm font-medium text-red-400 tabular-nums">
                                            +${(item.risk_value * (newRate - countryTariff.current_rate) / 1000).toFixed(1)}K
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {affectedItems.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                                        No affected SKUs for this country
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4">
                    {/* Total exposure */}
                    <div className="p-5 rounded-xl border border-red-400/15 bg-red-400/5">
                        <span className="text-xs font-medium text-red-400/70 block mb-1">Total Projected Exposure</span>
                        <div className="text-3xl font-bold text-red-400 tabular-nums mb-1">${(totalImpact / 1000).toFixed(1)}K</div>
                        <p className="text-xs text-slate-500">Calculated over annual inventory volume</p>
                    </div>

                    {/* Recommendation */}
                    <div className="p-5 rounded-xl border border-emerald-400/15 bg-emerald-400/5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded">Recommendation</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed mb-4">
                            Shift 23% of {selectedCountry} production to <span className="text-emerald-400 font-semibold">Monterrey, Mexico</span> (0% Tariff) to mitigate exposure.
                        </p>
                        <div className="flex justify-between items-center border-t border-emerald-400/10 pt-3">
                            <span className="text-xs text-slate-500 font-medium">Estimated Saving</span>
                            <span className="text-lg font-bold text-emerald-400 tabular-nums">${((totalImpact * 0.23) / 1000).toFixed(1)}K</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TariffSimulator;
