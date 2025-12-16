import React from 'react';
import Logo from './Logo/Logo';

export default {
    title: 'Assets/Logo',
    component: Logo,
    tags: ['autodocs'],
};

export const AllVariants = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {['colored', 'filled', 'outlined'].map(style => (
            <div key={style}>
                <h3 className="h3" style={{ marginBottom: '20px', textTransform: 'capitalize' }}>{style} Style</h3>
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    padding: '20px',
                    backgroundColor: style === 'colored' ? 'white' : '#1a1c1e',
                    borderRadius: '8px'
                }}>
                    {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <Logo style={style} size={size} />
                            <span className="body3-txt" style={{ color: style === 'colored' ? 'black' : 'white' }}>{size}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export const WithText = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {['colored', 'filled', 'outlined'].map(style => (
            <div key={style}>
                <h3 className="h3" style={{ marginBottom: '20px', textTransform: 'capitalize' }}>{style} Style (Text)</h3>
                <div style={{
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    padding: '20px',
                    backgroundColor: style === 'colored' ? 'white' : '#1a1c1e',
                    borderRadius: '8px'
                }}>
                    {['XS', 'S', 'M'].map(size => (
                        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                            <Logo style={style} size={size} text={true} />
                            <span className="body3-txt" style={{ color: style === 'colored' ? 'black' : 'white' }}>{size}</span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);
