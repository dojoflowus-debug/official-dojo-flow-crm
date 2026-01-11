// Student Deletion Endpoints
// This file contains the TRPC endpoints for the student deletion system
// To be integrated into the students router in routers.ts

export const deletionEndpoints = {
  // Request student deletion (staff with permission)
  requestDeletion: protectedProcedure
    .input(z.object({
      studentId: z.number(),
      reason: z.string().min(10, 'Reason must be at least 10 characters'),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { students, studentDeletionRequests, auditLogs } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const bcrypt = await import("bcryptjs");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const orgId = ctx.currentOrganizationId;
      if (!orgId) throw new Error('No organization context');
      
      // Check permission
      if (!ctx.user.permissions?.includes('students.delete.request')) {
        throw new Error('Permission denied: students.delete.request required');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(input.password, ctx.user.passwordHash || '');
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
      
      // Get student to check if paying member
      const [student] = await db.select().from(students).where(
        and(
          eq(students.id, input.studentId),
          eq(students.organizationId, orgId)
        )
      );
      
      if (!student) throw new Error('Student not found');
      
      // Check if student is paying member
      const isPayingMember = student.membershipStatus === 'Active' || student.membershipStatus === 'Premium';
      
      // Create deletion request
      const result = await db.insert(studentDeletionRequests).values({
        orgId,
        studentId: input.studentId,
        requestedByUserId: ctx.user.id,
        status: 'pending',
        reason: input.reason,
        isPayingMemberAtRequestTime: isPayingMember ? 1 : 0,
      });
      
      // Log audit event
      await db.insert(auditLogs).values({
        orgId,
        actorUserId: ctx.user.id,
        actorName: ctx.user.name || 'Unknown',
        eventType: 'DELETE_REQUESTED',
        studentId: input.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        deletionRequestId: result.insertId,
        description: `Deletion requested: ${input.reason}`,
      });
      
      return {
        success: true,
        requestId: result.insertId,
        message: 'Deletion request submitted. Awaiting owner approval.',
      };
    }),

  // List pending deletion requests (owner only)
  listDeletionRequests: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'denied', 'executed', 'expired']).optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { studentDeletionRequests, students } = await import("../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const orgId = ctx.currentOrganizationId;
      if (!orgId) throw new Error('No organization context');
      
      // Check permission
      if (!ctx.user.permissions?.includes('students.delete.viewRequests')) {
        throw new Error('Permission denied: students.delete.viewRequests required');
      }
      
      const conditions = [eq(studentDeletionRequests.orgId, orgId)];
      if (input?.status) {
        conditions.push(eq(studentDeletionRequests.status, input.status));
      }
      
      const requests = await db.select({
        id: studentDeletionRequests.id,
        studentId: studentDeletionRequests.studentId,
        studentName: students.firstName,
        studentLastName: students.lastName,
        requestedByUserId: studentDeletionRequests.requestedByUserId,
        approvedByUserId: studentDeletionRequests.approvedByUserId,
        status: studentDeletionRequests.status,
        reason: studentDeletionRequests.reason,
        isPayingMemberAtRequestTime: studentDeletionRequests.isPayingMemberAtRequestTime,
        billingDecision: studentDeletionRequests.billingDecision,
        createdAt: studentDeletionRequests.createdAt,
        updatedAt: studentDeletionRequests.updatedAt,
      })
      .from(studentDeletionRequests)
      .leftJoin(students, eq(studentDeletionRequests.studentId, students.id))
      .where(and(...conditions))
      .orderBy(desc(studentDeletionRequests.createdAt));
      
      return requests;
    }),

  // Approve deletion request (owner only)
  approveDeletion: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      password: z.string(),
      billingDecision: z.enum(['cancel_subscription', 'keep_active', 'abort']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { studentDeletionRequests, students, auditLogs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const bcrypt = await import("bcryptjs");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const orgId = ctx.currentOrganizationId;
      if (!orgId) throw new Error('No organization context');
      
      // Check permission
      if (!ctx.user.permissions?.includes('students.delete.approve')) {
        throw new Error('Permission denied: students.delete.approve required');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(input.password, ctx.user.passwordHash || '');
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }
      
      // Get deletion request
      const [request] = await db.select().from(studentDeletionRequests)
        .where(eq(studentDeletionRequests.id, input.requestId));
      
      if (!request) throw new Error('Deletion request not found');
      if (request.orgId !== orgId) throw new Error('Unauthorized');
      
      // If paying member and abort decision, deny the request
      if (request.isPayingMemberAtRequestTime && input.billingDecision === 'abort') {
        await db.update(studentDeletionRequests)
          .set({ status: 'denied', updatedAt: new Date() })
          .where(eq(studentDeletionRequests.id, input.requestId));
        
        await db.insert(auditLogs).values({
          orgId,
          actorUserId: ctx.user.id,
          actorName: ctx.user.name || 'Unknown',
          eventType: 'DELETE_DENIED',
          studentId: request.studentId,
          deletionRequestId: input.requestId,
          description: 'Deletion aborted due to billing decision',
        });
        
        return { success: true, message: 'Deletion request denied' };
      }
      
      // Approve the request
      await db.update(studentDeletionRequests)
        .set({
          status: 'approved',
          approvedByUserId: ctx.user.id,
          billingDecision: input.billingDecision,
          updatedAt: new Date(),
        })
        .where(eq(studentDeletionRequests.id, input.requestId));
      
      // Log approval
      await db.insert(auditLogs).values({
        orgId,
        actorUserId: ctx.user.id,
        actorName: ctx.user.name || 'Unknown',
        eventType: 'DELETE_APPROVED',
        studentId: request.studentId,
        deletionRequestId: input.requestId,
        description: `Deletion approved. Billing decision: ${input.billingDecision}`,
      });
      
      // Perform soft delete
      await db.update(students)
        .set({
          deletedAt: new Date(),
          deletedByUserId: ctx.user.id,
          deletionRequestId: input.requestId,
        })
        .where(eq(students.id, request.studentId));
      
      // Log execution
      await db.insert(auditLogs).values({
        orgId,
        actorUserId: ctx.user.id,
        actorName: ctx.user.name || 'Unknown',
        eventType: 'DELETE_EXECUTED',
        studentId: request.studentId,
        deletionRequestId: input.requestId,
        description: 'Student soft deleted',
      });
      
      // Update request status to executed
      await db.update(studentDeletionRequests)
        .set({ status: 'executed', updatedAt: new Date() })
        .where(eq(studentDeletionRequests.id, input.requestId));
      
      return { success: true, message: 'Student deleted successfully' };
    }),

  // Deny deletion request (owner only)
  denyDeletion: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { studentDeletionRequests, auditLogs } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const orgId = ctx.currentOrganizationId;
      if (!orgId) throw new Error('No organization context');
      
      // Check permission
      if (!ctx.user.permissions?.includes('students.delete.approve')) {
        throw new Error('Permission denied: students.delete.approve required');
      }
      
      // Get deletion request
      const [request] = await db.select().from(studentDeletionRequests)
        .where(eq(studentDeletionRequests.id, input.requestId));
      
      if (!request) throw new Error('Deletion request not found');
      if (request.orgId !== orgId) throw new Error('Unauthorized');
      
      // Deny the request
      await db.update(studentDeletionRequests)
        .set({ status: 'denied', updatedAt: new Date() })
        .where(eq(studentDeletionRequests.id, input.requestId));
      
      // Log denial
      await db.insert(auditLogs).values({
        orgId,
        actorUserId: ctx.user.id,
        actorName: ctx.user.name || 'Unknown',
        eventType: 'DELETE_DENIED',
        studentId: request.studentId,
        deletionRequestId: input.requestId,
        description: input.reason || 'Deletion request denied',
      });
      
      return { success: true, message: 'Deletion request denied' };
    }),
};
