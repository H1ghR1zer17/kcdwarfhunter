// Row interval prediction
export class IntervalPredictor {
  constructor(positions) {
    this.positions = positions;
    this.intervals = this.calculateIntervals();
  }

  calculateIntervals() {
    const intervals = [];
    for (let i = 1; i < this.positions.length; i++) {
      intervals.push(this.positions[i].row - this.positions[i - 1].row);
    }
    return intervals;
  }

  // Detect Fibonacci-like pattern in intervals
  detectFibonacci() {
    if (this.intervals.length < 3) return null;

    // Check if intervals follow Fibonacci pattern: each = sum of previous two
    let isFib = true;
    const tolerance = 2; // Allow slight variation

    for (let i = 2; i < this.intervals.length; i++) {
      const expected = this.intervals[i - 1] + this.intervals[i - 2];
      const actual = this.intervals[i];
      if (Math.abs(actual - expected) > tolerance) {
        isFib = false;
        break;
      }
    }

    if (isFib) {
      // Predict next Fibonacci number
      const nextInterval = this.intervals[this.intervals.length - 1] +
                         this.intervals[this.intervals.length - 2];
      return {
        type: 'fibonacci',
        nextInterval: nextInterval,
        confidence: 0.95
      };
    }

    return null;
  }

  predictNextRow(usedRows, maxRows) {
    if (this.intervals.length === 0) {
      return Math.floor(Math.random() * 20) + 1;
    }

    // Check for Fibonacci pattern first
    const fibPattern = this.detectFibonacci();
    let nextInterval;

    if (fibPattern) {
      nextInterval = fibPattern.nextInterval;
    } else {
      // Use median for stability
      const sorted = [...this.intervals].sort((a, b) => a - b);
      nextInterval = sorted[Math.floor(sorted.length / 2)];
    }

    const lastRow = this.positions[this.positions.length - 1].row;
    let nextRow = lastRow + nextInterval;

    if (nextRow > maxRows || usedRows.has(nextRow)) {
      for (let i = lastRow + 1; i <= maxRows; i++) {
        if (!usedRows.has(i)) {
          nextRow = i;
          break;
        }
      }
    }

    return nextRow;
  }

  getStats() {
    if (this.intervals.length === 0) return { avg: 0, median: 0, min: 0, max: 0, pattern: 'insufficient' };

    const sorted = [...this.intervals].sort((a, b) => a - b);
    const fibPattern = this.detectFibonacci();

    return {
      avg: this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      pattern: fibPattern ? 'Fibonacci' : 'Variable',
      isFibonacci: !!fibPattern
    };
  }
}
