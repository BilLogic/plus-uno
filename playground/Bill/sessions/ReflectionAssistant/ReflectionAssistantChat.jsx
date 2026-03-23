import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QuestionFlow, ParameterSlider } from './ToolUI';

/**
 * TypewriterText - character by character reveal with cursor
 */
const TypewriterText = ({ text, speed = 15, onComplete }) => {
    const [displayed, setDisplayed] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);

    useEffect(() => {
        indexRef.current = 0;
        setDisplayed('');
        setIsComplete(false);

        let timeoutId;
        const tick = () => {
            if (indexRef.current < text.length) {
                setDisplayed(text.substring(0, indexRef.current + 1));
                indexRef.current++;
                timeoutId = setTimeout(tick, speed);
            } else {
                setIsComplete(true);
                onComplete?.();
            }
        };

        timeoutId = setTimeout(tick, speed);
        return () => clearTimeout(timeoutId);
    }, [text, speed]);

    return (
        <span>
            {displayed}
            {!isComplete && <span style={{ opacity: 0.6, marginLeft: 2 }}>|</span>}
        </span>
    );
};

const ChatHeader = ({ onBack }) => (
    <header style={{
        padding: '0 0 16px 0',
        borderBottom: '1px solid var(--chat-outline, #d1d5db)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'var(--chat-bg, #f9fafb)',
        width: '100%',
        zIndex: 10
    }}>
        {onBack && (
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--color-primary)'
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
        )}
        <h1 style={{
            margin: 0,
            fontSize: 'var(--font-size-h4, 18px)',
            fontWeight: 600,
            color: 'var(--chat-on-surface, #111827)',
            fontFamily: 'var(--font-family-header, Lato)'
        }}>
            Tutor Reflection Assistant
        </h1>
    </header>
);

const RESPONSE_LABEL_MAP = {
    'math-fluency': 'Mathematical Fluency',
    confidence: 'Solution Confidence',
    pacing: 'Workflow Pacing',
    'arlene-mccoy': 'Arlene McCoy',
    'marcus-chen': 'Marcus Chen',
    'sofia-rodriguez': 'Sofia Rodriguez',
    'morgan-reed': 'Morgan Reed',
    'taylor-brooks': 'Taylor Brooks',
    'casey-jordan': 'Casey Jordan',
    'jordan-avery': 'Jordan Avery',
    productive: 'Very Productive',
    okay: 'It was okay',
    challenging: 'Challenging'
};

const normalizeAnswerToText = (value) => {
    if (Array.isArray(value)) {
        return normalizeAnswerToText(value[0]);
    }
    if (value && typeof value === 'object') {
        return normalizeAnswerToText(Object.values(value)[0]);
    }
    return RESPONSE_LABEL_MAP[value] || value;
};

