export class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private readonly threshold = 5
  private readonly resetTimeout = 60000 // 1 minute

  private isOpen(): boolean {
    if (this.failures >= this.threshold) {
      const now = Date.now()
      if (now - this.lastFailure >= this.resetTimeout) {
        this.reset()
        return false
      }
      return true
    }
    return false
  }

  private reset(): void {
    this.failures = 0
    this.lastFailure = 0
  }

  private recordFailure(): void {
    this.failures++
    this.lastFailure = Date.now()
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open')
    }

    try {
      const result = await fn()
      this.reset()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}
