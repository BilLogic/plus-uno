# Marketplace Entry Example

A complete example entry for `src/pages/PrototypeMarket/prototypes-data.js`.

## Full Entry

```js
{
    id: '1026',
    title: 'Tutor Scheduling Calendar',
    description:
        'Interactive weekly calendar for tutors to manage session availability, view upcoming sessions, and handle schedule conflicts.',
    deploymentUrl: 'https://tutor-scheduling.netlify.app',
    notionCardUrl: 'https://www.notion.so/plus-team/tutor-scheduling-abc123',
    notionCardId: 'PLUS-67',
    stage: 'mid',
    lastUpdated: '2026-03-23',
    creators: ['Alex'],
    contributors: ['Alex', 'Bill'],
    productPillar: 'toolkit',
    localPath: '/1026',
    repoPath: 'playground/tutor-scheduling/',
},
```

## Minimal Entry (No Deployment)

```js
{
    id: '1027',
    title: 'Parent Communication Hub',
    description:
        'Dashboard for coordinators to track parent outreach, communication logs, and engagement metrics.',
    deploymentUrl: null,
    notionCardUrl: null,
    notionCardId: null,
    stage: 'low',
    lastUpdated: '2026-03-23',
    creators: ['Jordan'],
    contributors: ['Jordan'],
    productPillar: 'admin',
    localPath: null,
    repoPath: 'playground/parent-communication/',
},
```

## Notes

- `id` should be the next available number (check the last entry in the array)
- `lastUpdated` should be today's date in `YYYY-MM-DD` format
- `repoPath` must end with a trailing `/`
- `localPath` is null when the prototype is not yet wired into the root app's router
- `deploymentUrl` is null until the prototype is deployed to Netlify
