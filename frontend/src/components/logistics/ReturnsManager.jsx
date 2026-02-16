import React from 'react';

const ReturnsManager = ({ returns }) => {
    const mockReturnsList = [
        { id: 'RET-882', sku: 'SKU-101', value: 12400, days: 32, reason: 'Carrier Damaged' },
        { id: 'RET-901', sku: 'SKU-103', value: 8200, days: 18, reason: 'Wrong Item' },
        { id: 'RET-944', sku: 'SKU-105', value: 20200, days: 41, reason: 'Quality Issue' }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
                    <span className="w-1.5 h-5 bg-red-400 rounded-full"></span>
                    Returns in Limbo
                </h2>
                <span className="text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1 rounded-md border border-red-400/15">
                    $40.8K at risk
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockReturnsList.map((ret) => (
                    <div key={ret.id} className="p-5 rounded-xl bg-slate-800/50 border border-white/[0.06] hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs text-slate-500 block">{ret.id}</span>
                                <span className="text-sm font-semibold text-white">{ret.sku}</span>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${ret.days > 30
                                    ? 'bg-red-400/15 text-red-400'
                                    : 'bg-amber-400/15 text-amber-400'
                                }`}>
                                {ret.days}d stuck
                            </span>
                        </div>

                        <div className="mb-4">
                            <span className="text-xs text-slate-500 block mb-0.5">Return Reason</span>
                            <p className="text-sm text-slate-300">{ret.reason}</p>
                        </div>

                        <div className="flex items-center justify-between mb-5">
                            <span className="text-lg font-bold text-white tabular-nums">${ret.value.toLocaleString()}</span>
                            <span className="text-xs text-slate-500">Asset Value</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button className="py-2 bg-emerald-400/10 border border-emerald-400/15 text-emerald-400 hover:bg-emerald-400 hover:text-slate-900 text-xs font-medium rounded-lg transition-all">
                                Release to ATP
                            </button>
                            <button className="py-2 bg-red-400/10 border border-red-400/15 text-red-400 hover:bg-red-400 hover:text-white text-xs font-medium rounded-lg transition-all">
                                Write-off
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReturnsManager;
