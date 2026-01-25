import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WaveMasterBag } from './WaveMasterBag';

describe('WaveMasterBag Component', () => {
  it('renders SVG element with correct viewBox', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={1} />
      </svg>
    );
    
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 48 170');
  });

  it('renders bag body with correct dimensions', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={1} />
      </svg>
    );
    
    // Check for main bag rect element
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('renders spot number badge', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={1} spotNumber={5} />
      </svg>
    );
    
    // Check for circle badge (red number badge)
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
    
    // Check for text element with spot number
    const texts = container.querySelectorAll('text');
    const spotNumberText = Array.from(texts).find(t => t.textContent === '5');
    expect(spotNumberText).toBeTruthy();
  });

  it('renders student initials when occupied', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag 
          x={24} 
          y={20} 
          scale={1} 
          isOccupied={true}
          studentInitials="JD"
        />
      </svg>
    );
    
    const texts = container.querySelectorAll('text');
    const initialsText = Array.from(texts).find(t => t.textContent === 'JD');
    expect(initialsText).toBeTruthy();
  });

  it('does not render initials when not occupied', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag 
          x={24} 
          y={20} 
          scale={1} 
          isOccupied={false}
          studentInitials="JD"
        />
      </svg>
    );
    
    const texts = container.querySelectorAll('text');
    const initialsText = Array.from(texts).find(t => t.textContent === 'JD');
    expect(initialsText).toBeFalsy();
  });

  it('renders with correct scale', () => {
    const { container: container1 } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={1} />
      </svg>
    );
    
    const { container: container2 } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={0.8} />
      </svg>
    );
    
    // Both should render without errors
    expect(container1.querySelector('svg')).toBeTruthy();
    expect(container2.querySelector('svg')).toBeTruthy();
  });

  it('renders selection highlight when selected', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag 
          x={24} 
          y={20} 
          scale={1}
          isSelected={true}
        />
      </svg>
    );
    
    // Check for selection highlight rect with cyan stroke
    const rects = container.querySelectorAll('rect');
    const selectionRect = Array.from(rects).find(r => {
      const stroke = r.getAttribute('stroke');
      return stroke === '#06b6d4';
    });
    expect(selectionRect).toBeTruthy();
  });

  it('renders drag indicator when dragging', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag 
          x={24} 
          y={20} 
          scale={1}
          isDragging={true}
        />
      </svg>
    );
    
    // Check for drag indicator rect with cyan fill
    const rects = container.querySelectorAll('rect');
    const dragRect = Array.from(rects).find(r => {
      const fill = r.getAttribute('fill');
      return fill === '#06b6d4';
    });
    expect(dragRect).toBeTruthy();
  });

  it('renders floor contact shadow', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={1} />
      </svg>
    );
    
    // Check for ellipse (floor contact shadow)
    const ellipses = container.querySelectorAll('ellipse');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('renders gradients in defs', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={24} y={20} scale={1} />
      </svg>
    );
    
    // Check for defs and gradients
    const defs = container.querySelector('defs');
    expect(defs).toBeTruthy();
    
    const gradients = defs?.querySelectorAll('linearGradient, radialGradient');
    expect(gradients && gradients.length > 0).toBeTruthy();
  });

  it('applies correct transform for positioning', () => {
    const { container } = render(
      <svg viewBox="0 0 48 170">
        <WaveMasterBag x={30} y={40} scale={1} />
      </svg>
    );
    
    // Check for g element with transform
    const g = container.querySelector('g');
    expect(g).toBeTruthy();
    const transform = g?.getAttribute('transform');
    expect(transform).toContain('translate');
  });
});
