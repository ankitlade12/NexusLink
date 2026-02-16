import React from 'react';

const AlertPanel = ({ alerts }) => {
    return (
        <div className="w-full lg:w-80 h-fit space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Intelligence</h2>
                <span className="text-[10px] bg-nexus-accent/20 text-nexus-accent px-2 py-0.5 rounded border border-nexus-accent/30">
                    NexusLink GPT
                </span>
            </div>

            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm relative overflow-hidden group hover:border-nexus-accent/50 transition-all`}
                >
                    {/* Status Bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${alert.type === 'CRITICAL' ? 'bg-nexus-danger' : 'bg-nexus-warn'}`} />

                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase ${alert.type === 'CRITICAL' ? 'text-nexus-danger' : 'text-nexus-warn'}`}>
                                {alert.type}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono tracking-tighter">${(alert.risk / 1000).toFixed(1)}K EXPOSURE</span>
                        </div>
                        <p className="text-sm text-slate-200 mb-4 leading-relaxed font-medium">
                            {alert.message}
                        </p>
                        <button className="w-full py-2 bg-nexus-dark border border-white/10 hover:border-nexus-accent hover:text-nexus-accent text-xs font-bold rounded-lg transition-all uppercase tracking-widest">
                            Execute Action
                        </button>
                    </div>
                </div>
            ))}

            <div className="p-4 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-8 h-8 rounded-full border border-white/20 mb-2 flex items-center justify-center text-xs text-white">+</div>
                <span className="text-[10px] text-slate-400">Add custom alert threshold</span>
            </div>
        </div>
    );
};

export default AlertPanel;
