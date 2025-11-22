import React from 'react';

export function PatternAnalysis({ stats, pattern, knownPositions, intervalPredictor, useRandomColumns }) {
  return (
    <div className="panel" id="pattern-panel">
      <div className="panel-title">📊 Pattern Analysis</div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-label">Avg Floor Gap</div>
          <div className="stat-value">{stats.avg.toFixed(1)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Pattern Type</div>
          <div className="stat-value" style={{ fontSize: '1em' }}>
            {useRandomColumns ? 'RANDOM' : pattern.type.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="analysis-box">
        <strong style={{ color: '#d4af37' }}>Column Pattern:</strong>
        <div style={{ marginTop: '10px', color: '#b8860b' }}>
          {useRandomColumns
            ? 'Using random column generation (1-5)'
            : pattern.description}
        </div>
        <div className="pattern-viz">
          {knownPositions.map((pos, idx) => (
            <div key={idx} className="pattern-box">
              {pos.col}
            </div>
          ))}
        </div>

        {/* Show floor intervals if we have them */}
        {stats.isFibonacci && intervalPredictor.intervals.length > 0 && (
          <div
            style={{
              marginTop: '15px',
              padding: '10px',
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '5px'
            }}
          >
            <strong style={{ color: '#4CAF50' }}>Floor Gaps (Fibonacci!):</strong>
            <br />
            <div style={{ marginTop: '8px', fontFamily: 'monospace', color: '#d4af37' }}>
              {intervalPredictor.intervals.join(' → ')}
            </div>
            <div
              style={{
                marginTop: '5px',
                fontSize: '0.85em',
                color: '#8b7355',
                fontStyle: 'italic'
              }}
            >
              Each gap = sum of previous two gaps (classic Fibonacci!)
            </div>
          </div>
        )}

        {!stats.isFibonacci && intervalPredictor.intervals.length > 0 && (
          <div style={{ marginTop: '10px', fontFamily: 'monospace', color: '#8b7355' }}>
            Floor gaps: {intervalPredictor.intervals.join(', ')}
          </div>
        )}
      </div>

      <div className="algorithm-info">
        <strong>Column Algorithm:</strong>{' '}
        {useRandomColumns
          ? `🎲 RANDOM (1-${knownPositions.length > 0 ? Math.max(...knownPositions.map(p => p.col)) : 5})`
          : pattern.type.toUpperCase()}{' '}
        {!useRandomColumns && (
          <>
            | <strong>Confidence:</strong> {(pattern.confidence * 100).toFixed(0)}%
          </>
        )}
        <br />
        {stats.isFibonacci
          ? '📊 FIBONACCI DETECTED! Floor gaps follow Fibonacci sequence'
          : `Gap Range: ${stats.min}-${stats.max} floors`}
      </div>
    </div>
  );
}
