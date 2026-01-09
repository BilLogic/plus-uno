import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/CTA (Tutor View) Buttons',
    component: Button,
    parameters: {
        layout: 'padded',
    },

};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <p className="plus-body-2" style={{ color: 'var(--color-neutral-text)' }}>
            Overview of CTA (Tutor View) buttons.
        </p>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sign Up / Fill In</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button text="Sign up" leadingVisual="user" style="primary" />
                <Button text="Sign up" leadingVisual="user" style="primary" disabled />
                <Button text="Fill in for this session" leadingVisual="user" style="primary" />
                <Button text="Sign up for recurring session" leadingVisual="user" style="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Session Lists</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="See sessions open to fill-in" style="primary" fill="outline" />
                <Button text="See sessions open for sign-up" style="primary" fill="outline" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Navigation / Actions</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Button text="Close" style="primary" fill="outline" />
                {/* Request Call-off appears red/danger in design. Using style='danger' */}
                <Button text="Request Call-off" style="danger" fill="outline" />
                <Button text="Cancel" style="primary" fill="outline" />
                <Button text="Back" style="primary" fill="outline" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Session Actions</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Join session (video icon) */}
                <Button text="Join session" leadingVisual="video" style="primary" />
                {/* Session cancelled (disabled state) */}
                <Button text="Session cancelled" leadingVisual="user" style="primary" disabled />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Requests</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Submit Request - Goldish color. Trying 'warning' or standard primary if warning isn't right. 
                    Design shows a dark yellow/gold. 'warning' is usually acceptable for this. */}
                <Button text="Submit Request" style="warning" />
                <Button text="Submit Request" style="warning" disabled />
                <Button text="View Pending Request" style="primary" />
            </div>
        </section>

        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Schedule & Withdrawal</h6>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Live/Green dot usually implies 'success' or specific visual. 
                     Using 'success' style for now, or just primary if simple. 
                     Figma shows teal/blue background for 'View Updated Schedule'. */}
                <Button text="View Updated Schedule" style="primary" />

                {/* Withdraw Request - outline red */}
                <Button text="Withdraw Request" style="danger" fill="outline" />
                <Button text="Confirm Withdrawal" style="danger" fill="outline" />
            </div>
        </section>
    </div>
);
