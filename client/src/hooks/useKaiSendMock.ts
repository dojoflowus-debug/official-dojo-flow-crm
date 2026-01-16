/**
 * useKaiSendMock Hook
 * Client-side mock responses for testing debug overlay
 * No server/router changes required
 */

import { useState, useCallback } from 'react';
import { KaiDebugState } from '@/components/KaiDashboard/KaiDebugOverlay';

export interface KaiSendResponse {
  response: string;
  type: 'tool' | 'chat';
  procedure?: string;
  uiBlocks?: any[];
  data?: any;
}

export interface KaiSendState {
  loading: boolean;
  error: string | null;
  response: KaiSendResponse | null;
  debugState: KaiDebugState | null;
}

// Mock responses for different query types
const MOCK_RESPONSES: Record<string, KaiSendResponse> = {
  'how many students': {
    response: 'You have 24 active students enrolled across all programs.',
    type: 'tool',
    procedure: 'students.count',
    uiBlocks: [
      {
        type: 'metric',
        data: {
          label: 'Total Students',
          value: 24,
          unit: 'active',
          trend: '+3 this month',
        },
      },
    ],
  },
  'identify high-risk': {
    response: 'Found 3 at-risk students. Here are recommended interventions:',
    type: 'tool',
    procedure: 'students.atRisk',
    uiBlocks: [
      {
        type: 'card',
        data: {
          name: 'Marcus Johnson',
          reason: '14 days absent',
          intervention: 'Call parent + SMS reminder',
          actions: ['Message', 'Create Task', 'View Profile'],
        },
      },
      {
        type: 'card',
        data: {
          name: 'Sarah Chen',
          reason: 'Overdue tuition ($450)',
          intervention: 'Payment plan + incentive',
          actions: ['Send Invoice', 'Offer Discount', 'View Profile'],
        },
      },
      {
        type: 'card',
        data: {
          name: 'David Martinez',
          reason: 'Low attendance (40%)',
          intervention: 'Parent conference + schedule review',
          actions: ['Schedule Meeting', 'Review Schedule', 'View Profile'],
        },
      },
    ],
  },
  'new leads': {
    response: 'You have 7 new leads this week. 2 are high-priority (trial scheduled).',
    type: 'tool',
    procedure: 'leads.newThisWeek',
    uiBlocks: [
      {
        type: 'metric',
        data: {
          label: 'New Leads',
          value: 7,
          unit: 'this week',
          trend: '2 high-priority',
        },
      },
      {
        type: 'table',
        data: {
          headers: ['Name', 'Source', 'Status', 'Action'],
          rows: [
            ['Alex Rodriguez', 'Google', 'Trial Scheduled', 'Follow up'],
            ['Emma Wilson', 'Referral', 'Trial Scheduled', 'Confirm'],
            ['James Lee', 'Social Media', 'Interested', 'Send Info'],
          ],
        },
      },
    ],
  },
};

export function useKaiSendMock() {
  const [state, setState] = useState<KaiSendState>({
    loading: false,
    error: null,
    response: null,
    debugState: null,
  });

  const send = useCallback(async (query: string) => {
    // Reset state
    setState({
      loading: true,
      error: null,
      response: null,
      debugState: null,
    });

    // Log client-side
    console.log('[KAI_SEND]', { query });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Find matching mock response
      const queryLower = query.toLowerCase();
      let mockResponse: KaiSendResponse | null = null;

      if (queryLower.includes('how many students')) {
        mockResponse = MOCK_RESPONSES['how many students'];
      } else if (queryLower.includes('at-risk') || queryLower.includes('high-risk')) {
        mockResponse = MOCK_RESPONSES['identify high-risk'];
      } else if (queryLower.includes('new leads')) {
        mockResponse = MOCK_RESPONSES['new leads'];
      } else {
        // Default fallback response
        mockResponse = {
          response: `I'm not sure how to help with "${query}". Try asking about students, at-risk students, or new leads.`,
          type: 'chat',
        };
      }

      // Build debug state
      const debugState: KaiDebugState = {
        aiProvider: 'mock',
        endpointHit: true,
        lastRequestId: `req_${Date.now()}`,
        statusCode: 200,
        modelName: 'mock-kai',
        orgId: 1,
        userId: 1,
        routerIntent: mockResponse.procedure || '',
        toolCallsExecuted: mockResponse.procedure ? 1 : 0,
        uiBlocksReturned: mockResponse.uiBlocks?.length || 0,
        lastMessage: query,
        lastResponse: mockResponse.response,
        timestamp: new Date().toISOString(),
      };

      console.log('[KAI_RESPONSE]', { response: mockResponse, debugState });

      setState({
        loading: false,
        error: null,
        response: mockResponse,
        debugState,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error('[KAI_ERROR]', error);

      // Build error debug state
      const debugState: KaiDebugState = {
        aiProvider: 'none',
        endpointHit: false,
        lastRequestId: `req_${Date.now()}`,
        statusCode: 500,
        modelName: '',
        orgId: 1,
        userId: 1,
        routerIntent: '',
        toolCallsExecuted: 0,
        uiBlocksReturned: 0,
        lastMessage: query,
        lastResponse: '',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      };

      setState({
        loading: false,
        error: errorMessage,
        response: null,
        debugState,
      });
    }
  }, []);

  return {
    ...state,
    send,
    isLoading: state.loading,
  };
}
