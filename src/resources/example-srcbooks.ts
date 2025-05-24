import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import chalk from "chalk";

// Import separate example collections
import { FASTAPI_EXAMPLES } from "./fastapi-examples.js";
import { NUMPY_EXAMPLES } from "./numpy-examples.js";
import { TYPING_EXAMPLES } from "./typing-examples.js";
import { DJANGO_EXAMPLES } from "./django-examples.js";

// Combine all example collections into a central registry
const EXAMPLE_SRCBOOKS = {
  ...FASTAPI_EXAMPLES,
  ...NUMPY_EXAMPLES,
  ...TYPING_EXAMPLES,
  ...DJANGO_EXAMPLES
};

export async function registerExampleSrcbooks(server: McpServer): Promise<void> {
  server.resource(
    "srcbook-examples-index",
    "srcbook://examples",
    {
      name: "Python-to-TypeScript example Srcbooks with real-world porting patterns",
      mimeType: "application/json"
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify({
              examples: Object.entries(EXAMPLE_SRCBOOKS).map(([id, example]) => ({
                id,
                ...example
              })),
              usage: "These examples are based on real-world Python-to-TypeScript porting projects and can be used as templates for ephemeral journals.",
              patterns_covered: [
                "FastAPI to TypeScript client generation",
                "NumPy/Pandas data processing conversion", 
                "Python typing system to TypeScript mapping",
                "Django to Next.js migration patterns",
                "Real API integration examples",
                "Data science workflow porting",
                "Authentication pattern conversion",
                "Type-safe error handling"
              ]
            }, null, 2),
            mimeType: "application/json"
          }
        ]
      };
    }
  );

  // Register individual example resources
  for (const [id, example] of Object.entries(EXAMPLE_SRCBOOKS)) {
    server.resource(
      `srcbook-example-${id}`,
      `srcbook://examples/${id}`,
      {
        name: example.title,
        mimeType: "text/markdown"
      },
      async (uri) => {
        return {
          contents: [
            {
              uri: uri.href,
              text: example.content,
              mimeType: "text/markdown"
            }
          ]
        };
      }
    );
  }

  console.error("✅ Registered example Srcbooks as reference resources");
} 