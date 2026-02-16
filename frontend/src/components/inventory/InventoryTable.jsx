import React from 'react';

const InventoryTable = ({ inventory }) => {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-slate-800/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/[0.06] text-xs text-slate-400">
                            <th className="px-5 py-3.5 font-medium">Item</th>
                            <th className="px-5 py-3.5 font-medium">Shopify</th>
                            <th className="px-5 py-3.5 font-medium">Amazon</th>
                            <th className="px-5 py-3.5 font-medium">WMS</th>
                            <th className="px-5 py-3.5 font-medium">POS</th>
                            <th className="px-5 py-3.5 font-medium text-white">True ATP</th>
                            <th className="px-5 py-3.5 font-medium text-right">Risk Exposure</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item, i) => (
                            <tr
                                key={item.id}
                                className="group border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="px-5 py-3.5">
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-medium ${item.discrepancy ? 'text-white' : 'text-slate-300'}`}>
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {item.id}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-slate-400 font-mono tabular-nums">{item.systems.shopify}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-400 font-mono tabular-nums">{item.systems.amazon}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-400 font-mono tabular-nums">{item.systems.wms}</td>
                                <td className="px-5 py-3.5 text-sm text-slate-400 font-mono tabular-nums">{item.systems.pos}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`text-sm font-semibold ${item.discrepancy ? 'text-orange-400' : 'text-emerald-400'}`}>
                                        {item.true_atp}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    {item.risk_value > 0 ? (
                                        <span className="inline-flex text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full border border-red-400/10">
                                            ${(item.risk_value / 1000).toFixed(1)}k
                                        </span>
                                    ) : (
                                        <span className="text-slate-600">&mdash;</span>
                                    )}
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
