/**
 * Smart Navigation Engine for Storybook 10.2.8 AI Agent
 * 
 * Capability:
 * - Dynamically extracts story index from Storybook internals
 * - Fuzzy matching with typo tolerance and ranking
 * - Navigation intent detection
 */

/* ─── 1. DYNAMIC INDEX EXTRACTION ─── */
export async function extractStoryIndex() {
    let rawStories = {};

    // Method 1: Fetch generated index (most robust for Storybook 8+)
    try {
        const resp = await fetch('index.json');
        if (resp.ok) {
            const data = await resp.json();
            rawStories = data.entries || {};
        }
    } catch (e) { /* ignore */ }

    // Method 2: Fetch stories.json (legacy)
    if (Object.keys(rawStories).length === 0) {
        try {
            const resp = await fetch('stories.json');
            if (resp.ok) {
                const data = await resp.json();
                rawStories = data.stories || {};
            }
        } catch (e) { /* ignore */ }
    }

    // Method 3: Internal API Fallback (Deprecated but works for older versions)
    if (Object.keys(rawStories).length === 0) {
        try {
            if (window.__STORYBOOK_PREVIEW__?.storyStore?.getStoriesJsonData) {
                const data = window.__STORYBOOK_PREVIEW__.storyStore.getStoriesJsonData();
                rawStories = data.stories || {};
            } else if (window.__STORYBOOK_CLIENT_API__?.raw) {
                const stories = window.__STORYBOOK_CLIENT_API__.raw();
                if (Array.isArray(stories)) stories.forEach(s => rawStories[s.id] = s);
            } else if (window.__STORYBOOK_PREVIEW__?.storyStore?.raw) {
                const stories = window.__STORYBOOK_PREVIEW__.storyStore.raw();
                if (Array.isArray(stories)) stories.forEach(s => rawStories[s.id] = s);
            }
        } catch (e) {
            console.warn('Smart Navigation: Failed to extract stories internally', e);
        }
    }

    const index = Object.values(rawStories).map(story => {
        // Construct searchable text
        // "title": "Components/Button", "name": "Primary"
        // "importPath": "./src/components/Button/Button.stories.tsx"

        const title = story.title || '';
        const name = story.name || '';
        const category = title.split('/')[0] || 'Other';
        const component = title.split('/').pop() || '';

        const fullPath = `${title}/${name}`;

        // Normalize terms for searching
        const terms = [
            title,
            name,
            component,
            // "Components/Button" -> "button"
            ...title.split('/').filter(p => p !== 'Components' && p !== 'Specs'),
            // "Tutor Training Progress Page" -> "training progress"
            ...name.split(' ')
        ].map(t => normalizeInput(t)).filter(Boolean);

        return {
            id: story.id,
            storyId: story.id, // Alias for compatibility with NavMatchList
            title,
            name,
            category,
            label: `${component}: ${name}`, // e.g., "Button: Primary"
            fullPath,
            searchableText: normalizeInput(`${title} ${name}`),
            terms: [...new Set(terms)] // unique terms
        };
    });

    console.log(`Smart Navigation: Indexed ${index.length} stories.`);
    return index;
}

/* ─── 2. INPUT NORMALIZATION ─── */
export function normalizeInput(text) {
    if (!text) return '';
    return text
        .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
        .toLowerCase()
        .replace(/['"]/g, '') // remove quotes
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ') // replace punctuation with space
        .replace(/\s+/g, ' ') // collapse whitespace
        .trim();
}

/* ─── 3. FUZZY MATCHING LOGIC ─── */

/* Levenshtein distance for typo tolerance */
function levenshtein(a, b) {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = [];
    for (let i = 0; i <= bn; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= an; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= bn; i++) {
        for (let j = 1; j <= an; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[bn][an];
}

/* Singular/Plural normalizer (basic English) */
function getVariations(word) {
    const vars = [word];
    if (word.endsWith('s') && !word.endsWith('ss')) vars.push(word.slice(0, -1)); // buttons -> button
    else vars.push(word + 's'); // button -> buttons
    return vars;
}

/**
 * Find best matches for a query in the story index.
 * Returns sorted array of matches { entry, score }.
 */
export function findBestMatch(query, index) {
    const q = normalizeInput(query);
    if (!q) return [];

    // Split query into words for keyword matching
    const qWords = q.split(' ').filter(w => w.length > 2); // ignore short words like "to", "in"

    const scored = index.map(entry => {
        let score = 0;
        const text = entry.searchableText;
        const entryTerms = entry.terms;

        const vars = getVariations(q);
        const titleComp = normalizeInput(entry.title.split('/').pop());

        // 1. Exact Name/Title Match (Highest Priority)
        if (vars.includes(text)) score += 100;
        else if (vars.includes(normalizeInput(entry.name))) score += 95;
        else if (vars.includes(titleComp)) score += 90;

        // 2. Full Phrase Match (Substring)
        // "training progress" in "Tutor Training Progress Page"
        else if (text.includes(q)) score += 80;

        // 3. Keyword Overlap
        let wordMatches = 0;
        for (const qw of qWords) {
            const vars = getVariations(qw);
            // Check if any variation of the query word exists in entry terms
            const termMatch = entryTerms.some(term =>
                vars.some(v => term.includes(v) || levenshtein(term, v) <= 1)
            );
            if (termMatch) wordMatches++;
        }

        if (wordMatches > 0) {
            score += (wordMatches / qWords.length) * 60; // Up to 60 points for 100% overlap
        }

        // 4. Typo Tolerance on core terms (if no exact matches)
        if (score < 50 && qWords.length === 1) {
            const qw = qWords[0];
            const vars = getVariations(qw);
            const bestDist = Math.min(...entryTerms.map(t => {
                return Math.min(...vars.map(v => levenshtein(t, v)));
            }));

            if (bestDist <= 2) score += 60 - (bestDist * 10); // 60 for 0 (covered), 50 for 1, 40 for 2
        }

        // Boost for "Overview" stories if query is generic (e.g. "Button" -> Button/Overview)
        if (entry.name.toLowerCase() === 'overview' || entry.name.toLowerCase() === 'docs') {
            score += 5;
        }

        return { entry, score };
    });

    return scored.filter(s => s.score > 40).sort((a, b) => b.score - a.score);
}
