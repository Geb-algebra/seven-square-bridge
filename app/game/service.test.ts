import { calcScore, validateMeld } from "./service";

describe("validateMeld", () => {
  it("should accept single seven", () => {
    expect(validateMeld(["S07"])).toBeUndefined();
  });

  it("should accept two consecutive rank cards including seven", () => {
    expect(validateMeld(["S06", "S07"])).toBeUndefined();
    expect(validateMeld(["S07", "S08"])).toBeUndefined();
  });

  it("should accept more than three consecutive rank cards", () => {
    expect(validateMeld(["S06", "S07", "S08"])).toBeUndefined();
    expect(validateMeld(["C08", "C06", "C07"])).toBeUndefined();
    expect(validateMeld(["S11", "S12", "S13"])).toBeUndefined();
    expect(validateMeld(["S01", "S02", "S03", "S04"])).toBeUndefined();
  });

  it("should accept more than three same rank cards", () => {
    expect(validateMeld(["S07", "H07", "D07"])).toBeUndefined();
    expect(validateMeld(["S11", "H11", "C11", "D11"])).toBeUndefined();
  });

  it("should reject otherwise", () => {
    expect(() => validateMeld(["S06"])).toThrowError();
    expect(() => validateMeld(["S06", "S08"])).toThrowError();
    expect(() => validateMeld(["S06", "S07", "H08"])).toThrowError();
    expect(() => validateMeld(["S06", "S07", "S09"])).toThrowError();
    expect(() => validateMeld(["S06", "H06", "D05"])).toThrowError();
    expect(() => validateMeld(["S07", "H07"])).toThrowError();
    expect(() => validateMeld(["S12", "S13", "S01"])).toThrowError();
  });
});

describe("calcScore", () => {
  it("should be sum of the ranks if nothing happens", () => {
    expect(calcScore(["S02", "S03", "S04"], "S05")).toBe(2 + 3 + 4);
    expect(calcScore(["S08", "H09", "D10", "C11", "D12", "H13"], "S01")).toBe(
      8 + 9 + 10 + 11 + 12 + 13,
    );
  });
  it("should add 50 points for each seven", () => {
    expect(calcScore(["S07", "H07", "D07"], "S05")).toBe(50 * 3);
    expect(calcScore(["S07", "H08", "D09", "C10"], "S05")).toBe(50 + 8 + 9 + 10);
  });
  it("should double the score for each ace", () => {
    expect(calcScore(["S01", "H01", "D01"], "S05")).toBe((1 + 1 + 1) * 2 ** 3);
    expect(calcScore(["S01", "H01", "D02", "C03"], "S05")).toBe((1 + 1 + 2 + 3) * 2 ** 2);
    expect(calcScore(["S01", "D07", "C13"], "S05")).toBe((1 + 50 + 13) * 2);
  });
  it("should add 100 points and multiply by 5 for each joker", () => {
    expect(calcScore(["JO1", "JO2"], "S05")).toBe(100 * 2 * 5 * 5);
    expect(calcScore(["JO1", "S02", "S03"], "S05")).toBe((100 + 2 + 3) * 5);
    expect(calcScore(["JO1", "S02", "S07"], "S05")).toBe((100 + 2 + 50) * 5);
  });
  it("should square the score if the first card is joker and dora is joker", () => {
    expect(calcScore(["JO1", "S02", "S03"], "JO2")).toBe(((100 + 2 + 3) * 5) ** 2);
  });
  it("should double the score for each consecutive card to dora", () => {
    expect(calcScore(["S02", "S03"], "S05")).toBe(2 + 3);
    expect(calcScore(["S02", "S04"], "S05")).toBe(2 + 4);
    expect(calcScore(["S02", "S06"], "S05")).toBe((2 + 6) * 2);
    expect(calcScore(["S02", "S06", "H06"], "S05")).toBe((2 + 6 + 6) * 2 * 2);
    expect(calcScore(["S02", "S07"], "S05")).toBe(2 + 50);
  });
  it("should be in the hell", () => {
    expect(calcScore(["JO1", "S01", "H01", "D01", "C01", "C07", "H07"], "JO2")).toBe(
      ((100 + 1 + 1 + 1 + 1 + 50 + 50) * 2 * 2 * 2 * 2 * 5) ** 2,
    );
  });
});