export function ReflectionAssistantChat({ onBack, initialPrompt = '' }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isAutoTyping, setIsAutoTyping] = useState(false); // For user simulation
    const messagesEndRef = useRef(null);
    const hasStartedRef = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, input]);

    // Simulated user typing effect
    const triggerAutoTyping = async (text) => {
        setIsAutoTyping(true);
        setInput('');

        let i = 0;
        // Promise wrapper for the typing loop
        await new Promise((resolve) => {
            const interval = setInterval(() => {
                setInput(text.substring(0, i + 1));
                i++;
                if (i === text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 20); // 20ms per char speed (150% faster)
        });

        // Small pause after typing before sending
        await new Promise(r => setTimeout(r, 400));
        handleSend(text);
        setInput('');
        setIsAutoTyping(false);
    };

    const addMessage = (role, content) => {
        setMessages(prev => [...prev, { role, content, id: Date.now() + Math.random() }]);
    };

    const [pendingAutoResponse, setPendingAutoResponse] = useState(null);

    const handleInputFocus = () => {
        if (pendingAutoResponse) {
            triggerAutoTyping(pendingAutoResponse);
            setPendingAutoResponse(null);
        }
    };

    const handleSend = async (text) => {
        const msgText = typeof text === 'string' ? text : input;
        if (!msgText.trim()) return;

        addMessage('user', { type: 'text', text: msgText });
        if (typeof text !== 'string') setInput('');

        setIsTyping(true);
        await new Promise(r => setTimeout(r, 1200));
        setIsTyping(false);

        // Logic for assistant responses
        // Handle student selection from initial question flow
        if (msgText.includes('Arlene McCoy') || msgText.includes('Marcus Chen') || msgText.includes('Sofia Rodriguez')) {
            const studentName = msgText.includes('Arlene McCoy') ? 'Arlene McCoy'
                : msgText.includes('Marcus Chen') ? 'Marcus Chen'
                    : 'Sofia Rodriguez';

            addMessage('assistant', {
                type: 'text',
                text: `Great choice! Let's reflect on your session with ${studentName}. How did it go today?`
            });
            await new Promise(r => setTimeout(r, 1000));
            addMessage('assistant', {
                type: 'widget',
                name: 'question-flow',
                data: {
                    id: 'session-reflection',
                    steps: [
                        {
                            id: 'session-feeling',
                            title: "How would you describe the session?",
                            description: `Think about your overall experience with ${studentName}`,
                            options: [
                                { id: 'productive', label: 'Very Productive', description: 'Made significant progress today' },
                                { id: 'okay', label: 'It was okay', description: 'Some progress, room for improvement' },
                                { id: 'challenging', label: 'Challenging', description: 'Struggled with some concepts' }
                            ]
                        }
                    ]
                }
            });
        } else if (
            msgText.toLowerCase().includes("arlene's progress") ||
            msgText.toLowerCase().includes("student progress") ||
            msgText.toLowerCase().includes("growth areas")
        ) {
            addMessage('assistant', {
                type: 'text',
                text: "To help you reflect deeply on Arlene McCoy's recent session, let's explore your perception of her growth areas. \n\nWhat standing feedback would you prioritize for her next session?"
            });
            await new Promise(r => setTimeout(r, 1000));
            addMessage('assistant', {
                type: 'widget',
                name: 'question-flow',
                data: {
                    id: 'arlene-feedback',
                    steps: [
                        {
                            id: 'focus',
                            title: "Select Priority Focus",
                            description: "Which area of Arlene's development needs the most attention right now?",
                            options: [
                                { id: 'math-fluency', label: 'Mathematical Fluency', description: 'Working on core arithmetic speed' },
                                { id: 'confidence', label: 'Solution Confidence', description: 'Explaining steps without hesitation' },
                                { id: 'pacing', label: 'Workflow Pacing', description: 'Moving through problems at a steady rate' }
                            ]
                        }
                    ]
                }
            });
        } else if (msgText.toLowerCase().includes("evaluate session pacing")) {
            addMessage('assistant', {
                type: 'text',
                text: "Understood. Pacing is crucial for maintaining momentum. Please evaluate Arlene's speed vs accuracy based on today's session."
            });
            await new Promise(r => setTimeout(r, 1000));
            addMessage('assistant', {
                type: 'widget',
                name: 'parameter-slider',
                data: {
                    id: 'pacing-pacing',
                    sliders: [
                        { id: 'momentum', label: 'Overall Momentum', min: 0, max: 10, value: 7, unit: '/10' },
                        { id: 'fluency', label: 'Solution Fluency', min: 0, max: 10, value: 6, unit: '/10' }
                    ]
                }
            });
        } else if (msgText.toLowerCase().startsWith("i would")) {
            // User sent their reflection - acknowledge and offer next student selection
            addMessage('assistant', {
                type: 'text',
                text: "That's a great insight! I've noted this reflection for Arlene. Would you like to reflect on another student from today's session?"
            });
            // Show student selection widget for next student
            addMessage('assistant', {
                type: 'widget',
                name: 'question-flow',
                data: {
                    id: 'next-student-selection',
                    steps: [{
                        id: 'next-student',
                        title: 'Select a student',
                        description: 'Choose who you want to reflect on next.',
                        options: [
                            { id: 'morgan-reed', label: 'Morgan Reed', description: 'Needs to set goals' },
                            { id: 'taylor-brooks', label: 'Taylor Brooks', description: 'On track' },
                            { id: 'casey-jordan', label: 'Casey Jordan', description: 'Needs content help' },
                            { id: 'jordan-avery', label: 'Jordan Avery', description: 'Needs challenge' }
                        ]
                    }]
                }
            });
        } else if (msgText.toLowerCase().includes("fluency") || msgText.toLowerCase().includes("confidence") || msgText.toLowerCase().includes("pacing")) {
            // User selected a focus area
            addMessage('assistant', {
                type: 'text',
                text: "If there's one thing you could share with other tutors about Arlene, what would it be?"
            });

            // Prepare auto-response but wait for user interaction to trigger it
            let autoResponse = "I noticed Arlene struggles with this.";
            if (msgText.toLowerCase().includes("fluency")) autoResponse = "I would tell other tutors to focus on drilling core arithmetic with her.";
            if (msgText.toLowerCase().includes("confidence")) autoResponse = "I would mention she needs encouragement to explain her steps aloud.";
            if (msgText.toLowerCase().includes("pacing")) autoResponse = "I would suggest timing her problem-solving to improve her pacing.";

            setPendingAutoResponse(autoResponse);

        } else if (msgText.toLowerCase().includes("finished reflection") || msgText.toLowerCase().includes("applied metrics")) {
            addMessage('assistant', {
                type: 'text',
                text: "Thank you for these insights. I've logged these reflections."
            });
        } else {
            addMessage('assistant', {
                type: 'text',
                text: "Let's explore your perception of her growth areas. What standing feedback would you prioritize for her next session?"
            });
            // Set up auto-response for demo - clicking input will trigger this
            setPendingAutoResponse("Let's focus on Arlene's growth areas for next session.");
        }
    };

    useEffect(() => {
        if (hasStartedRef.current) return;

        if (initialPrompt && messages.length === 0) {
            hasStartedRef.current = true;
            // Send initial prompt immediately as user message (no auto-typing) within the chat
            handleSend(initialPrompt);
        } else if (messages.length === 0) {
            hasStartedRef.current = true;
            // Show student selection widget on initial load
            addMessage('assistant', {
                type: 'text',
                text: "Hi! I'm your Reflection Assistant. Let's start by selecting the student you'd like to reflect on."
            });
            // Add student selection question flow
            // Longer delay for smoother progressive disclosure
            const timer = setTimeout(() => {
                addMessage('assistant', {
                    type: 'widget',
                    name: 'question-flow',
                    data: {
                        id: 'student-selection',
                        steps: [
                            {
                                id: 'select-student',
                                title: "Who are you reflecting on today?",
                                description: "Select a student from your recent sessions",
                                options: [
                                    { id: 'arlene-mccoy', label: 'Arlene McCoy', description: 'Last session: Today, 2:30 PM' },
                                    { id: 'marcus-chen', label: 'Marcus Chen', description: 'Last session: Today, 1:00 PM' },
                                    { id: 'sofia-rodriguez', label: 'Sofia Rodriguez', description: 'Last session: Yesterday, 4:15 PM' }
                                ]
                            }
                        ]
                    }
                });
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [initialPrompt]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#f9fafb',
            overflow: 'hidden'
        }}>
            <div style={{ padding: 0 }}>
                <ChatHeader onBack={onBack} />
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }} className="hide-scrollbar">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: msg.content.type === 'widget' ? '95%' : '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}
                    >
                        {msg.content.type === 'text' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    background: msg.role === 'user' ? 'var(--color-primary, #0472a8)' : 'white',
                                    color: msg.role === 'user' ? 'white' : 'var(--chat-on-surface, #111)',
                                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                    fontSize: '15px',
                                    lineHeight: '1.5',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    border: msg.role === 'assistant' ? '1px solid var(--chat-outline, #e5e7eb)' : 'none',
                                    whiteSpace: 'pre-line'
                                }}
                            >
                                {msg.role === 'assistant' ? (
                                    <TypewriterText text={msg.content.text} speed={8} />
                                ) : (
                                    <span>{msg.content.text}</span>
                                )}
                            </motion.div>
                        ) : (
                            <div style={{ width: '100%' }}>
                                {msg.content.name === 'question-flow' && (
                                    <QuestionFlow
                                        {...msg.content.data}
                                        onComplete={(answers) => {
                                            handleSend(normalizeAnswerToText(answers));
                                        }}
                                        onSelect={(selectedIds) => {
                                            handleSend(normalizeAnswerToText(selectedIds));
                                        }}
                                    />
                                )}
                                {msg.content.name === 'parameter-slider' && (
                                    <ParameterSlider
                                        {...msg.content.data}
                                        onResponseAction={(id) => id === 'apply' && triggerAutoTyping("I've evaluated the session pacing.")}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af' }} />
                            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af' }} />
                            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} style={{ height: 20 }} />
            </div>

            <div style={{ padding: '20px', background: 'white', borderTop: '1px solid #e5e7eb' }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    background: '#f3f4f6',
                    padding: '8px 12px',
                    borderRadius: '24px',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onFocus={handleInputFocus}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            color: '#111'
                        }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim()}
                        style={{
                            background: input.trim() ? 'var(--color-primary, #0472a8)' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
