/**
 * Research Assistant chat container using manual state management.
 * Replicates the "Homepage" pattern of fake chat simulation to avoid runtime errors.
 */
import React, { useState, useEffect, useRef } from 'react';
import { AssistantMessageContent } from './components/AssistantMessageContent';
import { ChatHeader } from './components/ChatHeader';
import './ResearchAssistantChat.css';

const DEMO_TIMING = {
  THINK_MS: 1500,        // Increased from 1000
  TERMINAL_MS: 3800,     // Increased from 3000
  PARA1_MS: 3000,        // Increased from 2500
  CHART_SKELETON_MS: 2200, // Increased from 1800
  PARA2_MS: 2500,        // Increased from 2000
} as const;

// --- Scripts ---

// Response 1: Novice vs Experience
const RESP1_TERMINAL_LOGS = [
  "analyzing session logs (n=450)...",
  "filtering by tutor_experience < 6 months...",
  "calculating weekly momentum averages...",
  "correlating with retention events...",
  "done."
];

const RESP1_PARA1 = "Here is the engagement breakdown. I've analyzed momentum trends for novice vs experienced tutors over the last term.";
const RESP1_PARA2 = "Experienced tutors maintain 15% higher momentum on average. Novice tutors show more volatility but converge towards the end of the term.";

// Response 2: Correlation Strategies
const RESP2_TERMINAL_LOGS = [
  "scanning transcript sentiment...",
  "identifying strategy markers...",
  "generating heat map matrix...",
  "validating p-values...",
  "done."
];
const RESP2_PARA1 = "These strategies have the highest correlation with positive student outcomes based on recent session analysis.";
const RESP2_PARA2 = "Visual representations and effort validation are top drivers for breakthroughs. Peer collaboration is strong for engagement.";


type MessagePart =
  | { type: 'text'; text: string; shouldType?: boolean }
  | { type: 'data'; name: string; data: any };

type Message = {
  role: 'user' | 'assistant';
  content: MessagePart[];
};

