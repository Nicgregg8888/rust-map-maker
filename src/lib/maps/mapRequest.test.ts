import { describe, expect, it } from "vitest";
import { parseMapRequest } from "./mapRequest";

describe("parseMapRequest", () => {
  it.each([
    ["123456", "4500", 123456, 4500],
    [" 42 ", "3,500", 42, 3500],
    [0, 1000, 0, 1000],
    ["2147483647", "6000", 2147483647, 6000],
  ])("accepts seed %j and size %j", (seedIn, sizeIn, seed, size) => {
    expect(parseMapRequest(seedIn, sizeIn)).toEqual({
      ok: true,
      value: { seed, size, key: `proc:${size}_${seed}` },
    });
  });

  it.each([
    ["", "4500", "seed", "Enter the server's map seed"],
    ["abc", "4500", "seed", "whole number"],
    ["-5", "4500", "seed", "whole number"],
    ["2147483648", "4500", "seed", "whole number"],
    ["12.5", "4500", "seed", "whole number"],
    ["1", "", "size", "Enter the map size"],
    ["1", "999", "size", "from 1000 to 6000"],
    ["1", "6001", "size", "from 1000 to 6000"],
    ["1", {}, "size", "from 1000 to 6000"],
  ])("rejects seed %j size %j", (seedIn, sizeIn, field, message) => {
    const r = parseMapRequest(seedIn, sizeIn);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.field).toBe(field);
      expect(r.error).toContain(message);
    }
  });
});
