// src/components/ui/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
  delay?: number;
}

interface TooltipPos {
  top: number;
  left: number;
  side: 'top' | 'bottom' | 'left' | 'right';
}

const TOOLTIP_OFFSET = 10;
const TOOLTIP_MARGIN = 8;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'auto',
  className = '',
  delay = 200,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<TooltipPos>({ top: 0, left: 0, side: 'bottom' });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Estimate tooltip size
    const tw = 200;
    const th = 36;

    let side: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    if (position !== 'auto') {
      side = position;
    } else {
      // Auto-detect best side based on available space
      const spaceBelow = vh - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = vw - rect.right;
      const spaceLeft = rect.left;

      if (spaceBelow >= th + TOOLTIP_OFFSET + TOOLTIP_MARGIN) {
        side = 'bottom';
      } else if (spaceAbove >= th + TOOLTIP_OFFSET + TOOLTIP_MARGIN) {
        side = 'top';
      } else if (spaceRight >= tw + TOOLTIP_OFFSET + TOOLTIP_MARGIN) {
        side = 'right';
      } else {
        side = 'left';
      }
    }

    let top = 0;
    let left = 0;

    switch (side) {
      case 'bottom':
        top = rect.bottom + TOOLTIP_OFFSET;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case 'top':
        top = rect.top - th - TOOLTIP_OFFSET;
        left = rect.left + rect.width / 2 - tw / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.right + TOOLTIP_OFFSET;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.left - tw - TOOLTIP_OFFSET;
        break;
    }

    // Clamp to viewport edges
    left = Math.max(TOOLTIP_MARGIN, Math.min(left, vw - tw - TOOLTIP_MARGIN));
    top = Math.max(TOOLTIP_MARGIN, Math.min(top, vh - th - TOOLTIP_MARGIN));

    setCoords({ top, left, side });
  };

  const handleMouseEnter = () => {
    showTimer.current = setTimeout(() => {
      computePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  // Arrow tail position
  const arrowStyle: Record<'top' | 'bottom' | 'left' | 'right', React.CSSProperties> = {
    bottom: {
      position: 'absolute',
      top: -6,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderBottom: '6px solid rgba(24,24,27,0.96)',
    },
    top: {
      position: 'absolute',
      bottom: -6,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: '6px solid rgba(24,24,27,0.96)',
    },
    right: {
      position: 'absolute',
      top: '50%',
      left: -6,
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderRight: '6px solid rgba(24,24,27,0.96)',
    },
    left: {
      position: 'absolute',
      top: '50%',
      right: -6,
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderLeft: '6px solid rgba(24,24,27,0.96)',
    },
  };

  const motionVariants = {
    bottom: { initial: { opacity: 0, y: -4, scale: 0.93 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -3, scale: 0.95 } },
    top:    { initial: { opacity: 0, y: 4,  scale: 0.93 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 3,  scale: 0.95 } },
    left:   { initial: { opacity: 0, x: 4,  scale: 0.93 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 3,  scale: 0.95 } },
    right:  { initial: { opacity: 0, x: -4, scale: 0.93 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -3, scale: 0.95 } },
  };

  const mv = motionVariants[coords.side];

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      {isVisible && content && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={tooltipRef}
              initial={mv.initial}
              animate={mv.animate}
              exit={mv.exit}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                zIndex: 99999,
                pointerEvents: 'none',
                minWidth: 80,
                maxWidth: 260,
              }}
            >
              <div
                style={{
                  background: 'rgba(18,18,22,0.97)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10,
                  padding: '6px 12px',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.03em',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={arrowStyle[coords.side]} />
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
