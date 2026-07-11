/**
 * Extract workflow hints from PRD text for verification-style intake questions.
 * Never used to skip a step — only to rephrase the current step.
 */

/**
 * @param {string} text
 * @returns {Record<string, unknown>}
 */
export function extractPrdHints(text) {
  if (!text || typeof text !== 'string') return {};

  const lower = text.toLowerCase();
  const figmaLinks = [...text.matchAll(/https?:\/\/[^\s)\]>]*figma\.com[^\s)\]>]*/gi)].map((m) => m[0]);

  return {
    mentionsHighFidelity:
      /high[- ]fi(delity)?|hi[- ]fi|high fidelity|high-fidelity/.test(lower) ||
      /deliverable[s]?:[^\n]*high/i.test(text),
    mentionsMidFidelity:
      /mid[- ]fi(delity)?|medium fidelity|validate|interactive draft|prove it works/.test(lower),
    mentionsLowFidelity:
      /low[- ]fi(delity)?|sketch the flow|flow sketch|wireframe|figjam|user flow map|data flow map/.test(lower),
    mentionsFigma: /figma\.com/i.test(text) || figmaLinks.length > 0,
    mentionsFigJam: /figma\.com\/(board|figjam)/i.test(text),
    figmaLinks,
    mentionsUserFlow: /user flow/.test(lower),
    mentionsDataFlow: /data flow/.test(lower),
    mentionsFlowVariety: /flow variety|ideate.{0,20}flow/.test(lower),
  };
}

/**
 * @param {Record<string, unknown>} hints
 * @returns {{ question: string; options: string[]; inferred: string } | null}
 */
export function buildFidelityVerification(hints) {
  if (!hints || typeof hints !== 'object') return null;

  if (hints.mentionsHighFidelity) {
    return {
      question:
        'I see your PRD indicates the deliverable should be high-fidelity. Do you want me to generate a high-fi prototype?',
      options: ['Yes, generate high-fi', 'No, generate a different fidelity'],
      inferred: 'High-fidelity prototype',
    };
  }

  if (hints.mentionsMidFidelity) {
    return {
      question:
        'I see your PRD points toward mid-fidelity validation. Do you want me to prepare a mid-fi prompt-spec for external tools?',
      options: ['Yes, use mid-fi', 'No, generate a different fidelity'],
      inferred: 'Challenge / Ideation',
    };
  }

  if (hints.mentionsUserFlow) {
    return {
      question:
        'I see your PRD focuses on user flows. Do you want me to prototype the user flow in FigJam?',
      options: ['Yes, prototype user flow', 'No, generate a different fidelity'],
      inferred: 'User Flow',
    };
  }

  if (hints.mentionsDataFlow) {
    return {
      question:
        'I see your PRD focuses on data flow. Do you want me to map the data flow in FigJam?',
      options: ['Yes, map data flow', 'No, generate a different fidelity'],
      inferred: 'Data Flow',
    };
  }

  if (hints.mentionsLowFidelity || hints.mentionsFlowVariety) {
    return {
      question:
        'I see your PRD points toward low-fidelity flow exploration. Do you want me to engineer a flow-variety prompt for Stitch?',
      options: ['Yes, use flow variety', 'No, generate a different fidelity'],
      inferred: 'Flow Variety',
    };
  }

  return null;
}

/**
 * @param {string} value
 * @returns {{ next: string; patch: Record<string, unknown> } | null}
 */
export function mapFidelityOtherAnswer(value) {
  const lower = value.toLowerCase();

  if (/high|hi[- ]fi/.test(lower)) {
    return { next: 'hi_figma_check', patch: { fidelity: 'High-fidelity prototype', branch: 'high_fidelity' } };
  }
  if (/mid|validate|ideation|challenge/.test(lower)) {
    return { next: 'challenge_question', patch: { fidelity: 'Challenge / Ideation', branch: 'challenge' } };
  }
  if (/user flow/.test(lower)) {
    return { next: 'user_flow_figjam_link', patch: { fidelity: 'User Flow', branch: 'user_flow' } };
  }
  if (/data flow/.test(lower)) {
    return { next: 'data_flow_figjam_link', patch: { fidelity: 'Data Flow', branch: 'data_flow' } };
  }
  if (/flow variety|stitch|low|sketch|wireframe/.test(lower)) {
    return { next: 'flow_variety_deliver', patch: { fidelity: 'Flow Variety', branch: 'flow_variety' } };
  }

  return null;
}
