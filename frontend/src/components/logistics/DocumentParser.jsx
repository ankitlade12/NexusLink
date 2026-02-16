import React, { useState } from 'react';

const DocumentParser = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [extractedData, setExtractedData] = useState(null);

    const handleUpload = () => {
        setIsScanning(true);
        setScanComplete(false);

        setTimeout(() => {
            setIsScanning(false);
            setScanComplete(true);
            setExtractedData({
                carrier: 'DHL Express',
                tracking: 'NL-8829-XJ',
                origin: 'Vietnam Hub A4',
                destination: 'Long Beach, CA',
                items: [
                    { sku: 'SKU-101', name: 'Alpine Ridge Jacket', qty: 250, status: 'Extracted' },
                    { sku: 'SKU-103', name: 'Glacier Trail Pack', qty: 120, status: 'Extracted' }
                ],
                confidence: '98.4%'
            });
        }, 3000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload area */}
            <div className="p-6 rounded-xl bg-slate-800/50 border border-white/[0.06]">
                <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
                    <span className="w-1.5 h-5 bg-nexus-accent rounded-full"></span>
                    Document Parser
                </h2>

                <div
                    onClick={handleUpload}
                    className={`h-72 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${isScanning
                            ? 'border-nexus-accent/40 bg-nexus-accent/5'
                            : 'border-white/10 hover:border-nexus-accent/30 hover:bg-white/[0.01]'
                        }`}
                >
                    {isScanning && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-nexus-accent animate-scan-line z-10" />
                    )}

                    <div className="text-center space-y-4">
                        <div className="w-14 h-14 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto">
                            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white mb-1">Drop Bill of Lading or Invoice</p>
                            <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                        <button className="px-5 py-2 bg-nexus-accent text-slate-900 text-xs font-semibold rounded-lg hover:bg-nexus-accent/90 transition-colors">
                            Browse Files
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div>
                {scanComplete && extractedData ? (
                    <div className="p-6 rounded-xl border border-nexus-accent/15 bg-nexus-accent/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-nexus-accent">Extracted Data</h3>
                            <span className="text-xs bg-emerald-400/15 text-emerald-400 px-2.5 py-1 rounded-md font-medium border border-emerald-400/15">
                                {extractedData.confidence} confidence
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-6">
                            {[
                                { label: 'Carrier', value: extractedData.carrier },
                                { label: 'Tracking #', value: extractedData.tracking },
                                { label: 'Origin', value: extractedData.origin },
                                { label: 'Destination', value: extractedData.destination },
                            ].map((field, i) => (
                                <div key={i}>
                                    <span className="text-xs text-slate-500 block mb-1">{field.label}</span>
                                    <span className="text-sm font-medium text-white">{field.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2.5">
                            <span className="text-xs text-slate-500 block mb-2">Manifest Items</span>
                            {extractedData.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/[0.06] hover:border-nexus-accent/30 transition-colors">
                                    <div>
                                        <span className="text-sm font-medium text-white block">{item.name}</span>
                                        <span className="text-xs text-slate-500">{item.sku}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-semibold text-nexus-accent block">{item.qty} units</span>
                                        <span className="text-xs text-emerald-400">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-3 bg-nexus-accent text-slate-900 font-semibold text-sm rounded-lg hover:bg-nexus-accent/90 transition-colors">
                            Ingest to Data Fabric
                        </button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-10 border border-dashed border-white/[0.06] rounded-xl">
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-400 mb-1">No data extracted yet</p>
                            <p className="text-xs text-slate-500">Upload a document to begin AI extraction</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentParser;
