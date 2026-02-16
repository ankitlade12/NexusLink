import React from 'react';

const AlertPanel = ({ alerts }) => {
    return (
        <div className="w-full lg:w-80 shrink-0">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">Intelligence Feed</h3>

            <div className="space-y-2.5">
                {alerts.map((alert, i) => (
                    <div
                        key={alert.id}
                        className="p-4 rounded-xl bg-slate-800/50 border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${alert.type === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-200 leading-snug mb-1.5">{alert.message}</p>
                                <span className="text-xs text-slate-500">{alert.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                View All Activity
            </button>
        </div>
    );
};

export default AlertPanel;
