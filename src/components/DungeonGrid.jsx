import React from 'react';

export function DungeonGrid({ knownPositions, predictions, maxCols }) {
  if (knownPositions.length === 0 && predictions.length === 0) {
    return (
      <div className="dungeon-grid">
        <p className="help-text" style={{ textAlign: 'center', padding: '40px' }}>
          Add known Dwarf King positions and invoke the Oracle to reveal the map...
        </p>
      </div>
    );
  }

  // Create grid with all rows in range for spatial awareness
  const allPositions = [...knownPositions, ...predictions];
  const minRow = Math.min(...allPositions.map(p => p.row));
  const maxRow = Math.max(...allPositions.map(p => p.row));

  // Show all rows from min to max for spatial awareness
  const sortedRows = [];
  for (let i = minRow; i <= maxRow; i++) {
    sortedRows.push(i);
  }

  return (
    <div className="dungeon-grid">
      <div className="grid-container">
        {sortedRows.map(row => (
          <div key={row} className="floor-row">
            <div className="floor-label">Floor {row}</div>
            <div className="floor-cells">
              {Array.from({ length: maxCols }, (_, i) => i + 1).map(col => {
                const known = knownPositions.find(p => p.row === row && p.col === col);
                const predicted = predictions.find(p => p.row === row && p.col === col);

                let cellClass = 'cell';
                let cellContent = '';

                if (known) {
                  cellClass += ' known';
                  cellContent = '👑';
                } else if (predicted) {
                  cellClass += ` predicted predicted-${predicted.confidence}`;
                  cellContent = '?';
                }

                return (
                  <React.Fragment key={col}>
                    <div className={cellClass}>{cellContent}</div>
                    {col < maxCols && (
                      <div
                        className="dungeon-pillar"
                        style={{ left: `${col * 55 - 1}px` }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
