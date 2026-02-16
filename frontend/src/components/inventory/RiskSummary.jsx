import React from 'react';

const RiskSummary = ({ inventory, alerts }) => {
    const discrepancies = inventory.filter(item => item.discrepancy).length;
    const totalValueAtRisk = inventory.reduce((acc, item) => acc + item.risk_value, 0);
    const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL').length;

    const stats = [
        {
            label: 'Inventory Discrepancies',
            value: discrepancies,
            sub: `of ${inventory.length} SKUs monitored`,
            color: 'text-red-400',
            accent: 'bg-red-400',
        },
        {
            label: 'Capital at Risk',
            value: `$${(totalValueAtRisk / 1000).toFixed(1)}K`,
            sub: 'Across all channels',
            color: 'text-nexus-accent',
            accent: 'bg-nexus-accent',
        },
        {
            label: 'Critical Actions',
            value: criticalAlerts,
            sub: 'Requiring immediate review',
            color: 'text-amber-400',
            accent: 'bg-amber-400',
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, i) => (
                <div key={i} className="p-5 rounded-xl bg-slate-800/50 border border-white/[0.06] hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${stat.accent}`} />
                        <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-500">{stat.sub}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RiskSummary;
