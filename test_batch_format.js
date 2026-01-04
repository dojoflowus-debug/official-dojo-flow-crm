// Test what format tRPC httpBatchLink sends
const { httpBatchLink } = require("@trpc/client");
const superjson = require("superjson");

// Create a mock fetch to see what's being sent
const mockFetch = (url, init) => {
  console.log("URL:", url);
  console.log("Init:", JSON.stringify(init, null, 2));
  if (init.body) {
    console.log("Body:", init.body);
  }
  return Promise.resolve(new Response(JSON.stringify({ result: { data: null } })));
};

// Create the link
const link = httpBatchLink({
  url: "/api/trpc",
  transformer: superjson,
  fetch: mockFetch,
});

console.log("httpBatchLink created");
