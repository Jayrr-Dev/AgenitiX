import React from 'react';

interface IconForNotProps {
  active?: boolean;
}

/**
 * NOT Gate Icon (HTML/CSS version, small, border color changes on active)
 * - Yellow rounded square background (border turns green when active)
 * - Right-pointing triangle (CSS)
 * - Circle at the tip (CSS)
 */
const IconForNot: React.FC<IconForNotProps> = ({ active }) => (
  <div
    style={{
      width: 32,
      height: 32,
      background: '#FEF3C7',
      border: `1px solid ${active ? '#22c55e' : '#F59E0B'}`,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'border-color 0.2s',
    }}
  >
    {/* Triangle */}
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: '14px solid #F59E0B',
        borderRight: 'none',
        position: 'absolute',
        left: 6,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1,
        filter: 'drop-shadow(0 0 0 #92400E)',
      }}
    />
    {/* Triangle border (simulate stroke) */}
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: '9px solid transparent',
        borderBottom: '9px solid transparent',
        borderLeft: '16px solid transparent',
        position: 'absolute',
        left: 5,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 0,
        borderLeftColor: '#92400E',
      }}
    />
    {/* Circle (bubble) */}
    <div
      style={{
        width: 8,
        height: 8,
        background: '#F59E0B',
        border: '1px solid #92400E',
        borderRadius: '50%',
        position: 'absolute',
        right: 4,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 2,
      }}
    />
  </div>
);

export default IconForNot;
