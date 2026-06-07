import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Brain, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { callAI } from '@/lib/ai';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const suggestedPrompts = ['Plan my week','What should I eat today?','Help me with sore muscles','How do I improve my squat form?'];

export default function Coach() {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [failedMessage, setFailedMessage] = useState(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(query(collection(db,'users',user.uid,'messages'), orderBy('timestamp','asc')));
      return snap.docs.map(d => ({id:d.id,...d.data()}));
    },
    enabled: !!user
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSend = async (msg) => {
    const text = msg || input.trim();
    if (!text || isThinking || !user) return;
    setInput('');
    await addDoc(collection(db,'users',user.uid,'messages'), { role:'user', content:text, timestamp:serverTimestamp() });
    queryClient.invalidateQueries({queryKey:['chat-messages',user.uid]});
    setIsThinking(true);
    const systemPrompt = `You are Coach X, an elite personal trainer and nutritionist for XFit. Provide science-backed, motivating, personalized fitness advice. Be concise, actionable, and encouraging. Use markdown formatting.
User: ${userData?.full_name||'Athlete'}, Goal: ${userData?.fitness_goal||'not set'}, Level: ${userData?.experience_level||'not set'}.
Their signature workout is Locked In: 105 jumps warm-up, bicep curls 25 reps, lateral raises 40 reps, hammer curls 25 reps, ground-to-overhead 25 reps, push-ups 50 reps, 7-round core circuit, squats/Bulgarian split squats. All comfortable weight, 21 min, 300 cal, Advanced.`;
    try {
      const recentMsgs = messages.slice(-8).map(m=>({role:m.role,content:m.content}));
      const reply = await callAI({ system: systemPrompt, messages: [...recentMsgs, {role:'user',content:text}], maxTokens: 1000 });
      await addDoc(collection(db,'users',user.uid,'messages'), { role:'assistant', content:reply, timestamp:serverTimestamp() });
      setFailedMessage(null);
    } catch(e) {
      setFailedMessage(text);
      await addDoc(collection(db,'users',user.uid,'messages'), { role:'assistant', content:'__RETRY__', timestamp:serverTimestamp() });
    }
    setIsThinking(false);
    queryClient.invalidateQueries({queryKey:['chat-messages',user.uid]});
  };

  const handleRetry = () => {
    if (failedMessage) sendMessage(failedMessage);
  };

  const handleClearChat = async () => {
    for (const msg of messages) await deleteDoc(doc(db,'users',user.uid,'messages',msg.id));
    queryClient.invalidateQueries({queryKey:['chat-messages',user.uid]});
    setShowClearDialog(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Brain className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="font-bold">Coach X</h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online</div>
            </div>
          </div>
          {messages.length>0 && <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => setShowClearDialog(true)}><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </div>
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Clear Chat History</AlertDialogTitle><AlertDialogDescription>Are you sure? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleClearChat}>Clear</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length===0 && !isThinking && (
            <div className="text-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><Brain className="w-8 h-8 text-primary" /></div>
              <div><h2 className="text-xl font-bold">Hey{userData?.full_name?`, ${userData.full_name.split(' ')[0]}`:''}! 👋</h2><p className="text-muted-foreground text-sm mt-1">I'm Coach X, your AI fitness coach. How can I help?</p></div>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map(p => <Button key={p} variant="secondary" size="sm" className="rounded-full text-xs" onClick={() => handleSend(p)}>{p}</Button>)}
              </div>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg,i) => (
              <motion.div key={msg.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role==='user'?'bg-primary text-primary-foreground':'glass'}`}>
                  {msg.role==='user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : msg.content === '__RETRY__' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">😤 Coach X hit a limit. Try again?</p>
                      <button onClick={handleRetry} disabled={isThinking}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all disabled:opacity-50">
                        {isThinking ? 'Retrying...' : '🔄 Retry'}
                      </button>
                    </div>
                  ) : (
                    <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{msg.content}</ReactMarkdown>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isThinking && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex justify-start">
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div>
                <span className="text-sm text-muted-foreground">Coach X is thinking...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {messages.length>0 && (
        <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestedPrompts.map(p => <Button key={p} variant="secondary" size="sm" className="rounded-full text-[10px] shrink-0" onClick={() => handleSend(p)} disabled={isThinking}>{p}</Button>)}
          </div>
        </div>
      )}
      <div className="p-4 border-t border-border">
        <form onSubmit={(e) => {e.preventDefault(); handleSend();}} className="flex gap-2 max-w-3xl mx-auto">
          <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Coach X anything..." className="rounded-xl bg-secondary/50 border-0 h-11" disabled={isThinking} />
          <Button type="submit" size="icon" className="rounded-xl h-11 w-11 shrink-0" disabled={!input.trim()||isThinking}><Send className="w-4 h-4" /></Button>
        </form>
      </div>
    </div>
  );
}
