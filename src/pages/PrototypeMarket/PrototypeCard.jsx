import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { STAGES, PRODUCT_PILLARS, STAGE_META, PILLAR_META } from './prototypes-data';
import './PrototypeCard.scss';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const PrototypeCard = ({
  title,
  description,
  stage,
  productPillar,
  creators = [],
  contributors = [],
  lastUpdated,
  deploymentUrl,
  notionCardUrl,
  notionCardId,
  localPath,
  upvoteCount = 0,
  isUpvoted = false,
  onToggleUpvote,
  onOpenDetails,
}) => {
  const stageMeta  = STAGE_META[stage]  || STAGE_META.low;
  const pillarMeta = PILLAR_META[productPillar] || PILLAR_META.universal;

  const allPeople = [...new Set([...creators, ...contributors])];

  const handleCardClick = () => {
    if (onOpenDetails) onOpenDetails();
  };

  const isClickable = true;
  const isNotDeployed = !deploymentUrl && !localPath;

  return (
    <Card
      className={`prototype-card ${isClickable ? 'prototype-card--clickable' : ''} ${isNotDeployed ? 'prototype-card--not-deployed' : ''}`}
      paddingSize="md"
      gapSize="md"
      radiusSize="sm"
      onClick={isClickable ? handleCardClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } } : undefined}
      aria-label={isClickable ? `Open ${title}` : undefined}
      aria-disabled={isNotDeployed ? true : undefined}
    >
      <div className="prototype-card__head">
        <div className="prototype-card__head-main">
          {/* Badges row */}
          <div className="prototype-card__badges">
            <Badge style={stageMeta.badgeStyle} size="b3">
              {stageMeta.label}
            </Badge>
            <Badge style={pillarMeta.badgeStyle} size="b3">
              {pillarMeta.label}
            </Badge>
          </div>

          {/* Title */}
          <div className="prototype-card__title h5">{title}</div>
        </div>
      </div>

      {/* Description */}
      <p className="prototype-card__desc body2-txt">{description}</p>

      {/* Meta row */}
      <div className="prototype-card__meta">
        <div className="prototype-card__meta-item body2-txt">
          <i className="fa-regular fa-user" />
          <span>{allPeople.join(', ')}</span>
        </div>
        <div className="prototype-card__meta-item body2-txt">
          <i className="fa-regular fa-calendar" />
          <span>{formatDate(lastUpdated)}</span>
        </div>
      </div>

      {/* Links row */}
      <div className="prototype-card__links">
        {deploymentUrl && (
          <a
            href={deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="prototype-card__link body2-txt"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-arrow-up-right-from-square" />
            Live
          </a>
        )}
        {localPath && !deploymentUrl && (
          <a
            href={localPath}
            className="prototype-card__link body2-txt"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fa-solid fa-laptop" />
            Local
          </a>
        )}
        {notionCardUrl && (
          <a
            href={notionCardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="prototype-card__link body2-txt"
            onClick={(e) => e.stopPropagation()}
          >
            <i className="fa-brands fa-notion" />
            {notionCardId || 'Notion'}
          </a>
        )}
        {!deploymentUrl && !localPath && (
          <span className="prototype-card__link prototype-card__link--disabled body2-txt">
            <i className="fa-solid fa-circle-minus" />
            Not deployed
          </span>
        )}
        <div className="prototype-card__upvote-wrap">
          <Button
          className="prototype-card__upvote-btn"
          style="secondary"
          fill="tonal"
          active={isUpvoted}
          size="small"
          leadingVisual={<i className={`${isUpvoted ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`} />}
          text={upvoteCount > 0 ? String(upvoteCount) : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleUpvote) onToggleUpvote();
          }}
            aria-label={isUpvoted ? 'Remove upvote' : 'Upvote'}
          />
        </div>
      </div>
    </Card>
  );
};

PrototypeCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  stage: PropTypes.oneOf(STAGES).isRequired,
  productPillar: PropTypes.oneOf(PRODUCT_PILLARS).isRequired,
  creators: PropTypes.arrayOf(PropTypes.string),
  contributors: PropTypes.arrayOf(PropTypes.string),
  lastUpdated: PropTypes.string,
  deploymentUrl: PropTypes.string,
  notionCardUrl: PropTypes.string,
  notionCardId: PropTypes.string,
  localPath: PropTypes.string,
  upvoteCount: PropTypes.number,
  isUpvoted: PropTypes.bool,
  onToggleUpvote: PropTypes.func,
  onOpenDetails: PropTypes.func,
};

export default PrototypeCard;
