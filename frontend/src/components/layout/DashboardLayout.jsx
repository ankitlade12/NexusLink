import React from 'react';

const DashboardLayout = ({ children, activeTab, onTabChange }) => {
    const navItems = [
        { id: 'inventory', label: 'Inventory', icon: '/' },
        { id: 'tariffs', label: 'Tariffs', icon: '/' },
        { id: 'query', label: 'AI Query', icon: '/' },
        { id: 'parser', label: 'Logistics', icon: '/' },
    ];

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans selection:bg-nexus-accent/20">
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B1120]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => onTabChange('inventory')}
                    >
                        <div className="w-9 h-9 rounded-lg bg-nexus-accent/10 flex items-center justify-center text-nexus-accent text-sm font-bold border border-nexus-accent/20 group-hover:bg-nexus-accent/20 transition-colors">
                            NL
                        </div>
                        <h1 className="text-lg font-bold text-white tracking-tight">NexusLink</h1>
                    </div>

                    <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-white/5">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${activeTab === item.id
                                        ? 'bg-nexus-accent/15 text-nexus-accent'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
