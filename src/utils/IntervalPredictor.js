// Row interval prediction
export class IntervalPredictor {
  constructor(positions) {
    // Always work with rows sorted ascending to keep interval math stable
    this.positions = [...positions].sort((a, b) => a.row - b.row);
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
    // With no history, scatter a reasonable guess inside the first 20 rows
    if (this.intervals.length === 0) return Math.floor(Math.random() * 20) + 1;

    const sortedRows = this.positions.map(p => p.row).sort((a, b) => a - b);
    const typicalInterval = this.estimateTypicalInterval(maxRows);

    // Fill interior gaps first (pick the largest gap available)
    const gaps = [];
    for (let i = 0; i < sortedRows.length - 1; i++) {
      const start = sortedRows[i];
      const end = sortedRows[i + 1];
      const gap = end - start - 1;
      if (gap > 0) gaps.push({ start, end, gap });
    }

    gaps.sort((a, b) => b.gap - a.gap);

    for (const { start, end, gap } of gaps) {
      // Aim near the middle but respect a typical interval so we add more than one over time
      let candidate = start + Math.max(1, Math.min(Math.floor(gap / 2), typicalInterval));
      while (candidate < end && usedRows.has(candidate)) candidate++;
      if (candidate < end) return candidate;
    }

    // If there is room before the first known row, try to backfill
    const firstRow = sortedRows[0];
    if (firstRow - 1 >= typicalInterval) {
      let candidate = Math.max(1, firstRow - typicalInterval);
      while (candidate < firstRow && usedRows.has(candidate)) candidate++;
      if (candidate < firstRow) return candidate;
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

    const lastRow = sortedRows[sortedRows.length - 1];
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

  estimateTypicalInterval(maxRows) {
    if (this.intervals.length === 0) return Math.max(2, Math.round(maxRows / 10));

    const sorted = [...this.intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    // Encourage filling by capping with a density-based interval
    const densityTarget = Math.max(2, Math.round(maxRows / Math.max(this.positions.length + 4, 6)));
    return Math.max(2, Math.min(median, densityTarget));
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
