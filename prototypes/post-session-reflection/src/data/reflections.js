/**
 * In-memory sample data for the post-session reflection prototype.
 */

export const REFLECTIONS = [
    {
        id: 'ref-001',
        date: 'Tue, Jul 29',
        timeRange: '12:30 PM - 1:30 PM',
        school: 'Hogwarts',
        teacher: 'Mr. Snape',
        status: 'incomplete',
        students: [
            { id: 'kiera', name: 'Kiera Wintervale', status: 'incomplete' },
            { id: 'baxter', name: 'Baxter Ellington', status: 'incomplete' },
            { id: 'milo', name: 'Milo Thorne', status: 'incomplete' },
        ],
    },
    {
        id: 'ref-002',
        date: 'Mon, Jul 28',
        timeRange: '10:00 AM - 11:00 AM',
        school: 'Lincoln High',
        teacher: 'Ms. Rivera',
        status: 'incomplete',
        students: [
            { id: 'ava', name: 'Ava Chen', status: 'incomplete' },
            { id: 'noah', name: 'Noah Patel', status: 'incomplete' },
        ],
    },
    {
        id: 'ref-003',
        date: 'Fri, Jul 25',
        timeRange: '2:00 PM - 3:00 PM',
        school: 'Hogwarts',
        teacher: 'Mr. Snape',
        status: 'completed',
        students: [
            { id: 'luna', name: 'Luna Park', status: 'complete' },
        ],
    },
];
