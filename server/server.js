require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ── Navigation intent parser prompt ── */
const NAVIGATION_SYSTEM_PROMPT = `You are a navigation intent parser for a Storybook design system.

Return JSON only in this exact format:
{
  "intent": "navigate" | "unknown",
  "target": "string"
}

RULES:
1. Do NOT hallucinate URLs or paths
2. Do NOT explain or add commentary
3. Do NOT include any text outside the JSON
4. Only extract the most likely component/page/folder name from user input
5. Keep target concise (1-3 words maximum)
6. If the user wants to navigate OR is asking WHERE something is, return intent: "navigate"
7. If unclear or not navigation-related, return intent: "unknown"
8. "Where are the X" or "Where is X" queries are ALWAYS navigation intent

EXAMPLES:
User: "go to button" → {"intent": "navigate", "target": "button"}
User: "show me modal" → {"intent": "navigate", "target": "modal"}
User: "open training progress page" → {"intent": "navigate", "target": "training progress"}
User: "where are the SidebarTab" → {"intent": "navigate", "target": "SidebarTab"}
User: "where is the Progress" → {"intent": "navigate", "target": "Progress"}
User: "where are the cards" → {"intent": "navigate", "target": "cards"}
User: "what is a button?" → {"intent": "unknown", "target": ""}
User: "navigate to tutor performance" → {"intent": "navigate", "target": "tutor performance"}
User: "colors" → {"intent": "navigate", "target": "colors"}
User: "icons" → {"intent": "navigate", "target": "icons"}
User: "button" → {"intent": "navigate", "target": "button"}
User: "Progress" → {"intent": "navigate", "target": "Progress"}
User: "SidebarTab" → {"intent": "navigate", "target": "SidebarTab"}
`;

/* ── General AI prompt for component usage & screen explain ── */
const GENERAL_SYSTEM_PROMPT = `You are an expert design system AI assistant for the PLUS ONE design system, built on React Bootstrap.

The PLUS ONE design system includes all standard Bootstrap components plus custom PLUS-specific components:
Modal, Card, Button, Badge, Alert, Accordion, Breadcrumb, Dropdown, NavTabs, Pagination, Progress, Tooltip,
Popover, ListGroup, Spinner, Form, Input, Table, Tabs, Offcanvas, Toast, Collapse, Carousel, ButtonGroup,
OverviewCard, TutorsTrainingProgressTable, ExportSearchFilterBar, SidebarTab, NavBar, and more.

You help designers and developers understand:
- When and how to use each component
- Tradeoffs between similar components
- Design system best practices
- How to interpret and explain screens/pages

Always respond in valid JSON matching the feature type requested. Do NOT add any text outside the JSON.

For "component_usage" feature, return:
{
  "intent": "component_usage",
  "components": ["ComponentName1" OR "ComponentA vs ComponentB"],
  "purpose": "Clear 1-2 sentence purpose",
  "when_to_use": ["Specific use case 1", "Specific use case 2", "Specific use case 3"],
  "when_not_to_use": ["Avoid when case 1", "Avoid when case 2"],
  "variants": ["Variant or style option 1", "Variant or style option 2"],
  "tip": "One practical design tip or accessibility note"
}

For "screen_explain" feature, return:
{
  "intent": "screen_explain",
  "screen_name": "Human-readable screen name",
  "purpose": "What this screen is for in 1-2 sentences",
  "structure": ["Top section description", "Middle section description", "Bottom section description"],
  "components_used": ["Button", "Table", "Badge", "NavTabs", "Pagination"]
}

IMPORTANT: Even if you don't know the exact PLUS ONE variant, provide your best design-system guidance based on React Bootstrap conventions. Never return an error, always return a helpful JSON response.
`;


/* ── Main AI endpoint ── */
app.post('/api/ai', async (req, res) => {
    const { feature, userInput, context } = req.body;
    console.log(`[AI Request] Feature: ${feature} | Input: "${userInput}"`);

    if (!feature || !userInput) {
        return res.status(400).json({ error: 'Missing required fields: feature, userInput' });
    }

    try {
        const isNavigation = feature === 'smart_navigation';
        const systemPrompt = isNavigation ? NAVIGATION_SYSTEM_PROMPT : GENERAL_SYSTEM_PROMPT;
        const userMessage = isNavigation
            ? userInput
            : `Feature: ${feature}\nContext: ${JSON.stringify(context)}\nUser Input: ${userInput}`;

        console.log(`[AI] Using ${isNavigation ? 'NAVIGATION' : 'GENERAL'} prompt`);

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.2,
            max_tokens: isNavigation ? 200 : 800,
            response_format: { type: 'json_object' }
        });

        const content = JSON.parse(response.choices[0].message.content);
        console.log('[AI Response]:', content);

        if (!content.intent) {
            return res.status(500).json({ error: 'Invalid AI response: missing intent field' });
        }

        res.json(content);
    } catch (error) {
        console.error('OpenAI API Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch AI response', details: error.message });
    }
});

/* ── Health check ── */
app.get('/health', (req, res) => res.json({ status: 'ok', model: 'gpt-4o-mini' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`AI Server running at http://0.0.0.0:${PORT}`));
