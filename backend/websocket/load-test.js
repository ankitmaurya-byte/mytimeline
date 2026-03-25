import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Counter, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const errors = new Counter('errors');
const connections = new Gauge('connections');
const messageLatency = new Trend('message_latency');
const connectionTime = new Trend('connection_time');

// Test configuration
export const options = {
  // Test stages - ramp up and down
  stages: [
    { duration: '30s', target: 1000 }, // Ramp-up to 1k
    { duration: '30s', target: 5000 }, // Ramp-up to 5k
    { duration: '1m', target: 10000 }, // Ramp-up to 10k
    { duration: '2m', target: 10000 }, // Stay at 10k for 2 minutes
    { duration: '30s', target: 5000 }, // Ramp-down to 5k
    { duration: '30s', target: 0 }, // Ramp-down to 0
  ],

  // Thresholds
  thresholds: {
    ws_connecting: ['p(99)<5000'], // 99th percentile connection time < 5s
    message_latency: ['p(95)<100', 'p(99)<500'], // 95th p < 100ms, 99th p < 500ms
    errors: ['count<100'], // Less than 100 errors
    ws_sessions_total: ['value>0'], // At least some connections
  },

  // Other options
  ext: {
    loadimpact: {
      projectID: 3334607,
      name: 'Timeline WebSocket Load Test',
    },
  },
};

export default function () {
  const url = 'ws://localhost:8001/ws';
  const params = {
    tags: { name: 'WebSocketTest' },
    headers: {
      Authorization: `Bearer ${generateMockJWT()}`,
    },
  };

  let response;
  const startTime = Date.now();

  group('WebSocket Connection', function () {
    response = ws.connect(url, params, function (socket) {
      const connectTime = Date.now() - startTime;
      connectionTime.add(connectTime);
      connections.add(1);

      socket.on('open', () => {
        console.log(`✅ Connected in ${connectTime}ms`);
      });

      socket.on('message', (data) => {
        const message = JSON.parse(data);

        // Measure latency if timestamp is included
        if (message.timestamp) {
          const latency = Date.now() - parseInt(message.timestamp);
          messageLatency.add(latency);
        }

        // Verify message structure
        check(message, {
          'has type': (m) => m.type !== undefined,
          'has payload': (m) => m.payload !== undefined,
        }) || errors.add(1);
      });

      socket.on('close', () => {
        connections.add(-1);
        console.log('Connection closed');
      });

      socket.on('error', (e) => {
        console.error(`❌ WebSocket error: ${e}`);
        errors.add(1);
      });

      // Send test message every 2 seconds
      socket.send(
        JSON.stringify({
          type: 'PING',
          payload: {
            timestamp: Date.now(),
            userId: `user-${__VU}`,
            workspaceId: 'test-workspace',
          },
          id: `msg-${__VU}-${Date.now()}`,
        })
      );

      // Listen for 30 seconds per connection
      socket.setTimeout(() => {
        socket.close();
      }, 30000);

      socket.on('open', () => {
        // Send message every 2 seconds
        socket.setInterval(() => {
          if (socket.readyState === ws.OPEN) {
            socket.send(
              JSON.stringify({
                type: 'PING',
                payload: {
                  timestamp: Date.now(),
                  userId: `user-${__VU}`,
                  workspaceId: 'test-workspace',
                },
                id: `msg-${__VU}-${Date.now()}`,
              })
            );
          }
        }, 2000);
      });
    });
  });

  check(response, {
    'status is 101 (Switching Protocols)': (r) => r && r.status === 101,
  }) || errors.add(1);

  sleep(1);
}

// Helper to generate a mock JWT token
function generateMockJWT() {
  // For testing - in production use real JWT
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      userId: `user-${__VU}`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  );
  return `${header}.${payload}.fake-signature`;
}

export function teardown(data) {
  console.log('✅ Load test completed');
  console.log(`Final connections: ${connections.value}`);
  console.log(`Total errors: ${errors.value}`);
  console.log(`Avg message latency: ${messageLatency.value}ms`);
  console.log(`Avg connection time: ${connectionTime.value}ms`);
}
