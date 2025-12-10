import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ============ STUDENT ROUTER ============

const studentRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllStudents();
  }),
  
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getStudentById(input.id);
    }),
  
  create: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      dateOfBirth: z.date().optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      zipCode: z.string().optional().nullable(),
      latitude: z.string().optional().nullable(),
      longitude: z.string().optional().nullable(),
      beltRank: z.enum(["white", "yellow", "orange", "green", "blue", "purple", "brown", "red", "black"]).optional(),
      stripes: z.number().optional(),
      program: z.string().optional().nullable(),
      category: z.enum(["A", "B", "C"]).optional(),
      status: z.enum(["active", "inactive", "trial", "frozen"]).optional(),
      membershipType: z.string().optional().nullable(),
      monthlyRate: z.number().optional(),
      guardianName: z.string().optional().nullable(),
      guardianPhone: z.string().optional().nullable(),
      guardianEmail: z.string().optional().nullable(),
      guardianRelation: z.string().optional().nullable(),
      photoUrl: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      return db.createStudent(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        dateOfBirth: z.date().optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
        latitude: z.string().optional().nullable(),
        longitude: z.string().optional().nullable(),
        beltRank: z.enum(["white", "yellow", "orange", "green", "blue", "purple", "brown", "red", "black"]).optional(),
        stripes: z.number().optional(),
        program: z.string().optional().nullable(),
        category: z.enum(["A", "B", "C"]).optional(),
        status: z.enum(["active", "inactive", "trial", "frozen"]).optional(),
        membershipType: z.string().optional().nullable(),
        monthlyRate: z.number().optional(),
        paymentStatus: z.enum(["current", "late", "overdue"]).optional(),
        guardianName: z.string().optional().nullable(),
        guardianPhone: z.string().optional().nullable(),
        guardianEmail: z.string().optional().nullable(),
        guardianRelation: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateStudent(input.id, input.data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteStudent(input.id);
      return { success: true };
    }),
  
  stats: publicProcedure.query(async () => {
    return db.getStudentStats();
  }),
  
  beltDistribution: publicProcedure.query(async () => {
    return db.getBeltDistribution();
  }),
});

// ============ LEAD ROUTER ============

const leadRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllLeads();
  }),
  
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getLeadById(input.id);
    }),
  
  byStage: publicProcedure.query(async () => {
    return db.getLeadsByStage();
  }),
  
  create: protectedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      stage: z.enum(["new", "contacted", "appointment_set", "trial_scheduled", "trial_completed", "proposal_sent", "negotiation", "won", "lost"]).optional(),
      source: z.string().optional().nullable(),
      interestedProgram: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      return db.createLead(input);
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        stage: z.enum(["new", "contacted", "appointment_set", "trial_scheduled", "trial_completed", "proposal_sent", "negotiation", "won", "lost"]).optional(),
        source: z.string().optional().nullable(),
        interestedProgram: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
        lastContactDate: z.date().optional().nullable(),
        nextFollowUpDate: z.date().optional().nullable(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateLead(input.id, input.data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteLead(input.id);
      return { success: true };
    }),
});

// ============ CONVERSATION ROUTER ============

const conversationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getConversationsByUser(ctx.user.id);
  }),
  
  create: protectedProcedure
    .input(z.object({
      title: z.string().optional(),
      collection: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return db.createConversation({
        userId: ctx.user.id,
        title: input.title || "New Conversation",
        collection: input.collection,
      });
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        title: z.string().optional(),
        collection: z.string().optional(),
        isPinned: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      await db.updateConversation(input.id, input.data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteConversation(input.id);
      return { success: true };
    }),
});

// ============ MESSAGE ROUTER ============

const messageRouter = router({
  list: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return db.getMessagesByConversation(input.conversationId);
    }),
  
  send: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // Save user message
      await db.createMessage({
        conversationId: input.conversationId,
        role: "user",
        content: input.content,
      });
      
      // Get data summary for Kai
      const dataSummary = await db.getKaiDataSummary();
      
      // Generate AI response with real data context
      const systemPrompt = `You are Kai, an AI assistant for DojoFlow - a martial arts school management system. 
You have access to real-time data about the school:

CURRENT DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

When answering questions:
- Use the actual data provided above to give accurate answers
- Be conversational and helpful with a warm, professional tone
- When discussing students, use actual counts and statistics
- When discussing billing, reference the actual late payers and revenue data
- If asked about specific students who are late on payments, list them by name
- Provide actionable insights based on the data
- Keep responses concise but informative`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.content },
        ],
      });
      
      const rawContent = response.choices[0]?.message?.content;
      const aiContent = typeof rawContent === 'string' ? rawContent : "I apologize, I couldn't process that request.";
      
      // Save AI response
      const result = await db.createMessage({
        conversationId: input.conversationId,
        role: "assistant",
        content: aiContent,
      });
      
      return { 
        userMessageId: result.id,
        aiResponse: aiContent,
      };
    }),
});

// ============ KAI ROUTER ============

const kaiRouter = router({
  dataSummary: protectedProcedure.query(async () => {
    return db.getKaiDataSummary();
  }),
  
  quickAnswer: protectedProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      const dataSummary = await db.getKaiDataSummary();
      
      const systemPrompt = `You are Kai, an AI assistant for DojoFlow - a martial arts school management system.
You have access to real-time data:
${JSON.stringify(dataSummary, null, 2)}

Answer the question concisely using actual data. Be warm and professional.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.question },
        ],
      });
      
      const rawAnswer = response.choices[0]?.message?.content;
      return {
        answer: typeof rawAnswer === 'string' ? rawAnswer : "I couldn't process that request.",
      };
    }),
});

// ============ MAIN ROUTER ============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  student: studentRouter,
  lead: leadRouter,
  conversation: conversationRouter,
  message: messageRouter,
  kai: kaiRouter,
});

export type AppRouter = typeof appRouter;
