import React, { useState } from 'react';

const AIQuery = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'NexusLink Intel Activated. How can I analyze the data fabric for you today?', status: 'online' }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setQuery('');
        setIsTyping(true);

        // Mocking AI response for demo purposes (Phase 3.2 logic)
        setTimeout(() => {
            let response = "I've analyzed the current data fabric. How else can I help?";

            if (query.toLowerCase().includes('inventory') || query.toLowerCase().includes('jacket')) {
                response = "The Alpine Ridge Jacket currently shows a discrepancy of 103 units between Shopify and WMS. $31.2K capital is currently frozen due to this mismatch.";
            } else if (query.toLowerCase().includes('tariff') || query.toLowerCase().includes('vietnam')) {
                response = "Vietnam exposure is increasing. A 32% spike is projected for May 1st. My recommendation is to reallocate production to the Mexico corridor to zero out tariff costs.";
            } else if (query.toLowerCase().includes('returns') || query.toLowerCase().includes('limbo')) {
                response = "There are 15 entries in 'Limbo' status. Total frozen value is $40.8K, with an average stuck time of 24 days. Would you like me to initiate inspection workflows?";
            }

            setMessages(prev => [...prev, { role: 'assistant', text: response, status: 'synced' }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[600px] max-w-4xl mx-auto rounded-3xl border border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-nexus-accent flex items-center justify-center">
                        <div className="w-2 h-2 bg-nexus-dark rounded-full animate-ping"></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">NexusLink Intel</h3>
                        <span className="text-[10px] text-nexus-accent uppercase font-bold tracking-tighter">Connected to True Data Fabric</span>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-nexus-accent/10 border border-nexus-accent/20 text-[10px] font-bold text-nexus-accent uppercase tracking-widest">
                    V1.0 GPT-4o
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-nexus-accent text-nexus-dark font-bold rounded-tr-none shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                                : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none font-medium'
                            }`}>
                            {msg.text}
                            {msg.status && (
                                <div className="text-[8px] mt-2 opacity-40 uppercase tracking-widest flex items-center gap-1">
                                    <div className={`w-1 h-1 rounded-full ${msg.status === 'online' ? 'bg-nexus-success' : 'bg-nexus-accent'}`}></div>
                                    {msg.status}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
                            <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-nexus-accent rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-white/5 border-t border-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask anything about inventory, tariffs, or returns..."
                        className="w-full bg-nexus-dark/50 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-nexus-accent outline-none transition-all placeholder:text-slate-600 pr-16"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-3 bottom-3 px-4 bg-nexus-accent text-nexus-dark font-black text-xs uppercase rounded-xl hover:scale-105 transition-transform"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIQuery;
