import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import Input from '@/forms/Input';
import Divider from '@/components/Divider';
import Tooltip from '@/components/Tooltip';
import { Toast, ToastContainer } from '@/components/Toast';
import {
  REACTION_EMOJIS,
  getReactions,
  toggleReaction,
  getComments,
  addComment,
  ensureUser,
  getUser,
  exportAllFeedback,
} from './feedback-store';
import './FeedbackPanel.scss';

/**
 * Parse a Loom share URL into an embed URL.
 * https://www.loom.com/share/abc123 → https://www.loom.com/embed/abc123
 */
function toLoomEmbed(url) {
  if (!url) return null;
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (match) return `https://www.loom.com/embed/${match[1]}`;
  // Already an embed URL
  if (url.includes('loom.com/embed/')) return url;
  return null;
}

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const FeedbackPanel = ({
  show,
  onClose,
  prototypeId,
  prototypeTitle,
  figmaFileUrl,
  loomVideoUrl,
}) => {
  // State
  const [reactions, setReactions] = useState(() => getReactions(prototypeId));
  const [comments, setComments] = useState(() => getComments(prototypeId));
  const [commentText, setCommentText] = useState('');
  const [loomInput, setLoomInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [copiedFigma, setCopiedFigma] = useState(false);

  // Refresh data when modal opens
  useMemo(() => {
    if (show) {
      setReactions(getReactions(prototypeId));
      setComments(getComments(prototypeId));
    }
  }, [show, prototypeId]);

  const currentUser = getUser();

  // Reaction handler
  const handleReaction = useCallback(
    (emoji) => {
      const user = ensureUser();
      if (!user) return;
      const updated = toggleReaction(prototypeId, emoji, user);
      setReactions({ ...updated });
    },
    [prototypeId]
  );

  // Comment submission
  const handleSubmitComment = useCallback(() => {
    const user = ensureUser();
    if (!user) return;
    if (!commentText.trim() && !loomInput.trim()) return;

    addComment(prototypeId, {
      author: user,
      text: commentText.trim(),
      loomUrl: loomInput.trim() || null,
    });

    setComments(getComments(prototypeId));
    setCommentText('');
    setLoomInput('');
    setShowToast(true);
  }, [prototypeId, commentText, loomInput]);

  // Copy Figma file key
  const handleCopyFigmaKey = useCallback(() => {
    if (!figmaFileUrl) return;
    const match = figmaFileUrl.match(/figma\.com\/design\/([^/]+)/);
    const key = match ? match[1] : figmaFileUrl;
    navigator.clipboard.writeText(key).then(() => {
      setCopiedFigma(true);
      setTimeout(() => setCopiedFigma(false), 2000);
    });
  }, [figmaFileUrl]);

  // Creator Loom embed URL
  const creatorLoomEmbed = toLoomEmbed(loomVideoUrl);

  return (
    <>
      <Modal
        show={show}
        onClose={onClose}
        title={`Feedback — ${prototypeTitle}`}
        type="default"
        paddingSize="md"
        gapSize="md"
        width={640}
        showBottomButtons={false}
      >
        <div className="feedback-panel">
          {/* ── Reactions Summary ────────────────── */}
          <div className="feedback-panel__section">
            <div className="feedback-panel__section-label body3-txt">Reactions</div>
            <div className="feedback-panel__reactions">
              {REACTION_EMOJIS.map((emoji) => {
                const users = reactions[emoji] || [];
                const count = users.length;
                const isActive = currentUser && users.includes(currentUser);

                return (
                  <Tooltip
                    key={emoji}
                    text={count > 0 ? users.join(', ') : 'Be the first!'}
                    placement="top"
                    size="small"
                    id={`fp-reaction-${prototypeId}-${emoji}`}
                  >
                    <Button
                      text={count > 0 ? `${count}` : ''}
                      leadingVisual={<span className="feedback-panel__reaction-emoji">{emoji}</span>}
                      style={isActive ? 'primary' : 'secondary'}
                      fill={isActive ? 'tonal' : 'outline'}
                      size="small"
                      onClick={() => handleReaction(emoji)}
                      className="feedback-panel__reaction-btn"
                      aria-label={`React with ${emoji}`}
                    />
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <Divider size="1px" style="dark" opacity10={true} />

          {/* ── Figma Link ──────────────────────── */}
          {figmaFileUrl && (
            <>
              <div className="feedback-panel__section">
                <div className="feedback-panel__section-label body3-txt">
                  <i className="fa-brands fa-figma" aria-hidden="true" /> Design Context
                </div>
                <div className="feedback-panel__figma">
                  <a
                    href={figmaFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="feedback-panel__figma-link body2-txt"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                    Open in Figma
                  </a>
                  <Button
                    text={copiedFigma ? 'Copied!' : 'Copy File Key'}
                    style="secondary"
                    fill="outline"
                    size="small"
                    leadingVisual="copy"
                    onClick={handleCopyFigmaKey}
                  />
                </div>
                <div className="feedback-panel__figma-hint body3-txt">
                  Use the Figma MCP tool with this file key to pull design context into your agent.
                </div>
              </div>
              <Divider size="1px" style="dark" opacity10={true} />
            </>
          )}

          {/* ── Creator Loom Walkthrough ─────────── */}
          {creatorLoomEmbed && (
            <>
              <div className="feedback-panel__section">
                <div className="feedback-panel__section-label body3-txt">
                  <i className="fa-solid fa-video" aria-hidden="true" /> Creator Walkthrough
                </div>
                <div className="feedback-panel__loom-embed">
                  <iframe
                    src={creatorLoomEmbed}
                    frameBorder="0"
                    allowFullScreen
                    title="Creator walkthrough video"
                  />
                </div>
              </div>
              <Divider size="1px" style="dark" opacity10={true} />
            </>
          )}

          {/* ── Comments ────────────────────────── */}
          <div className="feedback-panel__section">
            <div className="feedback-panel__section-label body3-txt">
              Comments ({comments.length})
            </div>

            {comments.length === 0 ? (
              <div className="feedback-panel__empty body3-txt">
                No comments yet. Be the first to share feedback!
              </div>
            ) : (
              <div className="feedback-panel__comments">
                {comments.map((c) => {
                  const embedUrl = toLoomEmbed(c.loomUrl);
                  return (
                    <div key={c.id} className="feedback-panel__comment">
                      <div className="feedback-panel__comment-header">
                        <span className="feedback-panel__comment-author body2-txt">
                          {c.author}
                        </span>
                        <span className="feedback-panel__comment-time body3-txt">
                          {formatTimestamp(c.ts)}
                        </span>
                      </div>
                      {c.text && (
                        <div className="feedback-panel__comment-text body2-txt">
                          {c.text}
                        </div>
                      )}
                      {embedUrl && (
                        <div className="feedback-panel__loom-embed feedback-panel__loom-embed--comment">
                          <iframe
                            src={embedUrl}
                            frameBorder="0"
                            allowFullScreen
                            title={`Loom video from ${c.author}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Divider size="1px" style="dark" opacity10={true} />

          {/* ── Add Comment Form ────────────────── */}
          <div className="feedback-panel__section feedback-panel__form">
            <div className="feedback-panel__section-label body3-txt">Add Feedback</div>
            <Input
              id={`feedback-comment-${prototypeId}`}
              placeholder="Share your feedback..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              size="medium"
              showLabel={false}
              label="Comment"
            />
            <Input
              id={`feedback-loom-${prototypeId}`}
              placeholder="Loom URL (optional)"
              value={loomInput}
              onChange={(e) => setLoomInput(e.target.value)}
              size="medium"
              showLabel={false}
              label="Loom URL"
              leadingVisual="fa-solid fa-video"
            />
          </div>

          {/* ── Footer ──────────────────────────── */}
          <div className="feedback-panel__footer">
            <Button
              text="Export All"
              style="secondary"
              fill="ghost"
              size="medium"
              leadingVisual="download"
              onClick={exportAllFeedback}
            />
            <Button
              text="Submit Feedback"
              style="primary"
              fill="filled"
              size="medium"
              onClick={handleSubmitComment}
              disabled={!commentText.trim() && !loomInput.trim()}
            />
          </div>
        </div>
      </Modal>

      {/* Toast confirmation */}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          title="Feedback submitted"
          style="success"
          delay={3000}
          autohide
        >
          Your feedback has been saved.
        </Toast>
      </ToastContainer>
    </>
  );
};

FeedbackPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  prototypeId: PropTypes.string.isRequired,
  prototypeTitle: PropTypes.string,
  figmaFileUrl: PropTypes.string,
  loomVideoUrl: PropTypes.string,
};

export default FeedbackPanel;
