/**
 * Tests for Lead Capture Router
 * Tests the Kai conversation engine and lead extraction logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import leadCaptureRouter from './leadCaptureRouter';

describe('Lead Capture Router', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/kai', leadCaptureRouter);
  });

  describe('POST /api/kai/lead-capture', () => {
    it('should return error if organizationId is missing', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          userMessage: 'Hello',
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return error if userMessage is missing', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should extract name from user message', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: "Hi, I'm John Smith",
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.firstName).toBe('John');
      expect(response.body.extractedData.lastName).toBe('Smith');
    });

    it('should extract email from user message', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'My email is john@example.com',
          conversationStage: 'contact',
          currentLeadData: { firstName: 'John' },
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.email).toBe('john@example.com');
    });

    it('should extract phone number from user message', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'You can reach me at 555-123-4567',
          conversationStage: 'contact',
          currentLeadData: { firstName: 'John' },
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.phone).toBeDefined();
    });

    it('should detect age group from keywords', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'This is for my 8-year-old child',
          conversationStage: 'age',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.ageGroup).toBe('child');
      expect(response.body.extractedData.programInterest).toBe('kids');
    });

    it('should detect teen age group', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'My teenager is interested',
          conversationStage: 'age',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.ageGroup).toBe('teen');
      expect(response.body.extractedData.programInterest).toBe('teens');
    });

    it('should detect adult age group', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'I want to join for myself',
          conversationStage: 'age',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.ageGroup).toBe('adult');
      expect(response.body.extractedData.programInterest).toBe('adults');
    });

    it('should detect kickboxing program interest', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'I am interested in kickboxing',
          conversationStage: 'program',
          currentLeadData: { ageGroup: 'adult' },
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.programInterest).toBe('kickboxing');
    });

    it('should detect schedule preference', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'We prefer weekend classes',
          conversationStage: 'schedule',
          currentLeadData: { firstName: 'John' },
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.schedulePreference).toBe('weekend');
    });

    it('should detect fitness goal', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'We want to get fit and healthy',
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.goal).toBe('fitness');
    });

    it('should detect confidence goal', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'We want to build confidence',
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.extractedData.goal).toBe('confidence');
    });

    it('should progress conversation from greeting to age', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'Hi there',
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.nextStage).toBe('age');
      expect(response.body.kaiResponse).toBeDefined();
    });

    it('should progress conversation from age to program', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'For my 10-year-old',
          conversationStage: 'age',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.nextStage).toBe('program');
    });

    it('should progress conversation from program to location', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'Kids karate sounds great',
          conversationStage: 'program',
          currentLeadData: { programInterest: 'kids' },
        });

      expect(response.status).toBe(200);
      expect(response.body.nextStage).toBe('location');
    });

    it('should progress conversation from location to schedule', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'Downtown location',
          conversationStage: 'location',
          currentLeadData: { location: 'downtown' },
        });

      expect(response.status).toBe(200);
      expect(response.body.nextStage).toBe('schedule');
    });

    it('should progress conversation from schedule to contact', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'Weekday evenings work best',
          conversationStage: 'schedule',
          currentLeadData: { schedulePreference: 'afternoon' },
        });

      expect(response.status).toBe(200);
      expect(response.body.nextStage).toBe('contact');
    });

    it('should progress conversation from contact to booking', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: '555-123-4567',
          conversationStage: 'contact',
          currentLeadData: { 
            firstName: 'John',
            phone: '5551234567'
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.nextStage).toBe('booking');
    });

    it('should provide Kai greeting response', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          userMessage: 'Hello',
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.kaiResponse).toBeDefined();
      expect(response.body.kaiResponse.length).toBeGreaterThan(0);
    });

    it('should handle location parameter', async () => {
      const response = await request(app)
        .post('/api/kai/lead-capture')
        .send({
          organizationId: 1,
          locationId: 5,
          userMessage: 'Hello',
          conversationStage: 'greeting',
          currentLeadData: {},
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
