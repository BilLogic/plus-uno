import { useState, useEffect } from 'react';

/**
 * TypingText component - types out text character by character
 * @param text - The full text to type out
 * @param speed - Typing speed in ms per character (default: 20ms)
 * @param onComplete - Callback when typing is complete
 */
export function TypingText({
    text,
    speed = 20,
    onComplete
}: {
    text: string;
    speed?: number;
    onComplete?: () => void;
}) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let currentIndex = 0;
        setDisplayedText('');
        setIsComplete(false);

        const interval = setInterval(() => {
            if (currentIndex < text.length) {
                setDisplayedText(text.substring(0, currentIndex + 1));
                currentIndex++;
            } else {
                clearInterval(interval);
                setIsComplete(true);
                if (onComplete) {
                    onComplete();
                }
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, onComplete]);

    return (
        <span>
            {displayedText}
            {!isComplete && <span className="typing-cursor" style={{ opacity: 0.5 }}>|</span>}
        </span>
    );
}
