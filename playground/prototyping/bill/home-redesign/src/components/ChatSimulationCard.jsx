import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import './ChatSimulationCard.scss';

// --- Components ---

const VideoThumbnail = ({ coverImage }) => (
    <div className="simulation-video-thumbnail" style={{ backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="video-overlay">
            <div className="play-icon">▶</div>
        </div>
        <div className="video-caption">Scenario: Student struggling with Math</div>
    </div>
);

const SelectionOptions = ({ options, onSelect }) => (
    <div className="selection-options-container">
        <p className="selection-prompt">Choose your strategy:</p>
        <div className="selection-grid">
            {options.map((opt, i) => (
                <button key={i} className="selection-option-btn" onClick={() => onSelect(opt)}>
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const FeedbackMessage = ({ content }) => (
    <div className="ai-feedback-message">
        <div className="feedback-header">
            <span className="feedback-icon">✨</span>
            <span className="feedback-title">Analysis & Guidance</span>
        </div>
        <div className="feedback-body">
            <p><strong>Articulation Notes:</strong> {content.articulation}</p>
            <div className="feedback-guidance">
                {content.guidance}
            </div>
        </div>
    </div>
);

const AutoTypeComposer = ({ onSend, disabled, isTyping, placeholder = "Type your response..." }) => {
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef(null);
    const targetText = "I understand you're frustrated, but I can see you worked really hard on this. Let's look at what you did right and build from there.";

    useEffect(() => {
        if (!isTyping) {
            setInputValue("");
            return;
        }

        // Auto-type effect
        let i = 0;
        const interval = setInterval(() => {
            setInputValue(targetText.substring(0, i + 1));
            i++;
            // Auto-scroll input to the end
            if (inputRef.current) {
                inputRef.current.scrollLeft = inputRef.current.scrollWidth;
            }
            if (i === targetText.length) {
                clearInterval(interval);
                // Auto-send after typing completes
                setTimeout(() => {
                    onSend(targetText);
                }, 800);
            }
        }, 33); // Typing speed (150% faster)
        return () => clearInterval(interval);
    }, [isTyping, onSend]);

    return (
        <div className="chat-footer">
            <div className="chat-composer-area">
                <div className="composer-input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={inputValue}
                        readOnly
                        className="composer-input"
                        disabled={disabled && !isTyping}
                    />
                </div>
                <button
                    className={`composer-send-btn ${inputValue.length > 5 ? 'active' : ''}`}
                    onClick={() => onSend(inputValue)}
                    disabled={!isTyping || inputValue.length < 5}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    );
};

// --- Main Component ---

const ChatSimulationCard = ({ onClose, onComplete, coverImage }) => {
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('intro'); // intro, selection, typing, feedback
    const [isTyping, setIsTyping] = useState(false);
    const viewportRef = useRef(null);
    const bottomRef = useRef(null);

    // Initial Script
    useEffect(() => {
        let mounted = true;
        const runScript = async () => {
            // 1. Intro Text (slowed down for demo)
            await new Promise(r => setTimeout(r, 800));
            if (!mounted) return;
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Here is the scenario. Watch the video and decide how to respond.' }]);

            // 2. Video (slowed down for demo)
            await new Promise(r => setTimeout(r, 900));
            if (!mounted) return;
            // Using a distinct type for custom rendering
            setMessages(prev => [...prev, { role: 'assistant', type: 'video' }]);

            // 3. Student Dialogue (slowed down for demo)
            await new Promise(r => setTimeout(r, 900));
            if (!mounted) return;
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'Student: "I tried really hard on this test, but I still got a D. I guess I\'m just not good at math."' }]);

            // 4. Selection Prompt (slowed down for demo)
            await new Promise(r => setTimeout(r, 1200));
            if (!mounted) return;
            setStep('selection');
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: 'How would you respond to this student?' }]);
        };
        runScript();
        return () => { mounted = false; };
    }, []);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, step]);

    const handleSelection = (option) => {
        setMessages(prev => [...prev, { role: 'user', type: 'text', content: option.label }]);
        setStep('transition_to_typing');

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', type: 'text', content: "That's a good approach. Now, try articulating that in your own words." }]);
            setStep('typing');
        }, 1200);
    };

    const handleStartTyping = () => {
        if (step === 'typing') {
            setIsTyping(true);
        }
    };

    const handleUserSend = (text) => {
        setMessages(prev => [...prev, { role: 'user', type: 'text', content: text }]);
        setIsTyping(false);
        setStep('done');

        // Trigger AI Feedback (slowed down for demo)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                type: 'feedback',
                content: {
                    articulation: "Validating the effort first builds safety. You avoided dismissing their feelings while still offering a path forward.",
                    guidance: "Next time, follow up with a specific question: 'Which part felt truest to you?'"
                }
            }]);
        }, 1500);
    };

    return (
        <motion.div
            className="chat-simulation-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="chat-header">
                <h2>Supporting a Growth Mindset</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="chat-viewport">
                <div className="thread-viewport" ref={viewportRef}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            className={`message-bubble ${msg.role}-message ${msg.type === 'feedback' ? 'feedback-bubble' : ''}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {msg.type === 'video' ? (
                                <VideoThumbnail coverImage={coverImage} />
                            ) : msg.type === 'feedback' ? (
                                <FeedbackMessage content={msg.content} />
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </motion.div>
                    ))}

                    {step === 'selection' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <SelectionOptions
                                options={[
                                    { id: '1', label: "Validate their effort" },
                                    { id: '2', label: "Correct their mistake" },
                                    { id: '3', label: "Offer immediate help" }
                                ]}
                                onSelect={handleSelection}
                            />
                        </motion.div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            <div onClick={handleStartTyping}>
                <AutoTypeComposer
                    onSend={handleUserSend}
                    disabled={step !== 'typing'}
                    isTyping={isTyping}
                    placeholder={step === 'typing' ? "Click to respond..." : "Select an option first..."}
                />
            </div>
        </motion.div>
    );
};

export default ChatSimulationCard;
