import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getAllStudents: vi.fn().mockResolvedValue([
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "555-1234",
      beltRank: "white",
      stripes: 0,
      category: "A",
      status: "active",
      program: "Kids Karate",
      monthlyRate: 150,
      credits: 10,
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "555-5678",
      beltRank: "yellow",
      stripes: 2,
      category: "B",
      status: "active",
      program: "Adult BJJ",
      monthlyRate: 200,
      credits: 5,
    },
  ]),
  getStudentById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        beltRank: "white",
        status: "active",
      });
    }
    return Promise.resolve(null);
  }),
  createStudent: vi.fn().mockResolvedValue({ id: 3 }),
  updateStudent: vi.fn().mockResolvedValue(undefined),
  deleteStudent: vi.fn().mockResolvedValue(undefined),
  getStudentStats: vi.fn().mockResolvedValue({
    active: 25,
    inactive: 5,
    trial: 3,
    frozen: 2,
    categoryA: 10,
    categoryB: 12,
    categoryC: 3,
    total: 35,
  }),
  getBeltDistribution: vi.fn().mockResolvedValue([
    { beltRank: "white", count: 10 },
    { beltRank: "yellow", count: 8 },
    { beltRank: "orange", count: 5 },
    { beltRank: "green", count: 3 },
    { beltRank: "blue", count: 2 },
  ]),
  getAllLeads: vi.fn().mockResolvedValue([]),
  getLeadById: vi.fn().mockResolvedValue(null),
  getLeadsByStage: vi.fn().mockResolvedValue({}),
  createLead: vi.fn().mockResolvedValue({ id: 1 }),
  updateLead: vi.fn().mockResolvedValue(undefined),
  deleteLead: vi.fn().mockResolvedValue(undefined),
  getConversationsByUser: vi.fn().mockResolvedValue([]),
  createConversation: vi.fn().mockResolvedValue({ id: 1 }),
  updateConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
  getMessagesByConversation: vi.fn().mockResolvedValue([]),
  createMessage: vi.fn().mockResolvedValue({ id: 1 }),
  getKaiDataSummary: vi.fn().mockResolvedValue({
    students: { total: 35, active: 25 },
    billing: { latePayers: 3, totalMonthlyRevenue: 5000 },
    leads: { total: 10, new: 5 },
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("student router", () => {
  it("lists all students (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.list();

    expect(result).toHaveLength(2);
    expect(result[0].firstName).toBe("John");
    expect(result[1].firstName).toBe("Jane");
  });

  it("gets student by id (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.getById({ id: 1 });

    expect(result).not.toBeNull();
    expect(result?.firstName).toBe("John");
    expect(result?.lastName).toBe("Doe");
  });

  it("returns student stats (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.stats();

    expect(result.active).toBe(25);
    expect(result.inactive).toBe(5);
    expect(result.categoryA).toBe(10);
    expect(result.total).toBe(35);
  });

  it("returns belt distribution (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.beltDistribution();

    expect(result).toHaveLength(5);
    expect(result[0].beltRank).toBe("white");
    expect(result[0].count).toBe(10);
  });

  it("creates a student (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.create({
      firstName: "New",
      lastName: "Student",
      email: "new@example.com",
      beltRank: "white",
      category: "B",
      status: "active",
    });

    expect(result).toEqual({ id: 3 });
  });

  it("updates a student (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.update({
      id: 1,
      data: {
        firstName: "Updated",
        beltRank: "yellow",
      },
    });

    expect(result).toEqual({ success: true });
  });

  it("deletes a student (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.student.delete({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("lead router", () => {
  it("lists all leads (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lead.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a lead (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lead.create({
      firstName: "New",
      lastName: "Lead",
      email: "lead@example.com",
      stage: "new",
      source: "Website",
    });

    expect(result).toEqual({ id: 1 });
  });
});

describe("kai router", () => {
  it("returns data summary (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.kai.dataSummary();

    expect(result.students.total).toBe(35);
    expect(result.students.active).toBe(25);
    expect(result.billing.latePayers).toBe(3);
    expect(result.leads.new).toBe(5);
  });
});