export function ResearchAssistantChat({
  onBack,
  className = '',
}: {
  onBack?: () => void;
  className?: string;
}): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [hasTriggeredAutoType, setHasTriggeredAutoType] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial Auto-Trigger (Restored)
  // "Click on compare engagement button and then it just auto-sends"
  useEffect(() => {
    if (messages.length === 0 && !isRunningRef.current) {
      setMessages([{
        role: 'user',
        content: [{ type: 'text', text: 'Compare engagement: novice vs experienced tutors' }]
      }]);
    }
  }, []);

  // Helper to add messages
  const addMessage = (role: 'user' | 'assistant', part: MessagePart) => {
    setMessages(prev => [...prev, { role, content: [part] }]);
  };

  const handleSend = () => {
    // If auto-typing, we allow empty check to pass if controlled, but checking input.trim() is safer
    // But for auto-send from script, we might call this with 'valid' input already in state
    if (!input.trim()) return;
    addMessage('user', { type: 'text', text: input });
    setInput('');
  };

  const triggerAutoTyping = (text: string) => {
    setIsAutoTyping(true);
    let i = 0;
    setInput('');
    const interval = setInterval(() => {
      setInput(text.substring(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        // Pause before auto-sending - pass text directly to avoid closure issue
        setTimeout(() => {
          addMessage('user', { type: 'text', text: text });
          setInput('');
          setIsAutoTyping(false);
        }, 500);
      }
    }, 27); // Typing speed (150% faster)
  };

  // Derived state to check phase
  const userMsgCount = messages.filter(m => m.role === 'user').length;
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

  // On Focus Handler
  const handleInputFocus = () => {
    // Check if Phase 1 is done and we haven't triggered auto-type yet
    // Phase 1 Done condition: 
    // 1. We have 1 user message (initial query)
    // 2. We are NOT running (assistant finished responding)
    // 3. Last message is Assistant (and specifically the stats component)

    const isPhase1Done = userMsgCount === 1 && !isRunningRef.current && lastMsg?.role === 'assistant';

    if (isPhase1Done && !hasTriggeredAutoType) {
      setHasTriggeredAutoType(true);
      triggerAutoTyping("Can you show me the engagement trends?");
    }
  };


  // Script Engine
  useEffect(() => {
    if (messages.length === 0) return;

    // If last message is user, run the appropriate response script
    if (lastMsg?.role === 'user' && !isRunningRef.current) {
      const runResponse = async () => {
        isRunningRef.current = true;

        // Wait a bit before thinking
        await new Promise(r => setTimeout(r, DEMO_TIMING.THINK_MS));

        if (userMsgCount === 1) {
          // --- Phase 1: Overview ---
          // 1. Terminal
          addMessage('assistant', { type: 'data', name: 'terminal', data: { logs: RESP1_TERMINAL_LOGS } });
          await new Promise(r => setTimeout(r, DEMO_TIMING.TERMINAL_MS));

          // 2. Text Para 1
          addMessage('assistant', { type: 'text', text: RESP1_PARA1, shouldType: true });
          await new Promise(r => setTimeout(r, DEMO_TIMING.PARA1_MS));

          // 3. Stats (Performance Overview) only
          addMessage('assistant', { type: 'data', name: 'stats', data: {} });

          // STOP. Wait for user to focus input to trigger auto-type.
          isRunningRef.current = false;
          return;
        }

        if (userMsgCount === 2) {
          // --- Phase 2: Details ---
          // 1. Chart
          addMessage('assistant', { type: 'data', name: 'engagement-chart', data: { variant: 'engagement', theme: 'light' } });
          await new Promise(r => setTimeout(r, DEMO_TIMING.CHART_SKELETON_MS));

          // 2. Text Para 2
          addMessage('assistant', { type: 'text', text: RESP1_PARA2, shouldType: true });

          isRunningRef.current = false;
          return;
        }

        // --- Subsequent Interactions (Response 2) ---
        if (userMsgCount >= 3) {
          // Terminal
          addMessage('assistant', { type: 'data', name: 'terminal', data: { logs: RESP2_TERMINAL_LOGS } });
          await new Promise(r => setTimeout(r, DEMO_TIMING.TERMINAL_MS));

          // Text 1
          addMessage('assistant', { type: 'text', text: RESP2_PARA1, shouldType: true });
          await new Promise(r => setTimeout(r, DEMO_TIMING.PARA1_MS));

          // Carousel + Heatmap
          addMessage('assistant', { type: 'data', name: 'carousel', data: {} });
          await new Promise(r => setTimeout(r, 1000));
          addMessage('assistant', { type: 'data', name: 'strategy-heatmap', data: { variant: 'heatmap', theme: 'light' } });

          await new Promise(r => setTimeout(r, DEMO_TIMING.CHART_SKELETON_MS));
          addMessage('assistant', { type: 'text', text: RESP2_PARA2, shouldType: true });
        }

        isRunningRef.current = false;
      };
      runResponse();
    }
  }, [messages]);


  return (
    <div
      className={className}
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--chat-bg, #f9fafb)',
        overflow: 'hidden',
      }}
    >
      <ChatHeader onBack={onBack} />

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--size-section-pad-y-lg) 0',
          paddingBottom: 'var(--size-section-pad-y-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--size-element-gap-md, 10px)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '80%' : '90%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: msg.role === 'user'
                  ? '12px 16px'
                  : '0',
                background: msg.role === 'user'
                  ? 'var(--color-primary, #0472a8)'
                  : 'transparent',
                color: msg.role === 'user'
                  ? 'white'
                  : 'var(--chat-on-surface-muted, #6b7280)',
                borderRadius: '12px',
                borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                borderTopLeftRadius: msg.role === 'assistant' ? 4 : 12,
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-body1, 1rem)',
                lineHeight: '1.5',
                boxShadow: msg.role === 'user' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {msg.role === 'user' ? (
                <p style={{ margin: 0 }}>{msg.content[0].type === 'text' ? msg.content[0].text : ''}</p>
              ) : (
                <AssistantMessageContent parts={msg.content} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} style={{ height: '120px' }} />
      </div>

      <div className="chat-footer">
        <div className="chat-composer-area">
          <div className="composer-input-wrapper">
            <input
              placeholder="Type your response..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAutoTyping && handleSend()}
              onFocus={handleInputFocus}
              className="composer-input"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={`composer-send-btn ${input.trim() ? 'active' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
