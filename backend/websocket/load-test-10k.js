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

// Test configuration - 10k concurrent users
export const options = {
  stages: [
    { duration: '2m', target: 5000 }, // Ramp-up to 5k over 2 min
    { duration: '3m', target: 10000 }, // Ramp-up from 5k to 10k over 3 min
    { duration: '30s', target: 10000 }, // Hold at 10k for 30 sec
    { duration: '1m', target: 0 }, // Ramp-down over 1 min
  ],
  thresholds: {
    ws_connecting: ['p(99)<5000'],
    message_latency_ms: ['p(95)<100', 'p(99)<500'],
    errors: ['count<100'],
  },
};

// Generate a simple test token
function generateJWT() {
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
      if (__VU % 1000 === 0) {
        console.log(`VU ${__VU} ✅ : Connected in ${connectTime}ms`);
      }

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
        errors.add(1);
      }
    });

    socket.on('close', () => {
      connections.add(-1);
    });

    socket.on('error', (e) => {
      if (__VU % 100 === 0) {
        console.error(`VU ${__VU}: WebSocket error: ${e}`);
      }
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

    // Hold connection open for the test duration
    socket.setTimeout(() => {
      socket.close();
    }, 120000); // Close after 2 minutes
  });

  // Check connection status
  check(res, {
    'status is 101': (r) => r && r.status === 101,
  });
}
