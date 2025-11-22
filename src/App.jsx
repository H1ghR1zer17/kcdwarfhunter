import { useState, useRef, useEffect } from 'react';
import './App.css';
import { PatternAnalyzer } from './utils/PatternAnalyzer';
import { IntervalPredictor } from './utils/IntervalPredictor';
import { DungeonGrid } from './components/DungeonGrid';
import { PatternAnalysis } from './components/PatternAnalysis';

function App() {
  const [knownPositions, setKnownPositions] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [maxRows, setMaxRows] = useState(90);
  const [maxCols, setMaxCols] = useState(5);
  const [iterations, setIterations] = useState(10);
  const [quickFloor, setQuickFloor] = useState('');
  const [quickEntry, setQuickEntry] = useState('');
  const [bulkImport, setBulkImport] = useState('');
  const [columnMethod, setColumnMethod] = useState('random');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  const quickFloorRef = useRef(null);

  useEffect(() => {
    // Auto-focus quick floor on load
    quickFloorRef.current?.focus();
  }, []);

  const addQuick = (col) => {
    const row = parseInt(quickFloor);

    if (isNaN(row) || row < 1) {
      alert('Please enter a floor number first!');
      quickFloorRef.current?.focus();
      return;
    }

    if (col < 1 || col > maxCols) {
      alert(`Column must be between 1 and ${maxCols}`);
      return;
    }

    // Check for duplicates
    const exists = knownPositions.some(p => p.row === row && p.col === col);
    if (exists) {
      alert(`Position Floor ${row}, Col ${col} already added!`);
      return;
    }

    const newPositions = [...knownPositions, { row, col }].sort((a, b) => a.row - b.row);
    setKnownPositions(newPositions);
    setQuickFloor('');
    quickFloorRef.current?.focus();
  };

  const handleQuickEntry = () => {
    if (!quickEntry.trim()) return;

    const cleaned = quickEntry.replace(/[\[\]]/g, '');
    let row, col;

    if (cleaned.includes(',')) {
      const parts = cleaned.split(',').map(s => s.trim());
      row = parseInt(parts[0]);
      col = parseInt(parts[1]);
    } else if (cleaned.includes(' ')) {
      const parts = cleaned.split(/\s+/);
      row = parseInt(parts[0]);
      col = parseInt(parts[1]);
    } else {
      alert('Please use format: floor,column (e.g., 7,2)');
      return;
    }

    if (isNaN(row) || isNaN(col)) {
      alert('Invalid numbers. Use format: floor,column (e.g., 7,2)');
      return;
    }

    if (col < 1 || col > maxCols) {
      alert(`Column must be between 1 and ${maxCols}`);
      return;
    }

    const exists = knownPositions.some(p => p.row === row && p.col === col);
    if (exists) {
      alert(`Position Floor ${row}, Col ${col} already added!`);
      setQuickEntry('');
      return;
    }

    const newPositions = [...knownPositions, { row, col }].sort((a, b) => a.row - b.row);
    setKnownPositions(newPositions);
    setQuickEntry('');
  };

  const handleBulkImport = () => {
    if (!bulkImport.trim()) return;

    const positions = [];
    const bracketMatches = [...bulkImport.matchAll(/\[(\d+),\s*(\d+)\]/g)];

    if (bracketMatches.length > 0) {
      bracketMatches.forEach(match => {
        positions.push({
          row: parseInt(match[1]),
          col: parseInt(match[2])
        });
      });
    } else {
      const parts = bulkImport.split(/\s+/);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.includes(',')) {
          const [row, col] = part.split(',').map(s => parseInt(s.trim()));
          if (!isNaN(row) && !isNaN(col)) {
            positions.push({ row, col });
          }
        }
      }
    }

    if (positions.length === 0) {
      alert('No valid positions found. Use format: [7,2],[19,5] or 7,2 19,5');
      return;
    }

    setKnownPositions(positions.sort((a, b) => a.row - b.row));
    setBulkImport('');
  };

  const clearPositions = () => {
    setKnownPositions([]);
    setPredictions([]);
    setShowAnalysis(false);
  };

  const runPrediction = () => {
    if (knownPositions.length === 0) {
      alert('Please add at least one known Dwarf King position!');
      return;
    }

    const useRandomColumns = columnMethod === 'random';

    // Analyze pattern
    const analyzer = new PatternAnalyzer(knownPositions, maxCols);
    const pattern = analyzer.analyze();

    // Analyze intervals
    const intervalPredictor = new IntervalPredictor(knownPositions);
    const stats = intervalPredictor.getStats();

    setShowAnalysis(true);
    setAnalysisData({ stats, pattern, intervalPredictor, useRandomColumns });

    // Helper function for weighted random column selection
    function getWeightedRandomColumn(pattern, maxCols) {
      if (pattern.type === 'frequency' && pattern.frequencies) {
        const weights = [];
        for (let c = 1; c <= maxCols; c++) {
          const freq = pattern.frequencies[c] || 0;
          weights.push(freq + 0.5);
        }

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < weights.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            return i + 1;
          }
        }
        return maxCols;
      } else {
        return pattern.nextCol;
      }
    }

    // Generate predictions
    const newPredictions = [];
    const allPositions = [...knownPositions];
    const usedRows = new Set(knownPositions.map(p => p.row));

    for (let i = 0; i < iterations; i++) {
      const predictor = new IntervalPredictor(allPositions);
      const nextRow = predictor.predictNextRow(usedRows, maxRows);

      if (nextRow > maxRows) break;

      let nextCol;
      let confidenceLevel;
      let confidence;

      if (useRandomColumns) {
        nextCol = Math.floor(Math.random() * maxCols) + 1;
        confidenceLevel = 'medium';
        confidence = 0.5;
      } else {
        const currentAnalyzer = new PatternAnalyzer(
          i < 3 ? allPositions : knownPositions,
          maxCols
        );
        const currentPattern = currentAnalyzer.analyze();
        confidence = currentPattern.confidence;

        if (confidence >= 0.9 && (currentPattern.type === 'sequential' || currentPattern.type === 'repeating')) {
          nextCol = currentPattern.nextCol;
        } else if (confidence >= 0.6) {
          nextCol = getWeightedRandomColumn(currentPattern, maxCols);
        } else {
          nextCol = getWeightedRandomColumn(currentPattern, maxCols);
        }

        if (confidence >= 0.8) confidenceLevel = 'high';
        else if (confidence >= 0.5) confidenceLevel = 'medium';
        else confidenceLevel = 'low';
      }

      const prediction = {
        row: nextRow,
        col: nextCol,
        confidence: confidenceLevel,
        score: confidence
      };

      newPredictions.push(prediction);
      allPositions.push({ row: nextRow, col: nextCol });
      usedRows.add(nextRow);
    }

    setPredictions(newPredictions);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === quickFloorRef.current) {
        if (e.altKey && e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          const col = parseInt(e.key);
          addQuick(col);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickFloor, knownPositions, maxCols]);

  return (
    <div className="App">
      {/* Torches */}
      <div className="torch torch-left">
        <div className="flame"></div>
      </div>
      <div className="torch torch-right">
        <div className="flame"></div>
      </div>

      <div className="container">
        <h1>⚔ NIBELUNGEN TREASURES ⚔</h1>
        <p className="subtitle">Welcome to Harpapi's hidden...Lair</p>

        <div className="main-grid">
          {/* Control Panel */}
          <div>
            <div className="panel">
              <div className="panel-title">⚙ Mine Configuration</div>

              <label>Total Floors (Depth)</label>
              <input
                type="number"
                value={maxRows}
                onChange={(e) => setMaxRows(parseInt(e.target.value) || 90)}
                min="10"
                max="200"
              />
              <p className="help-text">Maximum floor depth for predictions</p>
            </div>

            <div className="panel" style={{ marginTop: '20px' }}>
              <div className="panel-title">📍 Known Kings</div>

              <label>Quick Entry - Floor Number</label>
              <input
                ref={quickFloorRef}
                type="number"
                value={quickFloor}
                onChange={(e) => setQuickFloor(e.target.value)}
                placeholder="Type floor number (e.g., 7)"
                style={{ fontSize: '1.3em', fontWeight: 'bold', textAlign: 'center' }}
                min="1"
              />

              <label style={{ marginTop: '15px' }}>Then Click Column (1-5)</label>
              <div className="column-buttons-grid">
                {Array.from({ length: 5 }, (_, i) => i + 1).map(col => (
                  <button
                    key={col}
                    onClick={() => addQuick(col)}
                    className="column-btn"
                  >
                    {col}
                  </button>
                ))}
              </div>
              <p className="help-text">
                💡 Super Fast: Type floor → Click column button (or use Alt+1 to Alt+5)
              </p>

              <label style={{ marginTop: '20px' }}>Or Type Floor,Column</label>
              <input
                type="text"
                value={quickEntry}
                onChange={(e) => setQuickEntry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickEntry()}
                placeholder="e.g., 7,2 then Enter"
                style={{ fontSize: '1.1em', fontWeight: 'bold' }}
              />

              <label style={{ marginTop: '20px' }}>Or Bulk Import</label>
              <input
                type="text"
                value={bulkImport}
                onChange={(e) => setBulkImport(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBulkImport()}
                placeholder="e.g., [7,2],[19,3],[31,5] or 7,2 19,3 31,5"
              />
              <button onClick={handleBulkImport} className="secondary">
                Import All
              </button>

              <div className="position-display">
                {knownPositions.length === 0 ? (
                  <p className="help-text">No positions added yet</p>
                ) : (
                  knownPositions.map((pos, idx) => (
                    <span key={idx} className="position-tag">
                      F{pos.row}, C{pos.col}
                    </span>
                  ))
                )}
              </div>
              <button onClick={clearPositions} className="secondary">
                Clear All
              </button>
            </div>

            <div className="panel" style={{ marginTop: '20px' }}>
              <div className="panel-title">🔮 Oracle Settings</div>

              <label>Column Prediction Method</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="columnMethod"
                    value="random"
                    checked={columnMethod === 'random'}
                    onChange={(e) => setColumnMethod(e.target.value)}
                  />
                  <span>🎲 Random Columns (1-5)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="columnMethod"
                    value="pattern"
                    checked={columnMethod === 'pattern'}
                    onChange={(e) => setColumnMethod(e.target.value)}
                  />
                  <span>🧠 Pattern Detection</span>
                </label>
              </div>
              <p className="help-text">
                Random: Generates columns 1-5 at random. Pattern: Tries to detect and follow patterns.
              </p>

              <label style={{ marginTop: '20px' }}>Predictions to Generate</label>
              <input
                type="number"
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value) || 10)}
                min="1"
                max="50"
              />

              <button
                onClick={runPrediction}
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #b8860b 100%)',
                  fontSize: '1.1em',
                  padding: '18px'
                }}
              >
                🎯 Invoke Oracle
              </button>
            </div>

            {showAnalysis && analysisData && (
              <PatternAnalysis
                stats={analysisData.stats}
                pattern={analysisData.pattern}
                knownPositions={knownPositions}
                intervalPredictor={analysisData.intervalPredictor}
                useRandomColumns={analysisData.useRandomColumns}
              />
            )}
          </div>

          {/* Dungeon Grid */}
          <div>
            <div className="panel">
              <div className="panel-title">🗺 The Mines - Treasure Map</div>
              <DungeonGrid
                knownPositions={knownPositions}
                predictions={predictions}
                maxCols={maxCols}
              />
              <p className="scroll-hint">
                Scroll horizontally if needed • Known positions glow gold • Predictions shown in
                green/yellow/red by confidence
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
