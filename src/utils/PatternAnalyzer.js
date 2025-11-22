// Advanced Pattern Detection Algorithms
export class PatternAnalyzer {
  constructor(positions, maxCols) {
    this.positions = positions;
    this.maxCols = maxCols;
    this.cols = positions.map(p => p.col);
  }

  // Detect sequential pattern (1,2,3,4,5,1,2,3...)
  detectSequential() {
    if (this.cols.length < 3) return null;

    for (let i = 1; i < this.cols.length; i++) {
      const expected = (this.cols[i - 1] % this.maxCols) + 1;
      if (this.cols[i] !== expected) return null;
    }

    return {
      type: 'sequential',
      confidence: 1.0,
      nextCol: (this.cols[this.cols.length - 1] % this.maxCols) + 1,
      description: `Sequential (1→2→3...→${this.maxCols}→1)`
    };
  }

  // Detect repeating pattern
  detectRepeating() {
    if (this.cols.length < 4) return null;

    for (let len = 2; len <= Math.floor(this.cols.length / 2); len++) {
      const pattern = this.cols.slice(0, len);
      let matches = 0;
      let total = 0;

      for (let i = 0; i < this.cols.length; i++) {
        const expected = pattern[i % len];
        if (this.cols[i] === expected) matches++;
        total++;
      }

      const accuracy = matches / total;
      if (accuracy >= 0.85) {
        return {
          type: 'repeating',
          confidence: accuracy,
          pattern: pattern,
          nextCol: pattern[this.cols.length % len],
          description: `Repeating [${pattern.join(', ')}] (${(accuracy * 100).toFixed(0)}% match)`
        };
      }
    }
    return null;
  }

  // Markov chain - predict based on previous column
  detectMarkov() {
    if (this.cols.length < 3) return null;

    const transitions = {};
    for (let i = 0; i < this.cols.length - 1; i++) {
      const from = this.cols[i];
      const to = this.cols[i + 1];
      if (!transitions[from]) transitions[from] = {};
      transitions[from][to] = (transitions[from][to] || 0) + 1;
    }

    const lastCol = this.cols[this.cols.length - 1];
    if (transitions[lastCol]) {
      const next = Object.entries(transitions[lastCol])
        .sort((a, b) => b[1] - a[1])[0];
      const total = Object.values(transitions[lastCol]).reduce((a, b) => a + b, 0);
      const confidence = next[1] / total;

      if (confidence >= 0.4) {
        return {
          type: 'markov',
          confidence: confidence,
          nextCol: parseInt(next[0]),
          description: `Markov chain: ${lastCol}→${next[0]} (${(confidence * 100).toFixed(0)}% probable)`
        };
      }
    }
    return null;
  }

  // Frequency-based prediction
  detectFrequency() {
    const counts = {};
    this.cols.forEach(col => counts[col] = (counts[col] || 0) + 1);
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const mostCommon = sorted[0];
    let confidence = mostCommon[1] / this.cols.length;

    // IMPORTANT: Reduce confidence with small sample sizes
    // 2 positions with same column = 100% but should be LOW confidence
    if (this.cols.length < 5) {
      // Penalize heavily with small samples
      confidence = confidence * (this.cols.length / 10);
    } else if (this.cols.length < 10) {
      // Moderate penalty for medium samples
      confidence = confidence * 0.7;
    }

    return {
      type: 'frequency',
      confidence: Math.max(0.3, confidence), // Never below 30%
      nextCol: parseInt(mostCommon[0]),
      frequencies: counts,
      description: `Most frequent: Column ${mostCommon[0]} (${(confidence * 100).toFixed(0)}% of time, ${this.cols.length} samples)`
    };
  }

  // Run all algorithms and return best match
  analyze() {
    const results = [
      this.detectSequential(),
      this.detectRepeating(),
      this.detectMarkov(),
      this.detectFrequency()
    ].filter(r => r !== null);

    return results.sort((a, b) => b.confidence - a.confidence)[0];
  }
}
