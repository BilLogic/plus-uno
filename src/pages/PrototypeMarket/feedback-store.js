/**
 * Feedback Store
 *
 * localStorage-backed CRUD for prototype reactions and comments.
 * No backend — data persists per-browser. Use exportAllFeedback() to share.
 *
 * Storage key: 'plus-market-feedback'
 * User key:    'plus-market-user'
 */

const STORAGE_KEY = 'plus-market-feedback';
const USER_KEY = 'plus-market-user';

// ── Helpers ────────────────────────────────────────

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureEntry(store, prototypeId) {
  if (!store[prototypeId]) {
    store[prototypeId] = { reactions: {}, comments: [] };
  }
  return store[prototypeId];
}

// ── User Identity ──────────────────────────────────

/** Get stored user name, or null if not set */
export function getUser() {
  return localStorage.getItem(USER_KEY) || null;
}

/** Set user name (persists across sessions) */
export function setUser(name) {
  localStorage.setItem(USER_KEY, name);
}

/**
 * Get user name, prompting if not set.
 * Returns the name or null if user cancels.
 */
export function ensureUser() {
  let user = getUser();
  if (!user) {
    user = window.prompt('Enter your name for feedback:');
    if (user && user.trim()) {
      user = user.trim();
      setUser(user);
    } else {
      return null;
    }
  }
  return user;
}

// ── Reactions ──────────────────────────────────────

/** Available reaction emojis */
export const REACTION_EMOJIS = ['👍', '👎', '🔥', '💡', '🎨', '🐛'];

/**
 * Get reactions for a prototype.
 * Returns { "👍": ["Bryan", "Bill"], "🔥": ["Victor"], ... }
 */
export function getReactions(prototypeId) {
  const store = readStore();
  return store[prototypeId]?.reactions || {};
}

/**
 * Toggle a reaction for the current user.
 * Returns updated reactions object.
 */
export function toggleReaction(prototypeId, emoji, author) {
  const store = readStore();
  const entry = ensureEntry(store, prototypeId);

  if (!entry.reactions[emoji]) {
    entry.reactions[emoji] = [];
  }

  const idx = entry.reactions[emoji].indexOf(author);
  if (idx >= 0) {
    entry.reactions[emoji].splice(idx, 1);
    // Clean up empty arrays
    if (entry.reactions[emoji].length === 0) {
      delete entry.reactions[emoji];
    }
  } else {
    entry.reactions[emoji].push(author);
  }

  writeStore(store);
  return { ...entry.reactions };
}

// ── Comments ───────────────────────────────────────

/**
 * Get comments for a prototype.
 * Returns array of { id, author, text, ts, loomUrl }
 */
export function getComments(prototypeId) {
  const store = readStore();
  return store[prototypeId]?.comments || [];
}

/**
 * Add a comment to a prototype.
 * Returns the new comment object.
 */
export function addComment(prototypeId, { author, text, loomUrl = null }) {
  const store = readStore();
  const entry = ensureEntry(store, prototypeId);

  const comment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    author,
    text,
    ts: new Date().toISOString(),
    loomUrl: loomUrl || null,
  };

  entry.comments.push(comment);
  writeStore(store);
  return comment;
}

// ── Export ──────────────────────────────────────────

/**
 * Export all feedback as a JSON blob (for sharing in standups etc.)
 * Triggers a browser download.
 */
export function exportAllFeedback() {
  const store = readStore();
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plus-market-feedback-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
