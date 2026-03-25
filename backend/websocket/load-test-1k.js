import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const errors = new Counter('errors');
const connections = new Gauge('connections_active');
const messageLatency = new Trend('message_latency_ms');
const connectionTime = new Trend('connection_time_ms');
const successfulConnections = new Counter('successful_connections');
const failedConnections = new Counter('failed_connections');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp-up to 100
    { duration: '1m', target: 100 }, // Hold at 100
    { duration: '20s', target: 0 }, // Ramp-down
  ],
  thresholds: {
    ws_connecting: ['p(99)<5000'],
    message_latency_ms: ['p(95)<100', 'p(99)<500'],
    errors: ['count<20'],
  },
};

// Generate a simple test token by calling the backend API
function generateJWT() {
  // Since k6 doesn't have crypto/JWT support, we'll fetch a token from the backend
  // For now, use a fixed token that the backend will accept during testing
  // In production, you'd get this from an auth endpoint
  return `test-token-vu${__VU}`;
}

export default function () {
  const token = generateJWT();
  const url = `ws://localhost:8001/ws?token=${encodeURIComponent(token)}`;
  const startTime = Date.now();
  let connectionEstablished = false;

  const res = ws.connect(url, null, function (socket) {
    const connectTime = Date.now() - startTime;
    connectionEstablished = true;

    connectionTime.add(connectTime);
    connections.add(1);
    successfulConnections.add(1);

    socket.on('open', () => {
      //   console.log(`✅ VU ${__VU}: Connected in ${connectTime}ms`);

      // Send initial message
      socket.send(
        JSON.stringify({
          type: 'PING',
          payload: {
            timestamp: Date.now(),
            userId: `user-${__VU}`,
            workspaceId: 'test-ws',
          },
        })
      );
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (message.timestamp) {
          const latency = Date.now() - parseInt(message.timestamp);
          messageLatency.add(latency);
        }
      } catch (e) {
        console.error(`VU ${__VU}: Failed to parse message: ${e}`);
        errors.add(1);
      }
    });

    socket.on('close', () => {
      connections.add(-1);
    });

    socket.on('error', (e) => {
      console.error(`VU ${__VU}: WebSocket error: ${e}`);
      errors.add(1);
    });

    // Keep connection open and send messages every 3 seconds
    let msgCount = 0;
    socket.setInterval(() => {
      if (socket.readyState === ws.OPEN) {
        msgCount++;
        socket.send(
          JSON.stringify({
            type: 'PING',
            payload: {
              timestamp: Date.now(),
              userId: `user-${__VU}`,
              workspaceId: 'test-ws',
              msgNum: msgCount,
            },
          })
        );
      }
    }, 3000);

    // Close after test duration
    socket.setTimeout(() => {
      socket.close();
    }, 110000);
  });

  check(res, {
    'status is 101': (r) => r && r.status === 101,
  }) || failedConnections.add(1);

  sleep(1);
}

export function teardown(data) {
  console.log('\n✅ Load Test Summary:');
  console.log(`Total Successful Connections: ${successfulConnections.value}`);
  console.log(`Total Failed Connections: ${failedConnections.value}`);
  console.log(`Total Errors: ${errors.value}`);
}
