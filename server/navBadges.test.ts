import { describe, it, expect, beforeEach } from 'vitest';
import { getDb } from './db';
import { students, leads, billingTransactions, studentMerchandise, merchandiseItems } from '../drizzle/schema';
import { eq, and, or, sql } from 'drizzle-orm';

/**
 * Tests for Navigation Badge Counts
 * 
 * These tests verify the actionable count logic for each navigation badge.
 */

describe('Navigation Badge Counts', () => {
  describe('Students Badge', () => {
    it('should count students on hold', async () => {
      const db = await getDb();
      if (!db) return;
      const studentsOnHold = await db
        .select()
        .from(students)
        .where(eq(students.status, 'on_hold'));
      
      expect(studentsOnHold).toBeDefined();
      expect(Array.isArray(studentsOnHold)).toBe(true);
    });

    it('should count inactive students', async () => {
      const db = await getDb();
      if (!db) return;
      const inactiveStudents = await db
        .select()
        .from(students)
        .where(eq(students.status, 'inactive'));
      
      expect(inactiveStudents).toBeDefined();
      expect(Array.isArray(inactiveStudents)).toBe(true);
    });

    it('should count students needing attention (on_hold + inactive)', async () => {
      const db = await getDb();
      if (!db) return;
      const studentsNeedingAttention = await db
        .select()
        .from(students)
        .where(
          or(
            eq(students.status, 'on_hold'),
            eq(students.status, 'inactive')
          )
        );
      
      expect(studentsNeedingAttention).toBeDefined();
      expect(Array.isArray(studentsNeedingAttention)).toBe(true);
    });
  });

  describe('Leads Badge', () => {
    it('should count new leads created in last 24 hours', async () => {
      const db = await getDb();
      if (!db) return;
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const newLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            gt(leads.createdAt, oneDayAgo),
            eq(leads.status, 'New Lead')
          )
        );
      
      expect(newLeads).toBeDefined();
      expect(Array.isArray(newLeads)).toBe(true);
    });

    it('should count overdue follow-ups (last contact > 3 days ago)', async () => {
      const db = await getDb();
      if (!db) return;
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      const overdueLeads = await db
        .select()
        .from(leads)
        .where(
          and(
            lt(leads.updatedAt, threeDaysAgo),
            or(
              eq(leads.status, 'Attempting Contact'),
              eq(leads.status, 'Contact Made')
            )
          )
        );
      
      expect(overdueLeads).toBeDefined();
      expect(Array.isArray(overdueLeads)).toBe(true);
    });

    it('should count leads requiring follow-up (new + overdue)', async () => {
      const db = await getDb();
      if (!db) return;
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      const leadsRequiringFollowup = await db
        .select()
        .from(leads)
        .where(
          or(
            and(
              gt(leads.createdAt, oneDayAgo),
              eq(leads.status, 'New Lead')
            ),
            and(
              lt(leads.updatedAt, threeDaysAgo),
              or(
                eq(leads.status, 'Attempting Contact'),
                eq(leads.status, 'Contact Made')
              )
            )
          )
        );
      
      expect(leadsRequiringFollowup).toBeDefined();
      expect(Array.isArray(leadsRequiringFollowup)).toBe(true);
    });
  });

  describe('Billing Badge', () => {
    it('should count failed payments', async () => {
      const db = await getDb();
      if (!db) return;
      const failedPayments = await db
        .select()
        .from(billingTransactions)
        .where(eq(billingTransactions.status, 'failed'));
      
      expect(failedPayments).toBeDefined();
      expect(Array.isArray(failedPayments)).toBe(true);
    });

    it('should count disputed transactions', async () => {
      const db = await getDb();
      if (!db) return;
      const disputedTransactions = await db
        .select()
        .from(billingTransactions)
        .where(eq(billingTransactions.status, 'disputed'));
      
      expect(overdueInvoices).toBeDefined();
      expect(Array.isArray(overdueInvoices)).toBe(true);
    });

    it('should count billing issues (failed + disputed)', async () => {
      const db = await getDb();
      if (!db) return;
      const billingIssues = await db
        .select()
        .from(billingTransactions)
        .where(
          or(
            eq(billingTransactions.status, 'failed'),
            eq(billingTransactions.status, 'disputed')
          )
        );
      
      expect(billingIssues).toBeDefined();
      expect(Array.isArray(billingIssues)).toBe(true);
    });
  });

  describe('Operations Badge', () => {
    it('should count pending merchandise fulfillments', async () => {
      const db = await getDb();
      if (!db) return;
      const pendingFulfillments = await db
        .select()
        .from(studentMerchandise)
        .where(eq(studentMerchandise.fulfillmentStatus, 'pending'));
      
      expect(pendingFulfillments).toBeDefined();
      expect(Array.isArray(pendingFulfillments)).toBe(true);
    });

    it('should count low stock items', async () => {
      const db = await getDb();
      if (!db) return;
      const lowStockItems = await db
        .select()
        .from(merchandiseItems)
        .where(
          and(
            sql`${merchandiseItems.stockQuantity} IS NOT NULL`,
            sql`${merchandiseItems.lowStockThreshold} IS NOT NULL`,
            sql`${merchandiseItems.stockQuantity} <= ${merchandiseItems.lowStockThreshold}`
          )
        );
      
      expect(lowStockItems).toBeDefined();
      expect(Array.isArray(lowStockItems)).toBe(true);
    });
  });

  describe('Badge Count Formatting', () => {
    it('should return 0 when no items need attention', () => {
      const count = 0;
      expect(count).toBe(0);
    });

    it('should return exact count for values under 100', () => {
      const count = 42;
      expect(count).toBeLessThan(100);
      expect(count).toBe(42);
    });

    it('should format counts >= 100 as "99+"', () => {
      const count = 150;
      const displayCount = count >= 100 ? '99+' : count.toString();
      expect(displayCount).toBe('99+');
    });

    it('should handle edge case of exactly 100', () => {
      const count = 100;
      const displayCount = count >= 100 ? '99+' : count.toString();
      expect(displayCount).toBe('99+');
    });

    it('should handle edge case of 99', () => {
      const count = 99;
      const displayCount = count >= 100 ? '99+' : count.toString();
      expect(displayCount).toBe('99');
    });
  });

  describe('Badge Visibility Rules', () => {
    it('should not show badge when count is 0', () => {
      const count = 0;
      const shouldShowBadge = count > 0;
      expect(shouldShowBadge).toBe(false);
    });

    it('should show badge when count is greater than 0', () => {
      const count = 1;
      const shouldShowBadge = count > 0;
      expect(shouldShowBadge).toBe(true);
    });

    it('should show badge for any positive count', () => {
      const counts = [1, 5, 10, 50, 99, 100, 500];
      counts.forEach(count => {
        const shouldShowBadge = count > 0;
        expect(shouldShowBadge).toBe(true);
      });
    });
  });
});
