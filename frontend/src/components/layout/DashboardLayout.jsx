import React from 'react';

const DashboardLayout = ({ children, activeTab, onTabChange }) => {
    const navItems = [
        { id: 'inventory', label: 'Inventory' },
        { id: 'tariffs', label: 'Tariffs' },
        { id: 'query', label: 'AI Query' },
        { id: 'parser', label: 'Parser' },
    ];

    return (
        <div className="min-h-screen bg-nexus-dark text-white p-4 lg:p-10 selection:bg-nexus-accent/30 font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 border-b border-white/10 pb-8">
                <div className="flex items-center gap-4 mb-4 md:mb-0 group cursor-pointer" onClick={() => onTabChange('inventory')}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-nexus-accent to-blue-600 flex items-center justify-center text-xl font-black shadow-[0_0_20px_rgba(56,189,248,0.4)] group-hover:scale-110 transition-transform">
                        NL
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            NexusLink <span className="text-xs font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest">V0.1 Demo</span>
                        </h1>
                        <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">Supply Chain Data Fabric</p>
                    </div>
                </div>

                <nav className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest text-slate-500">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`transition-all pb-1 hover:text-white ${activeTab === item.id ? 'text-nexus-accent border-b-2 border-nexus-accent' : ''}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </header>

            <main className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
