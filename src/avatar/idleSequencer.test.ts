import { describe, expect, it } from "vitest";
import { IdleSequencer } from "./idleSequencer";

describe("IdleSequencer", () => {
  it("does not repeat the current idle when alternatives exist", () => {
    const sequence = new IdleSequencer(
      ["idle_1", "idle_2", "idle_3"],
      "idle_1",
      undefined,
      () => 0.99,
    );
    expect(sequence.next()).not.toBe("idle_1");
  });

  it("inserts the long wait idle after a complete cycle", () => {
    const sequence = new IdleSequencer(
      ["idle_1", "idle_2"],
      "idle_1",
      "idle_wait",
      () => 0,
    );
    const firstCycle = [sequence.next(), sequence.next()];
    expect(new Set(firstCycle)).toEqual(new Set(["idle_1", "idle_2"]));
    expect(sequence.next()).toBe("idle_wait");
  });
});
