import React from 'react';
import Button from '@/components/Button';
import './App.scss';

const App = () => {
    return (
        <main className="cynthia-starter-page">
            <section className="cynthia-starter-card">
                <h1 className="h3 cynthia-starter-title">
                    <i className="fa-solid fa-wand-magic-sparkles" />
                    Cynthia Playground Starter
                </h1>
                <p className="body1-txt cynthia-starter-description">
                    Your new prototype project is ready. Start by editing
                    <code> src/App.jsx </code>
                    and build with PLUS components and design tokens.
                </p>
                <div className="cynthia-starter-actions">
                    <Button text="Start Prototyping" style="primary" fill="filled" />
                    <Button text="Open Docs" style="secondary" fill="outline" />
                </div>
            </section>
        </main>
    );
};

export default App;
