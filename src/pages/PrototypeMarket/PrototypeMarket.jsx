import React, { useState, useMemo, useEffect } from 'react';
import Select from '@/forms/Select';
import Input from '@/forms/Input';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import ButtonGroup from '@/components/ButtonGroup';
import PrototypeCard from './PrototypeCard';
import {
  prototypes,
  STAGES,
  PRODUCT_PILLARS,
  STAGE_META,
  PILLAR_META,
} from './prototypes-data';
import './PrototypeMarket.scss';

const stageOptions = STAGES.map((s) => ({ value: s, label: STAGE_META[s].label }));
const pillarOptions = PRODUCT_PILLARS.map((p) => ({ value: p, label: PILLAR_META[p].label }));

const PrototypeMarket = () => {
  const [search, setSearch] = useState('');
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedPillars, setSelectedPillars] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Break out of demo frame when marketplace is active
  useEffect(() => {
    document.documentElement.classList.add('market-active');
    document.body.classList.add('market-active');
    return () => {
      document.documentElement.classList.remove('market-active');
      document.body.classList.remove('market-active');
    };
  }, []);

  const hasFilters = selectedStages.length > 0 || selectedPillars.length > 0 || search;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return prototypes.filter((p) => {
      if (selectedStages.length > 0 && !selectedStages.includes(p.stage)) return false;
      if (selectedPillars.length > 0 && !selectedPillars.includes(p.productPillar)) return false;
      if (q) {
        const haystack = [
          p.title,
          p.description,
          ...p.creators,
          ...p.contributors,
          p.productPillar,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [search, selectedStages, selectedPillars]);

  return (
    <div className="prototype-market">
      {/* Header */}
      <header className="prototype-market__header">
        <h1 className="prototype-market__title h2">Prototype Market</h1>
        <p className="prototype-market__subtitle body1-txt">
          Browse deployed PLUS prototypes. Each card links to its live deployment or local dev route.
        </p>
      </header>

      {/* Search — using DS Input component */}
      <Input
        id="market-search"
        placeholder="Search prototypes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leadingVisual="fa-solid fa-magnifying-glass"
        size="medium"
        showLabel={false}
        label="Search prototypes"
      />

      {/* Filters */}
      <div className="prototype-market__filters">
        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body3-txt">Stage</label>
          <Select
            id="market-stage-filter"
            mode="multi"
            options={stageOptions}
            value={selectedStages}
            onChange={setSelectedStages}
            placeholder="All stages"
            size="medium"
          />
        </div>

        <div className="prototype-market__filter-group">
          <label className="prototype-market__filter-label body3-txt">Pillar</label>
          <Select
            id="market-pillar-filter"
            mode="multi"
            options={pillarOptions}
            value={selectedPillars}
            onChange={setSelectedPillars}
            placeholder="All pillars"
            size="medium"
          />
        </div>
      </div>

      {/* Result count + view toggle */}
      <div className="prototype-market__toolbar">
        <div className="prototype-market__count body2-txt">
          {filtered.length} {filtered.length === 1 ? 'prototype' : 'prototypes'}
          {hasFilters && (
            <Button
              text="Clear filters"
              style="tertiary"
              fill="ghost"
              size="small"
              onClick={() => {
                setSelectedStages([]);
                setSelectedPillars([]);
                setSearch('');
              }}
            />
          )}
        </div>
        <ButtonGroup
          size="small"
          style="secondary"
          fill="outline"
          ariaLabel="View mode"
          buttons={[
            {
              id: 'grid-view',
              leadingVisual: 'grip',
              active: viewMode === 'grid',
              onClick: () => setViewMode('grid'),
            },
            {
              id: 'list-view',
              leadingVisual: 'list',
              active: viewMode === 'list',
              onClick: () => setViewMode('list'),
            },
          ]}
        />
      </div>

      {/* Grid or List */}
      {filtered.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="prototype-market__grid">
            {filtered.map((proto) => (
              <PrototypeCard key={proto.id} {...proto} />
            ))}
          </div>
        ) : (
          <div className="prototype-market__list">
            <div className="prototype-market__list-header body3-txt">
              <span className="prototype-market__list-col--name">Name</span>
              <span className="prototype-market__list-col--pillar">Pillar</span>
              <span className="prototype-market__list-col--stage">Stage</span>
              <span className="prototype-market__list-col--creator">Creator</span>
              <span className="prototype-market__list-col--date">Updated</span>
              <span className="prototype-market__list-col--link">Link</span>
            </div>
            {filtered.map((proto) => {
              const stageMeta = STAGE_META[proto.stage] || STAGE_META.low;
              const pillarMeta = PILLAR_META[proto.productPillar] || PILLAR_META.universal;
              const link = proto.deploymentUrl || proto.localPath;
              return (
                <a
                  key={proto.id}
                  href={link || '#'}
                  className="prototype-market__list-row body2-txt"
                  target={proto.deploymentUrl ? '_blank' : undefined}
                  rel={proto.deploymentUrl ? 'noopener noreferrer' : undefined}
                  onClick={!link ? (e) => e.preventDefault() : undefined}
                >
                  <span className="prototype-market__list-col--name">
                    <strong>{proto.title}</strong>
                    <span className="prototype-market__list-desc">{proto.description}</span>
                  </span>
                  <span className="prototype-market__list-col--pillar">
                    <Badge style={pillarMeta.badgeStyle} size="b3">{pillarMeta.label}</Badge>
                  </span>
                  <span className="prototype-market__list-col--stage">
                    <Badge style={stageMeta.badgeStyle} size="b3">{stageMeta.label}</Badge>
                  </span>
                  <span className="prototype-market__list-col--creator">{proto.creators?.join(', ')}</span>
                  <span className="prototype-market__list-col--date">{proto.lastUpdated}</span>
                  <span className="prototype-market__list-col--link">
                    {link ? <i className="fa-solid fa-arrow-up-right-from-square" /> : <i className="fa-solid fa-circle-minus" style={{ opacity: 0.3 }} />}
                  </span>
                </a>
              );
            })}
          </div>
        )
      ) : (
        <div className="prototype-market__empty">
          <i className="fa-regular fa-folder-open prototype-market__empty-icon" />
          <p className="body1-txt">No prototypes match your filters.</p>
        </div>
      )}
    </div>
  );
};

export default PrototypeMarket;
