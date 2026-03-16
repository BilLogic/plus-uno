export function AdminSkeletons() {
    return (
        <div className="admin-skeleton-root" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            {/* Top Section: Breadcrumb-like title skeleton */}
            <div style={{ padding: '0 0 8px 0' }}>
                <div className="plus-skeleton-block" style={{ width: '240px', height: '32px' }} />
            </div>

            {/* Grid of cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '24px'
            }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="plus-skeleton-block" style={{ height: '360px', borderRadius: '16px' }} />
                ))}
            </div>

            {/* Table-like section below */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="plus-skeleton-block" style={{ width: '180px', height: '24px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="plus-skeleton-block" style={{ width: '100%', height: '48px' }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
