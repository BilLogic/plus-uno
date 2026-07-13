// Patterns: slot-based shells mirroring the Figma slot components.
// Shells own the frame (tokens for bg/radius/elevation/border/spacing);
// consumers fill the slots.

export { default as Surface, SURFACE_LEVELS } from './Surface';
export { default as SurfaceContainer } from './SurfaceContainer';
export { default as PatternCard } from './PatternCard';
export { default as PatternSection } from './PatternSection';
export { default as PatternModal } from './PatternModal';
export { default as PatternTable } from './PatternTable';
