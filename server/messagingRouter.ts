import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

// Mention schema
const mentionSchema = z.object({
  type: z.enum(["student", "staff", "kai"]),
  id: z.union([z.number(), z.string()]),
  displayName: z.string(),
});

export const messagingRouter = router({
  // Send a message with @ mentions
  sendMessage: protectedProcedure
    .input(z.object({
      body: z.string().min(1),
      mentions: z.array(mentionSchema),
      contextType: z.string().optional().default("general"),
      contextId: z.number().optional(),
      threadId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db } = await import("./db");
      const { messageThreads, directMessages, studentNotes, unreadMessageCounts } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const senderId = ctx.user.id;
      const senderType = "staff";
      const senderRole = ctx.user.role || "Staff";

      // Check if @Kai is mentioned
      const kaiMentioned = input.mentions.some(m => m.type === "kai");
      
      // Get student mentions for routing
      const studentMentions = input.mentions.filter(m => m.type === "student");
      const staffMentions = input.mentions.filter(m => m.type === "staff");

      let threadId = input.threadId;

      // Create or get thread
      if (!threadId) {
        // Create new thread
        const participants = [
          { userId: senderId, userType: "staff", role: senderRole },
          ...studentMentions.map(m => ({ userId: m.id, userType: "student", role: "Student" })),
          ...staffMentions.map(m => ({ userId: m.id, userType: "staff", role: "Staff" })),
        ];

        const [result] = await db!.insert(messageThreads).values({
          contextType: input.contextType,
          contextId: input.contextId,
          participants: JSON.stringify(participants),
          subject: input.body.slice(0, 100),
          lastMessageAt: new Date(),
        });

        threadId = result.insertId;
      } else {
        // Update existing thread's lastMessageAt
        await db!.update(messageThreads)
          .set({ lastMessageAt: new Date() })
          .where(eq(messageThreads.id, threadId));
      }

      // Create the message
      const [messageResult] = await db!.insert(directMessages).values({
        threadId: threadId!,
        senderId,
        senderType,
        senderRole,
        body: input.body,
        mentions: JSON.stringify(input.mentions),
        readBy: JSON.stringify([{ userId: senderId, userType: "staff", readAt: new Date().toISOString() }]),
        triggeredKai: kaiMentioned ? 1 : 0,
      });

      const messageId = messageResult.insertId;

      // Create student notes for each mentioned student
      for (const studentMention of studentMentions) {
        await db!.insert(studentNotes).values({
          studentId: Number(studentMention.id),
          noteType: "message",
          createdBy: senderId,
          createdByName: ctx.user.name || "Staff",
          content: input.body,
          threadId: threadId!,
          messageId,
        });

        // Update unread count for student
        const existingCount = await db!.select()
          .from(unreadMessageCounts)
          .where(and(
            eq(unreadMessageCounts.userId, Number(studentMention.id)),
            eq(unreadMessageCounts.userType, "student"),
            eq(unreadMessageCounts.threadId, threadId!)
          ))
          .limit(1);

        if (existingCount.length > 0) {
          await db!.update(unreadMessageCounts)
            .set({ unreadCount: existingCount[0].unreadCount + 1 })
            .where(eq(unreadMessageCounts.id, existingCount[0].id));
        } else {
          await db!.insert(unreadMessageCounts).values({
            userId: Number(studentMention.id),
            userType: "student",
            threadId: threadId!,
            unreadCount: 1,
          });
        }
      }

      // Update unread count for mentioned staff
      for (const staffMention of staffMentions) {
        const existingCount = await db!.select()
          .from(unreadMessageCounts)
          .where(and(
            eq(unreadMessageCounts.userId, Number(staffMention.id)),
            eq(unreadMessageCounts.userType, "staff"),
            eq(unreadMessageCounts.threadId, threadId!)
          ))
          .limit(1);

        if (existingCount.length > 0) {
          await db!.update(unreadMessageCounts)
            .set({ unreadCount: existingCount[0].unreadCount + 1 })
            .where(eq(unreadMessageCounts.id, existingCount[0].id));
        } else {
          await db!.insert(unreadMessageCounts).values({
            userId: Number(staffMention.id),
            userType: "staff",
            threadId: threadId!,
            unreadCount: 1,
          });
        }
      }

      // If @Kai was mentioned, generate a Kai response
      let kaiResponse = null;
      if (kaiMentioned) {
        try {
          const { chatWithKai } = await import("./services/openai");
          const kaiResult = await chatWithKai(input.body, []);
          
          if (kaiResult.response) {
            // Insert Kai's response as a message
            const [kaiMessageResult] = await db!.insert(directMessages).values({
              threadId: threadId!,
              senderId: 0, // Kai's ID
              senderType: "kai",
              senderRole: "AI Assistant",
              body: kaiResult.response,
              mentions: "[]",
              readBy: "[]",
              triggeredKai: 0,
            });

            kaiResponse = {
              messageId: kaiMessageResult.insertId,
              body: kaiResult.response,
            };
          }
        } catch (error) {
          console.error("[Messaging] Kai response error:", error);
        }
      }

      return {
        success: true,
        messageId,
        threadId,
        triggeredKai: kaiMentioned,
        kaiResponse,
      };
    }),

  // Get threads for current user (staff)
  getStaffThreads: protectedProcedure
    .input(z.object({
      filter: z.enum(["all", "students", "staff"]).optional().default("all"),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = await import("./db");
      const { messageThreads, directMessages, unreadMessageCounts } = await import("../drizzle/schema");
      const { desc, eq, and, sql } = await import("drizzle-orm");

      const userId = ctx.user.id;

      // Get all threads where user is a participant
      const threads = await db!.select()
        .from(messageThreads)
        .orderBy(desc(messageThreads.lastMessageAt))
        .limit(50);

      // Filter threads where user is a participant
      const userThreads = threads.filter(thread => {
        const participants = JSON.parse(thread.participants || "[]");
        return participants.some((p: any) => 
          (p.userId === userId && p.userType === "staff") ||
          // Include threads where user sent a message
          true // For now, show all threads to staff
        );
      });

      // Get unread counts and last message for each thread
      const threadsWithDetails = await Promise.all(userThreads.map(async (thread) => {
        // Get last message
        const lastMessages = await db!.select()
          .from(directMessages)
          .where(eq(directMessages.threadId, thread.id))
          .orderBy(desc(directMessages.createdAt))
          .limit(1);

        // Get unread count
        const unreadCounts = await db!.select()
          .from(unreadMessageCounts)
          .where(and(
            eq(unreadMessageCounts.userId, userId),
            eq(unreadMessageCounts.userType, "staff"),
            eq(unreadMessageCounts.threadId, thread.id)
          ))
          .limit(1);

        return {
          ...thread,
          participants: JSON.parse(thread.participants || "[]"),
          lastMessage: lastMessages[0] || null,
          unreadCount: unreadCounts[0]?.unreadCount || 0,
        };
      }));

      return { threads: threadsWithDetails };
    }),

  // Get messages in a thread
  getThreadMessages: protectedProcedure
    .input(z.object({
      threadId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { db } = await import("./db");
      const { directMessages, messageThreads, unreadMessageCounts } = await import("../drizzle/schema");
      const { eq, and, asc } = await import("drizzle-orm");

      // Get thread
      const threads = await db!.select()
        .from(messageThreads)
        .where(eq(messageThreads.id, input.threadId))
        .limit(1);

      if (threads.length === 0) {
        throw new Error("Thread not found");
      }

      // Get messages
      const messages = await db!.select()
        .from(directMessages)
        .where(eq(directMessages.threadId, input.threadId))
        .orderBy(asc(directMessages.createdAt));

      // Mark messages as read for this user
      const userId = ctx.user.id;
      await db!.update(unreadMessageCounts)
        .set({ unreadCount: 0, lastReadMessageId: messages[messages.length - 1]?.id })
        .where(and(
          eq(unreadMessageCounts.userId, userId),
          eq(unreadMessageCounts.userType, "staff"),
          eq(unreadMessageCounts.threadId, input.threadId)
        ));

      return {
        thread: {
          ...threads[0],
          participants: JSON.parse(threads[0].participants || "[]"),
        },
        messages: messages.map(m => ({
          ...m,
          mentions: JSON.parse(m.mentions || "[]"),
          readBy: JSON.parse(m.readBy || "[]"),
        })),
      };
    }),

  // Get total unread count for staff
  getStaffUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const { db } = await import("./db");
      const { unreadMessageCounts } = await import("../drizzle/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const userId = ctx.user.id;

      const result = await db!.select({
        total: sql<number>`SUM(${unreadMessageCounts.unreadCount})`,
      })
        .from(unreadMessageCounts)
        .where(and(
          eq(unreadMessageCounts.userId, userId),
          eq(unreadMessageCounts.userType, "staff")
        ));

      return { unreadCount: result[0]?.total || 0 };
    }),

  // Get student messages (for student portal)
  getStudentMessages: publicProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const { db } = await import("./db");
      const { studentNotes, directMessages, messageThreads } = await import("../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      // Get all message notes for this student
      const notes = await db!.select()
        .from(studentNotes)
        .where(and(
          eq(studentNotes.studentId, input.studentId),
          eq(studentNotes.noteType, "message")
        ))
        .orderBy(desc(studentNotes.createdAt))
        .limit(50);

      // Get full message details for each note
      const messagesWithDetails = await Promise.all(notes.map(async (note) => {
        if (!note.messageId) return { ...note, message: null, thread: null };

        const messages = await db!.select()
          .from(directMessages)
          .where(eq(directMessages.id, note.messageId))
          .limit(1);

        let thread = null;
        if (note.threadId) {
          const threads = await db!.select()
            .from(messageThreads)
            .where(eq(messageThreads.id, note.threadId))
            .limit(1);
          thread = threads[0] || null;
        }

        return {
          ...note,
          message: messages[0] ? {
            ...messages[0],
            mentions: JSON.parse(messages[0].mentions || "[]"),
          } : null,
          thread,
        };
      }));

      return { messages: messagesWithDetails };
    }),

  // Get student unread count (for student portal)
  getStudentUnreadCount: publicProcedure
    .input(z.object({
      studentId: z.number(),
    }))
    .query(async ({ input }) => {
      const { db } = await import("./db");
      const { unreadMessageCounts } = await import("../drizzle/schema");
      const { eq, and, sql } = await import("drizzle-orm");

      const result = await db!.select({
        total: sql<number>`SUM(${unreadMessageCounts.unreadCount})`,
      })
        .from(unreadMessageCounts)
        .where(and(
          eq(unreadMessageCounts.userId, input.studentId),
          eq(unreadMessageCounts.userType, "student")
        ));

      return { unreadCount: result[0]?.total || 0 };
    }),

  // Mark student messages as read
  markStudentMessagesRead: publicProcedure
    .input(z.object({
      studentId: z.number(),
      threadId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { db } = await import("./db");
      const { unreadMessageCounts } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      if (input.threadId) {
        await db!.update(unreadMessageCounts)
          .set({ unreadCount: 0 })
          .where(and(
            eq(unreadMessageCounts.userId, input.studentId),
            eq(unreadMessageCounts.userType, "student"),
            eq(unreadMessageCounts.threadId, input.threadId)
          ));
      } else {
        await db!.update(unreadMessageCounts)
          .set({ unreadCount: 0 })
          .where(and(
            eq(unreadMessageCounts.userId, input.studentId),
            eq(unreadMessageCounts.userType, "student")
          ));
      }

      return { success: true };
    }),

  // Student reply to a message
  studentReply: publicProcedure
    .input(z.object({
      studentId: z.number(),
      threadId: z.number(),
      body: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const { db } = await import("./db");
      const { directMessages, messageThreads, unreadMessageCounts, students } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      // Get student info
      const studentRows = await db!.select()
        .from(students)
        .where(eq(students.id, input.studentId))
        .limit(1);

      if (studentRows.length === 0) {
        throw new Error("Student not found");
      }

      const student = studentRows[0];
      const studentName = student.name || `${student.firstName} ${student.lastName}`;

      // Update thread lastMessageAt
      await db!.update(messageThreads)
        .set({ lastMessageAt: new Date() })
        .where(eq(messageThreads.id, input.threadId));

      // Create the reply message
      const [messageResult] = await db!.insert(directMessages).values({
        threadId: input.threadId,
        senderId: input.studentId,
        senderType: "student",
        senderRole: "Student",
        body: input.body,
        mentions: "[]",
        readBy: JSON.stringify([{ userId: input.studentId, userType: "student", readAt: new Date().toISOString() }]),
        triggeredKai: 0,
      });

      // Get thread participants to update their unread counts
      const threads = await db!.select()
        .from(messageThreads)
        .where(eq(messageThreads.id, input.threadId))
        .limit(1);

      if (threads.length > 0) {
        const participants = JSON.parse(threads[0].participants || "[]");
        
        // Update unread count for all staff participants
        for (const participant of participants) {
          if (participant.userType === "staff" && participant.userId !== input.studentId) {
            const existingCount = await db!.select()
              .from(unreadMessageCounts)
              .where(and(
                eq(unreadMessageCounts.userId, participant.userId),
                eq(unreadMessageCounts.userType, "staff"),
                eq(unreadMessageCounts.threadId, input.threadId)
              ))
              .limit(1);

            if (existingCount.length > 0) {
              await db!.update(unreadMessageCounts)
                .set({ unreadCount: existingCount[0].unreadCount + 1 })
                .where(eq(unreadMessageCounts.id, existingCount[0].id));
            } else {
              await db!.insert(unreadMessageCounts).values({
                userId: participant.userId,
                userType: "staff",
                threadId: input.threadId,
                unreadCount: 1,
              });
            }
          }
        }
      }

      return {
        success: true,
        messageId: messageResult.insertId,
      };
    }),
});
