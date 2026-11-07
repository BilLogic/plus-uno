/**
 * Research Assistant chat container using manual state management.
 * Replicates the "Homepage" pattern of fake chat simulation to avoid runtime errors.
 */
import React, { useState, useEffect, useRef } from 'react';
// @ts-expect-error -- the design system is plain JSX, resolved by the Vite alias.
import { AiMessage, PromptInput } from '@/components';
// @ts-expect-error -- same.
import { AI_CHAT_DISCLAIMER as DISCLAIMER } from '@/patterns';
import { AssistantMessageContent } from './components/AssistantMessageContent';
import { ChatHeader } from './components/ChatHeader';
import './ResearchAssistantChat.css';


type Turn =
  | { role: 'user'; text: string }
  | { role: 'assistant'; parts: MessagePart[] };

/**
 * The script adds an answer one part at a time; consecutive assistant parts
 * are one answer, so they draw as one AiMessage with one AI icon.
 */
const toTurns = (messages: Message[]): Turn[] => messages.reduce<Turn[]>((turns, msg) => {
  const last = turns[turns.length - 1];
  if (msg.role === 'assistant' && last?.role === 'assistant') {
    last.parts = [...last.parts, ...msg.content];
    return turns;
  }
  if (msg.role === 'assistant') return [...turns, { role: 'assistant', parts: [...msg.content] }];
  const first = msg.content[0];
  return [...turns, { role: 'user', text: first?.type === 'text' ? first.text : '' }];
}, []);

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
        }, 200);
      }
    }, 14); // per-char auto-typing speed (shared consistent pace)
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
        background: 'var(--ds-surface)',
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
          gap: 'var(--stack-md)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {toTurns(messages).map((turn, i) => (
          turn.role === 'user' ? (
            <div key={i} className="research-chat-user-turn">
              <p>{turn.text}</p>
            </div>
          ) : (
            <AiMessage
              key={i}
              className="research-chat-ai-turn"
              // Text parts type out as they arrive; charts, tools and stats draw through renderPart.
              typeOut={turn.parts.some((part) => part.type === 'text' && part.shouldType)}
              parts={turn.parts}
              renderPart={(part: MessagePart) => <AssistantMessageContent parts={[part]} />}
              onFeedback={() => {}}
            />
          )
        ))}
        <div ref={messagesEndRef} className="research-chat-end" />
      </div>

      {/* Focus bubbles up from the prompt, so the footer hears it. */}
      <div className="chat-footer" onFocus={handleInputFocus}>
        <PromptInput
          label="Message to AI"
          placeholder="Type your response..."
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
          onSubmit={(text: string) => {
            if (isAutoTyping || !text.trim()) return;
            addMessage('user', { type: 'text', text });
            setInput('');
          }}
        />
        <p className="research-chat-disclaimer">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
