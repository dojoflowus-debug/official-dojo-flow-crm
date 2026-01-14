import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';

// Mock context for protected procedures
const mockContext: Context = {
  user: {
    id: 1,
    openId: 'test-open-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    provider: null,
    providerId: null,
    password: null,
    resetToken: null,
    resetTokenExpiry: null,
    loginMethod: null,
  },
  req: {} as any,
  res: {} as any,
};

// Create caller with mock context
const caller = appRouter.createCaller(mockContext);

describe('Merchandise Router', () => {
  let createdUniformId: number;
  let createdBeltId: number;

  describe('createItem', () => {
    it('should create a merchandise item with size requirement', async () => {
      const result = await caller.merchandise.createItem({
        name: 'White Karate Uniform',
        type: 'uniform',
        defaultPrice: 5000, // $50.00
        requiresSize: true,
        sizeOptions: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        description: 'Standard white karate uniform for all belt levels',
      });

      expect(result.success).toBe(true);
      expect(result.itemId).toBeDefined();
      expect(typeof result.itemId).toBe('number');
      createdUniformId = result.itemId as number;
    });

    it('should create a merchandise item without size requirement', async () => {
      const result = await caller.merchandise.createItem({
        name: 'Black Belt',
        type: 'belt',
        defaultPrice: 1500, // $15.00
        requiresSize: false,
        description: 'Black belt for advanced students',
      });

      expect(result.success).toBe(true);
      expect(result.itemId).toBeDefined();
      createdBeltId = result.itemId as number;
    });

    it('should create a free item (price = 0)', async () => {
      const result = await caller.merchandise.createItem({
        name: 'Trial Uniform',
        type: 'uniform',
        defaultPrice: 0,
        requiresSize: true,
        sizeOptions: ['S', 'M', 'L'],
        description: 'Free uniform for trial students',
      });

      expect(result.success).toBe(true);
      expect(result.itemId).toBeDefined();
    });
  });

  describe('getItems', () => {
    it('should retrieve all active merchandise items', async () => {
      const items = await caller.merchandise.getItems();

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('should return items with parsed size options', async () => {
      const items = await caller.merchandise.getItems();
      
      const uniformItem = items.find(item => item.id === createdUniformId);
      expect(uniformItem).toBeDefined();
      expect(uniformItem?.name).toBe('White Karate Uniform');
      expect(uniformItem?.type).toBe('uniform');
      expect(uniformItem?.requiresSize).toBe(1);
      expect(Array.isArray(uniformItem?.sizeOptions)).toBe(true);
      expect(uniformItem?.sizeOptions).toContain('M');
    });

    it('should return items without size options when not required', async () => {
      const items = await caller.merchandise.getItems();
      
      const beltItem = items.find(item => item.id === createdBeltId);
      expect(beltItem).toBeDefined();
      expect(beltItem?.name).toBe('Black Belt');
      expect(beltItem?.requiresSize).toBe(0);
      expect(beltItem?.sizeOptions).toBeNull();
    });
  });

  describe('getStatistics', () => {
    it('should retrieve fulfillment statistics', async () => {
      const stats = await caller.merchandise.getStatistics();

      expect(stats).toBeDefined();
      expect(typeof stats.pending).toBe('number');
      expect(typeof stats.handedOut).toBe('number');
      expect(typeof stats.confirmed).toBe('number');
      expect(typeof stats.disputed).toBe('number');
      expect(typeof stats.total).toBe('number');
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.handedOut).toBeGreaterThanOrEqual(0);
      expect(stats.confirmed).toBeGreaterThanOrEqual(0);
      expect(stats.disputed).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPendingFulfillments', () => {
    it('should retrieve all fulfillments without filter', async () => {
      const fulfillments = await caller.merchandise.getPendingFulfillments({});

      expect(Array.isArray(fulfillments)).toBe(true);
      // May be empty if no items have been attached to students yet
    });

    it('should retrieve pending fulfillments', async () => {
      const fulfillments = await caller.merchandise.getPendingFulfillments({
        status: 'pending',
      });

      expect(Array.isArray(fulfillments)).toBe(true);
    });

    it('should retrieve handed out fulfillments', async () => {
      const fulfillments = await caller.merchandise.getPendingFulfillments({
        status: 'handed_out',
      });

      expect(Array.isArray(fulfillments)).toBe(true);
    });
  });
});
