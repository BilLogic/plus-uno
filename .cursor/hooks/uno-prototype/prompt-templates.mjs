import { TOOL_LINKS } from './constants.mjs';

/**
 * @param {Record<string, unknown>} context
 * @returns {string}
 */
export function buildChallengePrompt(context) {
  const challenge = context.challenge || '(not provided)';
  const useV0 = context.challengeTool === 'v0_google_ai_studio';

  const toolSection = useV0
    ? [
        '## Recommended tools',
        `- v0: ${TOOL_LINKS.v0}`,
        `- Google AI Studio: ${TOOL_LINKS.googleAiStudio}`,
      ]
    : [
        '## Recommended tools',
        `- Claude Design: ${TOOL_LINKS.claudeDesign}`,
        `- FigJam Make: ${TOOL_LINKS.figjamMake}`,
        `- Stitch: ${TOOL_LINKS.stitch}`,
      ];

  return [
    '# Challenge / Ideation prompt-spec',
    '',
    '## Challenge',
    challenge,
    '',
    ...toolSection,
    '',
    '## Prompt to paste into your chosen tool',
    '```',
    `You are helping me explore and validate a product challenge for PLUS tutoring platform.`,
    ``,
    `Challenge:`,
    challenge,
    ``,
    `Produce an interactive exploration that helps us test assumptions, compare directions, and identify what needs proving before we commit to a hi-fi build.`,
    `Include: problem framing, 2-3 divergent directions, key risks, and what evidence would de-risk each direction.`,
    `Do not invent production requirements beyond what is stated above.`,
    '```',
    '',
    'The coding agent does not generate this artifact. Carry the prompt above to an external tool.',
  ].join('\n');
}

/**
 * @returns {string}
 */
export function buildFlowVarietyPrompt() {
  return [
    '# Flow Variety prompt-spec',
    '',
    '## Recommended tool',
    `- Stitch: ${TOOL_LINKS.stitch}`,
    '',
    '## Prompt to paste into Stitch',
    '```',
    `Generate multiple flow-structure variants for the same user goal.`,
    `Show 3-5 distinct flow shapes (happy path + at least one edge case each).`,
    `Label each variant with the assumption it optimizes for.`,
    `Keep copy placeholder-level; focus on structure and decision points.`,
    '```',
    '',
    'The coding agent does not generate the flows. Carry the prompt above to Stitch.',
  ].join('\n');
}

/**
 * @param {Record<string, unknown>} context
 * @returns {string}
 */
export function buildInvokeBriefing(context) {
  const lines = [
    '# uno-prototype workflow briefing',
    '',
    'This briefing was collected by the uno-prototype conversation hook.',
    'Read this file before executing the prototype build.',
    '',
    '## Collected inputs',
  ];

  for (const [key, value] of Object.entries(context)) {
    if (key === 'confirmFields' || key === 'fieldIndex') continue;
    if (value === undefined || value === null || value === '') continue;
    lines.push(`- **${key}**: ${String(value)}`);
  }

  lines.push('', '## Agent instructions', '- Follow `skills/uno-prototype` and `skills/uno-prototype/references/method.md`.', '- Ground against uno-blueprint before building.', '- Use PLUS design system components and tokens only.', '');

  if (context.branch === 'high_fidelity') {
    lines.push('## Branch', 'High-fidelity prototype build in `playground/`.');
  } else if (context.branch === 'user_flow') {
    lines.push('## Branch', 'Prototype user flow and supporting system inside FigJam.');
  } else if (context.branch === 'data_flow') {
    lines.push('## Branch', 'Generate data flow diagram inside FigJam.');
  }

  return lines.join('\n');
}
