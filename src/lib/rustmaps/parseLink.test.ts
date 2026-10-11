import { describe, expect, it } from "vitest";
import { parseMapLink } from "./parseLink";

describe("parseMapLink", () => {
  it.each([
    ["https://rustmaps.com/map/4500_123456", 4500, 123456, false],
    ["https://www.rustmaps.com/map/4500_123456/", 4500, 123456, false],
    ["rustmaps.com/map/3500_42", 3500, 42, false],
    ["  4250_99999  ", 4250, 99999, false],
    ["https://rustmaps.com/map/4500_123456?staging=true", 4500, 123456, true],
  ])("reads size and seed from %s", (input, size, seed, staging) => {
    const r = parseMapLink(input);
    expect(r.ok).toBe(true);
    if (r.ok && r.value.kind === "seedSize") {
      expect(r.value).toMatchObject({ size, seed, staging });
    } else {
      throw new Error("expected seedSize");
    }
  });

  it("reads a custom map id", () => {
    const r = parseMapLink("https://rustmaps.com/map/EFC8296C9F6E4CACB750DC4ED0A95155");
    expect(r).toEqual({
      ok: true,
      value: {
        kind: "id",
        mapId: "efc8296c9f6e4cacb750dc4ed0a95155",
        key: "id:efc8296c9f6e4cacb750dc4ed0a95155",
      },
    });
  });

  it("gives the same cache key for equivalent links", () => {
    const a = parseMapLink("https://rustmaps.com/map/4500_1");
    const b = parseMapLink("4500_1");
    expect(a.ok && b.ok && a.value.key === b.value.key).toBe(true);
  });

  it.each([
    ["", "paste"],
    ["hello world", "doesn't look like a link"],
    ["https://google.com/map/4500_1", "Only rustmaps.com"],
    ["https://rustmaps.com/servers", "isn't a map page"],
    ["https://rustmaps.com/map/banana", "Couldn't find"],
    ["https://rustmaps.com/map/200_1", "out of range"],
    ["https://rustmaps.com/map/4500_4294967295", "too large"],
  ])("rejects %j with a clear message", (input, message) => {
    const r = parseMapLink(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });
});
