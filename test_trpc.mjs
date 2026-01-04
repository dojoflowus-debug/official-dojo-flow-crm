import fetch from 'node-fetch';

// Test the correct tRPC batch format
const batchRequest = [
  {
    id: "1",
    jsonrpc: "2.0",
    method: "mutation",
    params: {
      path: "ownerAuth.login",
      input: { email: "test@test.com", password: "test123" }
    }
  }
];

console.log('Sending batch request:', JSON.stringify(batchRequest, null, 2));

const response = await fetch('http://localhost:3000/api/trpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(batchRequest)
});

const text = await response.text();
console.log('Response status:', response.status);
console.log('Response:', text);
