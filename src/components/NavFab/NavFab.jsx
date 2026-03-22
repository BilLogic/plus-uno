import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '@/components/Tooltip';
import './NavFab.scss';

const HIDDEN_PATHS = ['/', '/market', '/prototypes'];

const NAV_ITEMS = [
  {
    id: 'storybook',
    label: 'Storybook',
    icon: 'fa-solid fa-book-open',
    href: '/storybook',
    external: true
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'fa-solid fa-store',
    href: '/',
    external: false
  }
];

export default function NavFab() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <div
      className="nav-fab"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence>
        {isOpen && NAV_ITEMS.map((item, index) => (
          <motion.div
            key={item.id}
            className="nav-fab__item-wrapper"
            initial={{ opacity: 0, y: 16, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.8 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Tooltip text={item.label} placement="right">
              <motion.a
                className="nav-fab__action"
                href={item.href}
                role="menuitem"
                aria-label={`Open ${item.label}`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={item.external ? undefined : (e) => {
                  e.preventDefault();
                  window.location.href = item.href;
                }}
              >
                <i className={item.icon} />
              </motion.a>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>

      <Tooltip text="Navigation" placement="right">
        <motion.button
          className="nav-fab__trigger"
          aria-label="Navigation menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-compass'}`} />
        </motion.button>
      </Tooltip>
    </div>
  );
}
