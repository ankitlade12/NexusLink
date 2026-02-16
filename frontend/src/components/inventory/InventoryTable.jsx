import React from 'react';

const InventoryTable = ({ inventory }) => {
    return (
        <div className="overflow-hidden rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                            <th className="px-6 py-4">SKU / Item</th>
                            <th className="px-6 py-4">Shopify</th>
                            <th className="px-6 py-4">Amazon</th>
                            <th className="px-6 py-4">WMS</th>
                            <th className="px-6 py-4">POS</th>
                            <th className="px-6 py-4 text-nexus-accent font-bold">True ATP</th>
                            <th className="px-6 py-4 text-right pr-10">Risk Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {inventory.map((item) => (
                            <tr
                                key={item.id}
                                className={`group transition-colors hover:bg-white/5 ${item.discrepancy ? 'bg-nexus-danger/5' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white group-hover:text-nexus-accent transition-colors">
                                            {item.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                                            {item.id} • {item.category}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.systems.shopify}</td>
                                <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.systems.amazon}</td>
                                <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.systems.wms}</td>
                                <td className="px-6 py-4 text-sm text-slate-300 font-mono">{item.systems.pos}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${item.discrepancy ? 'text-nexus-danger' : 'text-nexus-success'}`}>
                                        {item.true_atp}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right pr-10">
                                    <div className="flex flex-col items-end">
                                        <span className={`text-sm font-bold ${item.discrepancy ? 'text-nexus-danger' : 'text-slate-500'}`}>
                                            {item.risk_value > 0 ? `$${(item.risk_value / 1000).toFixed(1)}K` : '—'}
                                        </span>
                                        {item.discrepancy && (
                                            <span className="text-[10px] text-nexus-danger uppercase font-bold animate-pulse">Out of Sync</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;
