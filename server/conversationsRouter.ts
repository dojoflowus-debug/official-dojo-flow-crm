import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { conversations, messages, messageTemplates, leads, students } from "../drizzle/schema";
import { eq, and, or, desc } from "drizzle-orm";

export const conversationsRouter = router({
  // Get all conversations
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(["open", "closed", "archived"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(conversations);
      
      if (input?.status) {
        query = query.where(eq(conversations.status, input.status));
      }
      
      const allConversations = await query.orderBy(desc(conversations.lastMessageAt));
      return allConversations;
    }),

  // Get single conversation with messages
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [conversation] = await db.select()
        .from(conversations)
        .where(eq(conversations.id, input.id))
        .limit(1);
      
      if (!conversation) throw new Error("Conversation not found");
      
      const conversationMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, input.id))
        .orderBy(messages.createdAt);
      
      return { ...conversation, messages: conversationMessages };
    }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const conversationMessages = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);
      
      return conversationMessages;
    }),

  // Create or get conversation
  createOrGet: protectedProcedure
    .input(z.object({
      participantType: z.enum(["lead", "student"]),
      participantId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if conversation already exists
      const existing = await db.select()
        .from(conversations)
        .where(and(
          eq(conversations.participantType, input.participantType),
          eq(conversations.participantId, input.participantId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return { id: existing[0].id, isNew: false };
      }
      
      // Get participant details
      let participantName = "";
      let participantPhone = "";
      
      if (input.participantType === "lead") {
        const [lead] = await db.select().from(leads).where(eq(leads.id, input.participantId)).limit(1);
        if (lead) {
          participantName = `${lead.firstName} ${lead.lastName}`;
          participantPhone = lead.phone || "";
        }
      } else {
        const [student] = await db.select().from(students).where(eq(students.id, input.participantId)).limit(1);
        if (student) {
          participantName = `${student.firstName} ${student.lastName}`;
          participantPhone = student.phone || "";
        }
      }
      
      // Create new conversation
      const [conversation] = await db.insert(conversations).values({
        participantType: input.participantType,
        participantId: input.participantId,
        participantName,
        participantPhone,
        status: "open",
        unreadCount: 0,
      });
      
      return { id: conversation.insertId, isNew: true };
    }),

  // Send message
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string(),
      senderType: z.enum(["system", "staff", "automation"]).default("staff"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Create message
      const [message] = await db.insert(messages).values({
        conversationId: input.conversationId,
        direction: "outbound",
        content: input.content,
        senderType: input.senderType,
        senderId: input.senderType === "staff" ? ctx.user.id : null,
        status: "pending",
      });
      
      // TODO: Integrate with Twilio to actually send SMS
      // For now, just mark as sent
      await db.update(messages)
        .set({
          status: "sent",
          sentAt: new Date(),
        })
        .where(eq(messages.id, message.insertId));
      
      // Update conversation
      await db.update(conversations)
        .set({
          lastMessagePreview: input.content.substring(0, 100),
          lastMessageAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId));
      
      return { id: message.insertId };
    }),

  // Receive message (webhook from Twilio)
  receiveMessage: protectedProcedure
    .input(z.object({
      from: z.string(),
      content: z.string(),
      externalMessageId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Find conversation by phone number
      const [conversation] = await db.select()
        .from(conversations)
        .where(eq(conversations.participantPhone, input.from))
        .limit(1);
      
      if (!conversation) {
        throw new Error("Conversation not found for this phone number");
      }
      
      // Create message
      const [message] = await db.insert(messages).values({
        conversationId: conversation.id,
        direction: "inbound",
        content: input.content,
        senderType: "customer",
        status: "delivered",
        externalMessageId: input.externalMessageId,
        deliveredAt: new Date(),
      });
      
      // Update conversation
      await db.update(conversations)
        .set({
          lastMessagePreview: input.content.substring(0, 100),
          lastMessageAt: new Date(),
          unreadCount: (conversation.unreadCount || 0) + 1,
        })
        .where(eq(conversations.id, conversation.id));
      
      return { id: message.insertId };
    }),

  // Mark conversation as read
  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(conversations)
        .set({ unreadCount: 0 })
        .where(eq(conversations.id, input.conversationId));
      
      return { success: true };
    }),

  // Update conversation status
  updateStatus: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      status: z.enum(["open", "closed", "archived"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(conversations)
        .set({ status: input.status })
        .where(eq(conversations.id, input.conversationId));
      
      return { success: true };
    }),

  // Assign conversation to team member
  assign: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      assignedTo: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.update(conversations)
        .set({ assignedTo: input.assignedTo })
        .where(eq(conversations.id, input.conversationId));
      
      return { success: true };
    }),

  // Get message templates
  getTemplates: protectedProcedure
    .input(z.object({
      type: z.enum(["sms", "email"]).optional(),
      category: z.enum(["greeting", "follow_up", "reminder", "confirmation", "general"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      let query = db.select().from(messageTemplates);
      
      if (input?.type) {
        query = query.where(eq(messageTemplates.type, input.type));
      }
      
      if (input?.category) {
        query = query.where(eq(messageTemplates.category, input.category));
      }
      
      const templates = await query.orderBy(messageTemplates.name);
      return templates;
    }),

  // Create message template
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(["greeting", "follow_up", "reminder", "confirmation", "general"]),
      type: z.enum(["sms", "email"]),
      subject: z.string().optional(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [template] = await db.insert(messageTemplates).values({
        name: input.name,
        category: input.category,
        type: input.type,
        subject: input.subject,
        content: input.content,
        isSystem: 0,
        usageCount: 0,
      });
      
      return { id: template.insertId };
    }),

  // Get conversation statistics
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allConversations = await db.select().from(conversations);
      const allMessages = await db.select().from(messages);
      
      const stats = {
        totalConversations: allConversations.length,
        openConversations: allConversations.filter(c => c.status === "open").length,
        closedConversations: allConversations.filter(c => c.status === "closed").length,
        unreadCount: allConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
        totalMessages: allMessages.length,
        inboundMessages: allMessages.filter(m => m.direction === "inbound").length,
        outboundMessages: allMessages.filter(m => m.direction === "outbound").length,
      };
      
      return stats;
    }),
});
