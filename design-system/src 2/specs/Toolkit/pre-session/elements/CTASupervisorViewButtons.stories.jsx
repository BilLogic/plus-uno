import React from 'react';
import Button from '../../../../components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA Supervisor View Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },
};

export const CtaSupervisorViewButtons = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-lg)' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of CTA / Supervisor View buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Recruit / Fill In</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Recruit/Fill in" leadingVisual="user" style="primary" />
                {/* Note: 'user-plus' might not be in the icon map I saw earlier, checking map... 
                    Step 181 showed: 'plus', 'xmark', 'check', 'arrow-right', 'chevron-right', 'star', 'user', 'trash', 'upload'.
                    'user-plus' is NOT in the list. I will use 'user' for now or request icon addition if strictly needed. 
                    Actually, looking at the code in Step 181, icons are a manual map. 
                    If 'user-plus' isn't there, I should stick to available icons or just use 'user' and mention it.
                    Wait, I can see if I can add it, but I can't edit Button.jsx easily to add icons without knowing the icon system deep dive.
                    I'll use 'user' and note it. Or maybe 'plus'? Figma said "user-plus".
                    Let's use 'user' for now.
                */}
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Submit Review</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Submit review" style="primary" />
                <Button text="Submit review" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Edit Review</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Edit review" style="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: 'var(--size-card-gap-md)' }}>Cancel / Close</h6>
            <div style={{ display: 'flex', gap: 'var(--size-card-gap-md)', alignItems: 'center' }}>
                <Button text="Cancel" style="primary" fill="outline" />
                <Button text="Close" style="primary" fill="outline" />
            </div>
        </section>
    </div>
);
CtaSupervisorViewButtons.storyName = 'CTA (Supervisor View) Buttons';
