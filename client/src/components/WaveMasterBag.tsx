import React from 'react';

interface WaveMasterBagProps {
  x: number;
  y: number;
  scale?: number;
  isOccupied?: boolean;
  studentInitials?: string;
  spotNumber?: number;
  isSelected?: boolean;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

export const WaveMasterBag: React.FC<WaveMasterBagProps> = ({
  x,
  y,
  scale = 1,
  isOccupied = false,
  studentInitials = '',
  spotNumber = 0,
  isSelected = false,
  isDragging = false,
  onMouseDown,
  onTouchStart,
}) => {
  const bagWidth = 48 * scale;
  const bagHeight = 140 * scale;
  const baseWidth = 65 * scale;
  const baseHeight = 24 * scale;

  return (
    <g
      transform={`translate(${x - bagWidth / 2}, ${y})`}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Floor contact shadow */}
      <ellipse
        cx={bagWidth / 2}
        cy={bagHeight + baseHeight + 4}
        rx={baseWidth * 0.4}
        ry={baseHeight * 0.3}
        fill="url(#shadowGradient)"
        opacity="0.7"
      />

      {/* Weighted base */}
      <defs>
        {/* Shadow gradient for floor contact */}
        <radialGradient id="shadowGradient" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Bag body gradient - realistic leather/vinyl */}
        <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0a0908" />
          <stop offset="15%" stopColor="#1a1714" />
          <stop offset="50%" stopColor="#2a2420" />
          <stop offset="85%" stopColor="#1a1714" />
          <stop offset="100%" stopColor="#0a0908" />
        </linearGradient>

        {/* Top highlight */}
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="20%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Rim light on left edge */}
        <linearGradient id="rimLightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffb878" stopOpacity="0.26" />
          <stop offset="50%" stopColor="#ffb878" stopOpacity="0" />
        </linearGradient>

        {/* Base gradient */}
        <linearGradient id="baseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1612" />
          <stop offset="50%" stopColor="#0f0d0a" />
          <stop offset="100%" stopColor="#0a0908" />
        </linearGradient>

        {/* Seam pattern */}
        <pattern id="seamPattern" x="0" y="0" width="100%" height="3" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1.5" x2="100%" y2="1.5" stroke="#000000" strokeWidth="0.5" opacity="0.15" />
        </pattern>
      </defs>

      {/* Base - wider weighted stand */}
      <ellipse
        cx={bagWidth / 2}
        cy={bagHeight + baseHeight / 2}
        rx={baseWidth / 2}
        ry={baseHeight / 2}
        fill="url(#baseGradient)"
        stroke="#0a0908"
        strokeWidth={1 * scale}
      />

      {/* Base bevel/form */}
      <ellipse
        cx={bagWidth / 2}
        cy={bagHeight + baseHeight / 2}
        rx={baseWidth / 2 - 2 * scale}
        ry={baseHeight / 2 - 1 * scale}
        fill="none"
        stroke="#1a1612"
        strokeWidth={0.5 * scale}
        opacity="0.5"
      />

      {/* Main bag cylinder body */}
      <rect
        x={0}
        y={0}
        width={bagWidth}
        height={bagHeight}
        fill="url(#bagGradient)"
        rx={bagWidth / 4}
        ry={bagWidth / 4}
      />

      {/* Seam pattern overlay */}
      <rect
        x={0}
        y={0}
        width={bagWidth}
        height={bagHeight}
        fill="url(#seamPattern)"
        rx={bagWidth / 4}
        ry={bagWidth / 4}
      />

      {/* Left rim light */}
      <rect
        x={0}
        y={0}
        width={bagWidth * 0.15}
        height={bagHeight}
        fill="url(#rimLightGradient)"
        rx={bagWidth / 4}
        ry={bagWidth / 4}
      />

      {/* Top highlight */}
      <rect
        x={0}
        y={0}
        width={bagWidth}
        height={bagHeight * 0.2}
        fill="url(#highlightGradient)"
        rx={bagWidth / 4}
        ry={bagWidth / 4}
      />

      {/* Inset shadow for depth */}
      <rect
        x={0}
        y={0}
        width={bagWidth}
        height={bagHeight}
        fill="none"
        stroke="#000000"
        strokeWidth={1 * scale}
        opacity="0.3"
        rx={bagWidth / 4}
        ry={bagWidth / 4}
      />

      {/* Red number badge on top */}
      <circle
        cx={bagWidth / 2}
        cy={-8 * scale}
        r={10 * scale}
        fill="#dc2626"
        stroke="#991b1b"
        strokeWidth={1 * scale}
      />

      <text
        x={bagWidth / 2}
        y={-4 * scale}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12 * scale}
        fontWeight="bold"
        fill="white"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {spotNumber}
      </text>

      {/* Student initials on occupied bags */}
      {isOccupied && studentInitials && (
        <text
          x={bagWidth / 2}
          y={bagHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10 * scale}
          fontWeight="600"
          fill="white"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {studentInitials}
        </text>
      )}

      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={-2 * scale}
          y={-2 * scale}
          width={bagWidth + 4 * scale}
          height={bagHeight + 4 * scale}
          fill="none"
          stroke="#06b6d4"
          strokeWidth={2 * scale}
          rx={bagWidth / 4}
          ry={bagWidth / 4}
          opacity="0.8"
        />
      )}

      {/* Drag indicator */}
      {isDragging && (
        <rect
          x={0}
          y={0}
          width={bagWidth}
          height={bagHeight}
          fill="#06b6d4"
          opacity="0.1"
          rx={bagWidth / 4}
          ry={bagWidth / 4}
        />
      )}
    </g>
  );
};
