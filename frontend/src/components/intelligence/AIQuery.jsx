import React, { useState, useRef, useEffect } from 'react';

const AIQuery = () => {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'NexusLink Intel activated. Ask me anything about your inventory, tariffs, or returns.' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setQuery('');
        setIsTyping(true);

        setTimeout(() => {
            let response = "I've analyzed the current data fabric. How else can I help?";

            if (query.toLowerCase().includes('inventory') || query.toLowerCase().includes('jacket')) {
                response = "The Alpine Ridge Jacket currently shows a discrepancy of 103 units between Shopify and WMS. $31.2K capital is currently frozen due to this mismatch.";
            } else if (query.toLowerCase().includes('tariff') || query.toLowerCase().includes('vietnam')) {
                response = "Vietnam exposure is increasing. A 32% spike is projected for May 1st. My recommendation is to reallocate production to the Mexico corridor to zero out tariff costs.";
            } else if (query.toLowerCase().includes('returns') || query.toLowerCase().includes('limbo')) {
                response = "There are 15 entries in 'Limbo' status. Total frozen value is $40.8K, with an average stuck time of 24 days. Would you like me to initiate inspection workflows?";
            }

            setMessages(prev => [...prev, { role: 'assistant', text: response }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto rounded-xl border border-white/[0.06] bg-slate-800/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-nexus-accent/15 flex items-center justify-center">
                        <div className="w-2 h-2 bg-nexus-accent rounded-full animate-pulse"></div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">NexusLink Intel</h3>
                        <span className="text-xs text-nexus-accent/70">Connected to Data Fabric</span>
                    </div>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-slate-700/50 border border-white/[0.06] text-xs text-slate-400">
                    GPT-4o
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-nexus-accent text-slate-900 font-medium rounded-2xl rounded-br-md'
                                : 'bg-slate-700/50 border border-white/[0.06] text-slate-200 rounded-2xl rounded-bl-md'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700/50 border border-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 bg-nexus-accent/60 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-nexus-accent/60 rounded-full animate-bounce [animation-delay:150ms]"></div>
                            <div className="w-1.5 h-1.5 bg-nexus-accent/60 rounded-full animate-bounce [animation-delay:300ms]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06] bg-slate-900/30">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about inventory, tariffs, or returns..."
                        className="flex-1 bg-slate-800 border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent/30 outline-none transition-all placeholder:text-slate-500"
                    />
                    <button
                        type="submit"
                        className="px-5 py-3 bg-nexus-accent text-slate-900 font-semibold text-sm rounded-lg hover:bg-nexus-accent/90 transition-colors"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIQuery;
