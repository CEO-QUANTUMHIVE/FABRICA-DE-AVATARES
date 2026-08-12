export type RandomSource = () => number;

const shuffle = (values: string[], random: RandomSource) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export class IdleSequencer {
  private queue: string[] = [];
  private previousId: string | null;
  private longWaitPending = false;

  constructor(
    private readonly idleIds: string[],
    private readonly fallbackId: string,
    private readonly longWaitId?: string,
    private readonly random: RandomSource = Math.random,
  ) {
    if (idleIds.length === 0) {
      throw new Error("IdleSequencer requires at least one idle asset");
    }
    this.previousId = fallbackId;
  }

  next() {
    if (this.longWaitPending && this.longWaitId) {
      this.longWaitPending = false;
      this.previousId = this.longWaitId;
      return this.longWaitId;
    }

    if (this.queue.length === 0) {
      this.queue = shuffle(this.idleIds, this.random);
      if (
        this.previousId &&
        this.queue.length > 1 &&
        this.queue[0] === this.previousId
      ) {
        [this.queue[0], this.queue[1]] = [this.queue[1], this.queue[0]];
      }
    }

    const nextId = this.queue.shift() ?? this.fallbackId;
    this.previousId = nextId;
    if (this.queue.length === 0 && this.longWaitId) {
      this.longWaitPending = true;
    }
    return nextId;
  }
}
