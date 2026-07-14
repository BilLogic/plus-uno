import React, { Suspense, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LIVE_APP_SECTIONS } from './liveAppSections';
import './LiveAppNav.scss';

/**
 * Collapsible section switcher for jumping between Storybook Specs pages.
 *
 * @returns {JSX.Element}
 */
export default function LiveAppNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className={`live-app-nav${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="live-app-nav__toggle"
        aria-expanded={open}
        aria-controls="live-app-nav-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-layer-group'}`} aria-hidden />
        <span>{open ? 'Close' : 'Sections'}</span>
      </button>

      {open && (
        <nav id="live-app-nav-panel" className="live-app-nav__panel" aria-label="Live app sections">
          <div className="live-app-nav__title">Storybook specs</div>
          <p className="live-app-nav__hint">{location.pathname}</p>
          {LIVE_APP_SECTIONS.map((section) => (
            <div key={section.group} className="live-app-nav__group">
              <div className="live-app-nav__group-label">{section.group}</div>
              <ul className="live-app-nav__list">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={Boolean(item.end)}
                      className={({ isActive }) =>
                        `live-app-nav__link${isActive ? ' is-active' : ''}`
                      }
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}

/**
 * Shared Suspense fallback for Specs pages.
 *
 * @returns {JSX.Element}
 */
export function LiveAppPageFallback() {
  return (
    <div className="live-app-fallback" role="status">
      Loading Storybook page…
    </div>
  );
}

/**
 * Wrap a lazy Specs page in Suspense.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function LiveAppSuspense({ children }) {
  return <Suspense fallback={<LiveAppPageFallback />}>{children}</Suspense>;
}
