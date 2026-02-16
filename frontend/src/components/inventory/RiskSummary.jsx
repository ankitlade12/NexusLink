import React from 'react';

const RiskSummary = ({ inventory, alerts }) => {
    const discrepancies = inventory.filter(item => item.discrepancy).length;
    const totalValueAtRisk = inventory.reduce((acc, item) => acc + item.risk_value, 0);
    const criticalAlerts = alerts.filter(a => a.type === 'CRITICAL').length;

    const stats = [
        {
            label: 'Inventory Discrepancies',
            value: discrepancies,
            sub: `${inventory.length} SKUs Monitored`,
            color: 'text-nexus-danger',
            bg: 'bg-nexus-danger/10'
        },
        {
            label: '$ Capital at Risk',
            value: `$${(totalValueAtRisk / 1000).toFixed(1)}K`,
            sub: 'Across all channels',
            color: 'text-nexus-accent',
            bg: 'bg-nexus-accent/10'
        },
        {
            label: 'Critical Actions',
            value: criticalAlerts,
            sub: 'Requiring immediate review',
            color: 'text-nexus-warn',
            bg: 'bg-nexus-warn/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, i) => (
                <div key={i} className={`p-6 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-400 capitalize">{stat.label}</span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${stat.bg} ${stat.color} border border-current/20`}>
                            NexusLink Truth
                        </span>
                    </div>
                    <div className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.sub}</div>
                </div>
            ))}
        </div>
    );
};

export default RiskSummary;
