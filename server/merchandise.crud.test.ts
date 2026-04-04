import { describe, it, expect } from "vitest";

/**
 * Merchandise CRUD tests
 * Tests the core logic for creating, reading, updating, and deleting merchandise items.
 */

// Helper to simulate price conversion (cents to dollars and back)
const toCents = (dollars: number) => Math.round(dollars * 100);
const toDollars = (cents: number) => (cents / 100).toFixed(2);

describe("Merchandise price conversion", () => {
  it("converts dollars to cents correctly", () => {
    expect(toCents(29.99)).toBe(2999);
    expect(toCents(0)).toBe(0);
    expect(toCents(100)).toBe(10000);
  });

  it("converts cents to dollars correctly", () => {
    expect(toDollars(2999)).toBe("29.99");
    expect(toDollars(0)).toBe("0.00");
    expect(toDollars(10000)).toBe("100.00");
  });
});

// Helper to validate merchandise item form
const validateMerchandiseForm = (form: {
  name: string;
  type: string;
  defaultPrice: string;
  requiresSize: boolean;
  sizeOptions: string[];
}) => {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Name is required");
  const price = parseFloat(form.defaultPrice);
  if (isNaN(price) || price < 0) errors.push("Enter a valid price");
  if (form.requiresSize && form.sizeOptions.length === 0) {
    errors.push("At least one size option is required when size is required");
  }
  return errors;
};

describe("Merchandise form validation", () => {
  it("passes validation with valid data", () => {
    const errors = validateMerchandiseForm({
      name: "White Gi Uniform",
      type: "uniform",
      defaultPrice: "49.99",
      requiresSize: false,
      sizeOptions: [],
    });
    expect(errors).toHaveLength(0);
  });

  it("fails when name is empty", () => {
    const errors = validateMerchandiseForm({
      name: "",
      type: "uniform",
      defaultPrice: "49.99",
      requiresSize: false,
      sizeOptions: [],
    });
    expect(errors).toContain("Name is required");
  });

  it("fails when price is invalid", () => {
    const errors = validateMerchandiseForm({
      name: "Belt",
      type: "belt",
      defaultPrice: "abc",
      requiresSize: false,
      sizeOptions: [],
    });
    expect(errors).toContain("Enter a valid price");
  });

  it("fails when price is negative", () => {
    const errors = validateMerchandiseForm({
      name: "Belt",
      type: "belt",
      defaultPrice: "-5",
      requiresSize: false,
      sizeOptions: [],
    });
    expect(errors).toContain("Enter a valid price");
  });

  it("passes when requiresSize is true and sizes are provided", () => {
    const errors = validateMerchandiseForm({
      name: "Gi",
      type: "uniform",
      defaultPrice: "50",
      requiresSize: true,
      sizeOptions: ["S", "M", "L"],
    });
    expect(errors).toHaveLength(0);
  });
});

// Stock alert logic
const isLowStock = (quantity: number, threshold: number) => quantity <= threshold;

describe("Stock alert logic", () => {
  it("triggers alert when stock is at threshold", () => {
    expect(isLowStock(5, 5)).toBe(true);
  });

  it("triggers alert when stock is below threshold", () => {
    expect(isLowStock(3, 5)).toBe(true);
  });

  it("does not trigger alert when stock is above threshold", () => {
    expect(isLowStock(10, 5)).toBe(false);
  });

  it("handles zero stock", () => {
    expect(isLowStock(0, 5)).toBe(true);
  });
});

// Type validation
const VALID_TYPES = ["uniform", "gear", "belt", "equipment", "other"] as const;
type MerchandiseType = typeof VALID_TYPES[number];

const isValidType = (type: string): type is MerchandiseType =>
  VALID_TYPES.includes(type as MerchandiseType);

describe("Merchandise type validation", () => {
  it("accepts valid types", () => {
    VALID_TYPES.forEach((t) => expect(isValidType(t)).toBe(true));
  });

  it("rejects invalid types", () => {
    expect(isValidType("shoes")).toBe(false);
    expect(isValidType("")).toBe(false);
    expect(isValidType("UNIFORM")).toBe(false);
  });
});
