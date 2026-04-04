import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ShieldCheck, Search, Filter } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const EmployerContracts = () => {
    const [search, setSearch] = useState('');
    
    // Mock contracts since no endpoint exists yet
    const contracts = [
        { id: "CNT-4821", type: "Standard Labor", role: "Electrician", status: "Active", date: "2024-03-12" },
        { id: "CNT-4822", type: "Squad Deployment", role: "Construction", status: "Pending", date: "2024-03-15" },
        { id: "CNT-4820", type: "NDA & Compliance", role: "General", status: "Archived", date: "2024-02-28" }
    ];

    const filtered = contracts.filter(c => 
        c.id.toLowerCase().includes(search.toLowerCase()) || 
        c.role.toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = (id) => {
        toast.message(`Decryption initiated for document ${id}`);
        setTimeout(() => toast.success("Document saved to local terminal."), 1500);
    };

    return (
        <div className="space-y-12 pb-20 employer-theme">
            {/* INSTRUCTION HEADER */}
            <div className="flex justify-between items-end">
                <div className="space-y-4">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl font-black font-['Space_Grotesk'] tracking-tighter uppercase leading-none"
                    >
                        Digital <span className="text-orange-500 italic">Contracts</span>
                    </motion.h1>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 font-['Space_Grotesk']">
                        Legally Binding Engagements &amp; Agreements
                    </p>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="flex flex-col md:flex-row gap-4 relative z-10 w-full">
                <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500/50" />
                    <Input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search contract database..."
                        className="w-full h-14 pl-16 pr-8 rounded-2xl bg-black/40 border-white/5 focus:border-orange-500/50 text-white font-['Space_Grotesk'] font-bold text-sm tracking-wide shadow-2xl placeholder:italic placeholder:text-muted-foreground/30"
                    />
                </div>
                <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 px-8 text-[10px] font-black uppercase tracking-widest text-white">
                    <Filter className="w-4 h-4 mr-2" /> Filter
                </Button>
            </div>
            
            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                    {filtered.map((contract, borderIdx) => (
                        <motion.div 
                            key={contract.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-[2rem] bg-black/40 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-orange-500" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-black font-['Space_Grotesk'] uppercase text-white leading-none">
                                            {contract.id}
                                        </h3>
                                        <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                            contract.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            contract.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                            'bg-white/5 text-muted-foreground border border-white/10'
                                        }`}>
                                            {contract.status}
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                                        <span>Type: {contract.type}</span>
                                        <span>&bull;</span>
                                        <span>Role: {contract.role}</span>
                                        <span>&bull;</span>
                                        <span>Issued: {contract.date}</span>
                                    </div>
                                </div>
                            </div>
                            <Button 
                                onClick={() => handleDownload(contract.id)}
                                variant="outline" 
                                className="w-full md:w-auto h-12 rounded-xl border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 text-[10px] font-black uppercase tracking-widest text-orange-500 group"
                            >
                                <Download className="w-3 h-3 mr-2 opacity-50 group-hover:translate-y-1 transition-all" />
                                Retrieve Data
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground/50 border border-white/5 rounded-[2rem] bg-black/20">
                        No contracts found matching the criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployerContracts;
