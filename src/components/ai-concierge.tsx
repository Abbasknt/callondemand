'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bot, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  ChevronRight, 
  Command,
  Zap,
  Globe,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Welcome to the COD Nigeria Hub. How can I help you scale your lifestyle today?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: input, 
            history: messages,
            systemInstruction: `You are the Call on Demand (COD) Nigeria Concierge. You help users navigate a multi-service lifestyle platform that includes:
 - Wallet & Payments (Naira ₦)
 - Logistics & Shipping (Nigeria Hub)
 - Food/Laundry (Unit-based operations)
 - Crowdfunding & Investments (Growth Hub)
 - Shortlet Bookings
 
 Your tone is "Strategic, Elite, and Efficient". Use words like "Synchronized", "Optimized", "Nigeria Hub", and "Scale Up".
 When users ask about scaling, suggest they check the Growth Hub or expand their logistics operations.
 User Name: ${user?.displayName || 'Partner'}.`
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.text || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "I'm having trouble syncing with the primary node. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-[1000] hidden md:block">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-16 w-16 rounded-full shadow-2xl transition-all duration-500 group border-4 border-white",
            isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
          )}
        >
          {isOpen ? <X className="h-8 w-8" /> : <Bot className="h-8 w-8 group-hover:scale-110 transition-transform" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-accent border-2 border-white"></span>
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 md:bottom-24 right-0 md:right-24 w-full md:w-[400px] h-[600px] bg-background border-4 border-primary/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] z-[1001] rounded-[3rem] flex flex-col overflow-hidden m-4 md:m-0"
          >
            {/* Header */}
            <div className="p-6 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic">Nigeria Concierge</h3>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Master Node Synchronized</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 rounded-xl">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-4 bg-muted/30 border-b flex gap-2 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap">
               <button onClick={() => setInput("Scale my wallet")} className="px-3 py-1.5 rounded-full bg-white border text-[9px] font-black uppercase tracking-tighter hover:border-primary transition-colors flex items-center gap-1.5 shrink-0">
                 <TrendingUp className="h-3 w-3 text-primary" /> Scale Wallet
               </button>
               <button onClick={() => setInput("Check logistics")} className="px-3 py-1.5 rounded-full bg-white border text-[9px] font-black uppercase tracking-tighter hover:border-primary transition-colors flex items-center gap-1.5 shrink-0">
                 <Globe className="h-3 w-3 text-accent" /> Track Logistics
               </button>
               <button onClick={() => setInput("Verify identity")} className="px-3 py-1.5 rounded-full bg-white border text-[9px] font-black uppercase tracking-tighter hover:border-primary transition-colors flex items-center gap-1.5 shrink-0">
                 <ShieldCheck className="h-3 w-3 text-primary" /> Multi-Auth
               </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[85%]",
                  m.role === 'user' ? "ml-auto items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-3xl text-xs font-medium leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted rounded-tl-none"
                  )}>
                    {m.content}
                  </div>
                  <span className="text-[8px] font-bold uppercase opacity-30 mt-1 px-1">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Optimizing Response...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-muted/30 border-t shrink-0">
              <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-inner border-2 border-primary/10">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask COD Concierge to scale..."
                  className="border-none focus-visible:ring-0 text-xs font-bold bg-transparent"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading}
                  className="rounded-xl h-10 w-10 bg-primary hover:bg-primary/90 shadow-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
