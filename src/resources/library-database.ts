import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import chalk from "chalk";

export async function registerLibraryDatabase(server: McpServer): Promise<void> {
  server.resource(
    "library-database",
    "db://libraries",
    async (uri) => {
      const content = `# Python to TypeScript Library Mapping Database

## Web Frameworks
- **Flask** → Express.js, Fastify
- **Django** → Nest.js, Next.js
- **FastAPI** → Fastify, tRPC

## Data Processing  
- **Pandas** → No direct equivalent (consider keeping Python backend)
- **NumPy** → ML-Matrix, NumJS (limited)

## HTTP Clients
- **Requests** → Axios, Fetch API
- **urllib** → Node.js http/https modules

## Database
- **SQLAlchemy** → TypeORM, Prisma
- **PyMongo** → MongoDB Node.js driver

## Testing
- **pytest** → Jest, Vitest
- **unittest** → Jest, Node.js assert

## Utilities
- **dateutil** → date-fns, day.js
- **pathlib** → Node.js path module
- **json** → Native JSON support
- **re** → Native RegExp

## Async/Concurrency
- **asyncio** → Native async/await
- **threading** → Worker threads, cluster
- **multiprocessing** → Worker processes, cluster

## CLI
- **argparse** → Commander.js, yargs
- **click** → Inquirer.js for interactive CLIs

## Configuration
- **configparser** → dotenv, config packages
- **os.environ** → process.env`;

      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown",
          text: content
        }]
      };
    }
  );

  console.error(chalk.green("✅ Registered library database"));
} 