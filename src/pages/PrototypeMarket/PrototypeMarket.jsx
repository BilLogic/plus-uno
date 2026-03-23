import React, { useState, useMemo } from 'react';
import Select from '@/forms/Select';
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
const fidelityRank = { low: 1, mid: 2, high: 3 };

const PrototypeMarket = () => {
  const [search, setSearch] = useState('');
  const [selectedStages, setSelectedStages] = useState([]);
  const [selectedPillars, setSelectedPillars] = useState([]);
  const [sortBy, setSortBy] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc');

  const normalizedSearch = search.trim();
  const hasFilters = selectedStages.length > 0 || selectedPillars.length > 0 || normalizedSearch;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = prototypes.filter((p) => {
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
    return base;
  }, [search, selectedStages, selectedPillars]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'fidelity') {
        const rankDelta = fidelityRank[a.stage] - fidelityRank[b.stage];
        if (rankDelta !== 0) {
          return sortDirection === 'asc' ? rankDelta : -rankDelta;
        }
        const dateDelta = new Date(a.lastUpdated) - new Date(b.lastUpdated);
        return sortDirection === 'asc' ? dateDelta : -dateDelta;
      }

      const dateDelta = new Date(a.lastUpdated) - new Date(b.lastUpdated);
      if (dateDelta !== 0) {
        return sortDirection === 'asc' ? dateDelta : -dateDelta;
      }
      const rankDelta = fidelityRank[a.stage] - fidelityRank[b.stage];
      return sortDirection === 'asc' ? rankDelta : -rankDelta;
    });
  }, [filtered, sortBy, sortDirection]);

  const handleSortClick = (nextSortBy) => {
    if (sortBy === nextSortBy) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      return;
    }
    setSortBy(nextSortBy);
    setSortDirection('desc');
  };

  return (
    <div className="prototype-market">
      {/* Header */}
      <header className="prototype-market__header">
        <h1 className="prototype-market__title h2">Prototype Market</h1>
        <p className="prototype-market__subtitle body1-txt">
          Browse deployed PLUS prototypes. Each card links to its live deployment or local dev route.
        </p>
      </header>

      {/* Search */}
      <div className="prototype-market__search">
        <div className="prototype-market__search-field">
          <i className="fa-solid fa-magnifying-glass prototype-market__search-icon" />
          <input
            type="text"
            className="prototype-market__search-input body2-txt"
            placeholder="Search prototypes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="prototype-market__search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

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
        <div className="prototype-market__sorts" aria-label="Sort controls">
          <button
            type="button"
            className={`prototype-market__sort-btn body3-txt ${sortBy === 'time' ? 'is-active' : ''}`}
            onClick={() => handleSortClick('time')}
            aria-pressed={sortBy === 'time'}
          >
            <span>Time</span>
            <i className={`fa-solid ${sortBy === 'time' && sortDirection === 'asc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
          </button>
          <button
            type="button"
            className={`prototype-market__sort-btn body3-txt ${sortBy === 'fidelity' ? 'is-active' : ''}`}
            onClick={() => handleSortClick('fidelity')}
            aria-pressed={sortBy === 'fidelity'}
          >
            <span>Fidelity</span>
            <i className={`fa-solid ${sortBy === 'fidelity' && sortDirection === 'asc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="prototype-market__count body2-txt">
        {normalizedSearch ? (
          <>
            Search result:{' '}
            <span className="prototype-market__count-emphasis">{sorted.length}</span>{' '}
            {sorted.length === 1 ? 'prototype' : 'prototypes'} for{' '}
            <span className="prototype-market__count-emphasis">{normalizedSearch}</span>
          </>
        ) : (
          <>
            {sorted.length} {sorted.length === 1 ? 'prototype' : 'prototypes'}
          </>
        )}
        {hasFilters && (
          <button
            className="prototype-market__clear-filters body3-txt"
            onClick={() => {
              setSelectedStages([]);
              setSelectedPillars([]);
              setSearch('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="prototype-market__grid">
          {sorted.map((proto) => (
            <PrototypeCard key={proto.id} {...proto} />
          ))}
        </div>
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
