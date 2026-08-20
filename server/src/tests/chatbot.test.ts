import { ChatbotController } from '../controllers/chatbotController';
import { GroqService, TicketContext } from '../services/groqService';
import { db, initDatabase } from '../db/database';

async function runTests() {
  console.log('🧪 Starting TrafficMitra Groq Chatbot Service Integration Tests...\n');
  initDatabase();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Controller Correctly Assembles Ticket Context from DB
  console.log('Test 1: Anti-Hallucination Ticket Context Assembly');
  try {
    ChatbotController.resetRateLimits();

    const mockReq: any = {
      body: {
        message: 'What is the status of TM-2026-004521?',
        history: []
      },
      ip: '127.0.0.1',
      headers: {}
    };

    let responseData: any = null;
    const mockRes: any = {
      status: (code: number) => {
        mockRes.statusCode = code;
        return mockRes;
      },
      json: (data: any) => {
        responseData = data;
        return mockRes;
      }
    };

    await ChatbotController.handleMessage(mockReq, mockRes);

    assert(responseData !== null, 'Chatbot returned a JSON response');
    assert(responseData.ticketFound === true, 'Ticket TM-2026-004521 was correctly identified in database');
    assert(responseData.ticketDetails?.ticket_id === 'TM-2026-004521', 'Ticket ID matches database record');
    assert(typeof responseData.reply === 'string' && responseData.reply.length > 0, 'Response reply is non-empty');
  } catch (err: any) {
    console.error('Test 1 error:', err);
    failed++;
  }

  // TEST 2: Simulated Timeout / Unreachable Fallback Response
  console.log('\nTest 2: Graceful Fallback on API Timeout or Unreachable Provider');
  try {
    const groqService = GroqService.getInstance();
    // Test fallback with ticket context
    const sampleContext: TicketContext = {
      ticket_id: 'TM-2026-999999',
      issue_type: 'illegal_parking',
      description: 'Vehicle parked blocking hospital entrance',
      address_text: 'Medical Square, Nagpur',
      severity_score: 9.0,
      status: 'in_progress',
      created_at: new Date().toISOString()
    };

    // Test fallback method directly
    const fallbackWithTicket = (groqService as any).fallbackResponse(
      [{ role: 'user', content: 'What is the status of TM-2026-999999?' }],
      sampleContext,
      'SIMULATED_TIMEOUT'
    );

    assert(fallbackWithTicket.includes('TM-2026-999999'), 'Fallback response contains ticket ID');
    assert(fallbackWithTicket.includes('ILLEGAL PARKING'), 'Fallback response correctly formats issue category');
    assert(fallbackWithTicket.includes('Medical Square'), 'Fallback response retains accurate location');

    // Test fallback without ticket
    const fallbackGeneral = (groqService as any).fallbackResponse(
      [{ role: 'user', content: 'Help me report traffic jam' }],
      null,
      'SIMULATED_TIMEOUT'
    );

    assert(fallbackGeneral.includes('TrafficMitra'), 'General fallback returns standard TrafficMitra guidance');
  } catch (err: any) {
    console.error('Test 2 error:', err);
    failed++;
  }

  // TEST 3: Rate Limiting Blocks Request After Threshold (Max 20 requests per 5 mins)
  console.log('\nTest 3: Per-Client Rate Limiting Enforced (Max 20 reqs / 5 mins)');
  try {
    ChatbotController.resetRateLimits();
    const testIp = '192.168.1.100';

    let lastStatusCode = 200;
    let rateLimitedResponse: any = null;

    // Send 21 requests in rapid succession
    for (let i = 1; i <= 21; i++) {
      const mockReq: any = {
        body: { message: `Test message ${i}`, history: [] },
        ip: testIp,
        headers: {}
      };

      const mockRes: any = {
        statusCode: 200,
        status: function(code: number) {
          this.statusCode = code;
          return this;
        },
        json: function(data: any) {
          if (this.statusCode === 429) {
            rateLimitedResponse = data;
          }
          return this;
        }
      };

      await ChatbotController.handleMessage(mockReq, mockRes);
      lastStatusCode = mockRes.statusCode;
    }

    assert(lastStatusCode === 429, '21st request was blocked with HTTP 429 Too Many Requests');
    assert(rateLimitedResponse?.code === 'RATE_LIMIT_EXCEEDED', 'Returns specific RATE_LIMIT_EXCEEDED error code');
    assert(typeof rateLimitedResponse?.retryAfter === 'number', 'Includes retryAfter cooldown in seconds');
  } catch (err: any) {
    console.error('Test 3 error:', err);
    failed++;
  }

  // TEST 4: Input Validation (Failure State 3)
  console.log('\nTest 4: Empty / Malformed Input Validation');
  try {
    const mockReq: any = {
      body: { message: '   ', history: [] },
      ip: '127.0.0.1',
      headers: {}
    };

    let statusCode = 200;
    const mockRes: any = {
      status: (code: number) => {
        statusCode = code;
        return mockRes;
      },
      json: () => mockRes
    };

    await ChatbotController.handleMessage(mockReq, mockRes);
    assert(statusCode === 400, 'Empty whitespace message rejected with HTTP 400 Bad Request');
  } catch (err: any) {
    console.error('Test 4 error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`🎯 Test Summary: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
