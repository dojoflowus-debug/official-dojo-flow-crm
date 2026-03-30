/**
 * Call Analytics Router
 * 
 * TRPC router for querying call history and analytics data.
 * Provides aggregated statistics, trend analysis, and detailed call records.
 */

import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const callAnalyticsRouter = router({
  /**
   * Get call history with optional filtering and pagination
   */
  getCallHistory: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      limit: z.number().default(50).max(500),
      offset: z.number().default(0),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
      recipientPhone: z.string().optional(),
      sortBy: z.enum(['date', 'duration', 'cost']).default('date'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { aiCreditTransactions } = await import('../drizzle/schema');

      // Build query conditions
      const conditions: any[] = [
        eq(aiCreditTransactions.organizationId, input.organizationId),
        eq(aiCreditTransactions.taskType, 'ai_phone_call'),
      ];

      if (input.dateFrom) {
        conditions.push(gte(aiCreditTransactions.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(aiCreditTransactions.createdAt, input.dateTo));
      }

      // Query transactions
      let query = db.select().from(aiCreditTransactions).where(and(...conditions));

      // Apply sorting
      if (input.sortBy === 'date') {
        query = query.orderBy(
          input.sortOrder === 'desc'
            ? desc(aiCreditTransactions.createdAt)
            : aiCreditTransactions.createdAt
        );
      }

      // Apply pagination
      query = query.limit(input.limit).offset(input.offset);

      const transactions = await query;

      // Parse metadata and format response
      const calls = transactions.map((tx) => {
        let metadata: any = {};
        try {
          metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
        } catch (e) {
          console.error('Failed to parse metadata:', e);
        }

        return {
          id: tx.id,
          organizationId: tx.organizationId,
          recipientPhone: metadata.recipientPhone || 'Unknown',
          durationSeconds: metadata.durationSeconds || 0,
          durationMinutes: metadata.durationMinutes || 0,
          roundedMinutes: metadata.roundedMinutes || 0,
          creditsDeducted: Math.abs(tx.amount),
          callId: metadata.callId || '',
          description: tx.description || '',
          createdAt: tx.createdAt,
          metadata,
        };
      });

      return {
        calls,
        total: calls.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get call statistics summary
   */
  getCallStatistics: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { aiCreditTransactions } = await import('../drizzle/schema');

      // Build query conditions
      const conditions: any[] = [
        eq(aiCreditTransactions.organizationId, input.organizationId),
        eq(aiCreditTransactions.taskType, 'ai_phone_call'),
      ];

      if (input.dateFrom) {
        conditions.push(gte(aiCreditTransactions.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(aiCreditTransactions.createdAt, input.dateTo));
      }

      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(and(...conditions));

      // Calculate statistics
      const stats = {
        totalCalls: transactions.length,
        totalCreditsSpent: 0,
        totalDurationSeconds: 0,
        totalDurationMinutes: 0,
        averageCallDuration: 0,
        averageCreditsPerCall: 0,
        longestCall: 0,
        shortestCall: Infinity,
        uniqueRecipients: new Set<string>(),
      };

      transactions.forEach((tx) => {
        let metadata: any = {};
        try {
          metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
        } catch (e) {
          // Ignore parse errors
        }

        stats.totalCreditsSpent += Math.abs(tx.amount);
        stats.totalDurationSeconds += metadata.durationSeconds || 0;
        stats.totalDurationMinutes += metadata.durationMinutes || 0;
        stats.longestCall = Math.max(stats.longestCall, metadata.durationSeconds || 0);
        stats.shortestCall = Math.min(stats.shortestCall, metadata.durationSeconds || 0);

        if (metadata.recipientPhone) {
          stats.uniqueRecipients.add(metadata.recipientPhone);
        }
      });

      stats.averageCallDuration = stats.totalCalls > 0 
        ? Math.round(stats.totalDurationSeconds / stats.totalCalls)
        : 0;
      stats.averageCreditsPerCall = stats.totalCalls > 0
        ? Math.round(stats.totalCreditsSpent / stats.totalCalls)
        : 0;

      return {
        totalCalls: stats.totalCalls,
        totalCreditsSpent: stats.totalCreditsSpent,
        totalDurationSeconds: stats.totalDurationSeconds,
        totalDurationMinutes: Math.round(stats.totalDurationMinutes * 100) / 100,
        averageCallDuration: stats.averageCallDuration,
        averageCreditsPerCall: stats.averageCreditsPerCall,
        longestCall: stats.longestCall === 0 ? 0 : stats.longestCall,
        shortestCall: stats.shortestCall === Infinity ? 0 : stats.shortestCall,
        uniqueRecipients: stats.uniqueRecipients.size,
      };
    }),

  /**
   * Get daily call statistics for trend analysis
   */
  getDailyCallTrends: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      days: z.number().default(30).max(365),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { aiCreditTransactions } = await import('../drizzle/schema');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);

      // Query transactions
      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(
          and(
            eq(aiCreditTransactions.organizationId, input.organizationId),
            eq(aiCreditTransactions.taskType, 'ai_phone_call'),
            gte(aiCreditTransactions.createdAt, startDate.toISOString()),
            lte(aiCreditTransactions.createdAt, endDate.toISOString())
          )
        );

      // Group by date
      const dailyStats: Record<string, {
        calls: number;
        credits: number;
        duration: number;
      }> = {};

      transactions.forEach((tx) => {
        const date = new Date(tx.createdAt).toISOString().split('T')[0];
        
        if (!dailyStats[date]) {
          dailyStats[date] = { calls: 0, credits: 0, duration: 0 };
        }

        let metadata: any = {};
        try {
          metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
        } catch (e) {
          // Ignore parse errors
        }

        dailyStats[date].calls += 1;
        dailyStats[date].credits += Math.abs(tx.amount);
        dailyStats[date].duration += metadata.durationSeconds || 0;
      });

      // Convert to array and sort by date
      const trends = Object.entries(dailyStats)
        .map(([date, stats]) => ({
          date,
          calls: stats.calls,
          creditsSpent: stats.credits,
          durationSeconds: stats.duration,
          durationMinutes: Math.round((stats.duration / 60) * 100) / 100,
          averageCreditsPerCall: stats.calls > 0 ? Math.round(stats.credits / stats.calls) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return trends;
    }),

  /**
   * Get hourly call distribution
   */
  getHourlyDistribution: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      days: z.number().default(7).max(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { aiCreditTransactions } = await import('../drizzle/schema');

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - input.days * 24 * 60 * 60 * 1000);

      // Query transactions
      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(
          and(
            eq(aiCreditTransactions.organizationId, input.organizationId),
            eq(aiCreditTransactions.taskType, 'ai_phone_call'),
            gte(aiCreditTransactions.createdAt, startDate.toISOString()),
            lte(aiCreditTransactions.createdAt, endDate.toISOString())
          )
        );

      // Group by hour
      const hourlyStats: Record<number, {
        calls: number;
        credits: number;
      }> = {};

      for (let i = 0; i < 24; i++) {
        hourlyStats[i] = { calls: 0, credits: 0 };
      }

      transactions.forEach((tx) => {
        const hour = new Date(tx.createdAt).getHours();
        hourlyStats[hour].calls += 1;
        hourlyStats[hour].credits += Math.abs(tx.amount);
      });

      // Convert to array
      const distribution = Object.entries(hourlyStats)
        .map(([hour, stats]) => ({
          hour: parseInt(hour),
          calls: stats.calls,
          creditsSpent: stats.credits,
          averageCreditsPerCall: stats.calls > 0 ? Math.round(stats.credits / stats.calls) : 0,
        }))
        .sort((a, b) => a.hour - b.hour);

      return distribution;
    }),

  /**
   * Get top recipients
   */
  getTopRecipients: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      limit: z.number().default(10).max(50),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { aiCreditTransactions } = await import('../drizzle/schema');

      // Build query conditions
      const conditions: any[] = [
        eq(aiCreditTransactions.organizationId, input.organizationId),
        eq(aiCreditTransactions.taskType, 'ai_phone_call'),
      ];

      if (input.dateFrom) {
        conditions.push(gte(aiCreditTransactions.createdAt, input.dateFrom));
      }

      if (input.dateTo) {
        conditions.push(lte(aiCreditTransactions.createdAt, input.dateTo));
      }

      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(and(...conditions));

      // Group by recipient
      const recipientStats: Record<string, {
        calls: number;
        credits: number;
        duration: number;
      }> = {};

      transactions.forEach((tx) => {
        let metadata: any = {};
        try {
          metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
        } catch (e) {
          // Ignore parse errors
        }

        const phone = metadata.recipientPhone || 'Unknown';
        if (!recipientStats[phone]) {
          recipientStats[phone] = { calls: 0, credits: 0, duration: 0 };
        }

        recipientStats[phone].calls += 1;
        recipientStats[phone].credits += Math.abs(tx.amount);
        recipientStats[phone].duration += metadata.durationSeconds || 0;
      });

      // Convert to array, sort by calls, and limit
      const topRecipients = Object.entries(recipientStats)
        .map(([phone, stats]) => ({
          recipientPhone: phone,
          callCount: stats.calls,
          totalCredits: stats.credits,
          totalDurationSeconds: stats.duration,
          totalDurationMinutes: Math.round((stats.duration / 60) * 100) / 100,
          averageCallDuration: Math.round(stats.duration / stats.calls),
          averageCreditsPerCall: Math.round(stats.credits / stats.calls),
        }))
        .sort((a, b) => b.callCount - a.callCount)
        .slice(0, input.limit);

      return topRecipients;
    }),

  /**
   * Get call cost breakdown by time period
   */
  getCostBreakdown: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      period: z.enum(['day', 'week', 'month']).default('month'),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { aiCreditTransactions } = await import('../drizzle/schema');

      // Determine date range
      const endDate = new Date();
      let startDate = new Date();

      switch (input.period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Query transactions
      const transactions = await db
        .select()
        .from(aiCreditTransactions)
        .where(
          and(
            eq(aiCreditTransactions.organizationId, input.organizationId),
            eq(aiCreditTransactions.taskType, 'ai_phone_call'),
            gte(aiCreditTransactions.createdAt, startDate.toISOString()),
            lte(aiCreditTransactions.createdAt, endDate.toISOString())
          )
        );

      // Calculate breakdown
      const setupCosts = transactions.filter(tx => {
        let metadata: any = {};
        try {
          metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
        } catch (e) {
          // Ignore
        }
        return metadata.callPhase === 'setup';
      }).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const durationCosts = transactions.filter(tx => {
        let metadata: any = {};
        try {
          metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
        } catch (e) {
          // Ignore
        }
        return metadata.callPhase === 'duration';
      }).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      const totalCosts = setupCosts + durationCosts;

      return {
        period: input.period,
        setupCosts,
        durationCosts,
        totalCosts,
        setupPercentage: totalCosts > 0 ? Math.round((setupCosts / totalCosts) * 100) : 0,
        durationPercentage: totalCosts > 0 ? Math.round((durationCosts / totalCosts) * 100) : 0,
      };
    }),
});
