import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export async function registerHybridArchitectures(server: McpServer): Promise<void> {
  server.resource(
    'hybrid-architectures',
    'guides://hybrid-architectures',
    async () => {
    const content = `# Hybrid Python-TypeScript Architectures

## Overview

When migrating from Python to TypeScript, a complete rewrite is often impractical. Hybrid architectures allow gradual migration while maintaining system functionality.

## Architecture Patterns

### 1. Microservice Bridge Pattern

Keep Python services for complex logic, add TypeScript API gateway:

\`\`\`typescript
// TypeScript API Gateway
import express from 'express';
import axios from 'axios';

const app = express();

// Proxy to Python data science service
app.post('/api/analyze', async (req, res) => {
  try {
    const result = await axios.post('http://python-service:5000/analyze', req.body);
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Native TypeScript endpoints
app.get('/api/users', async (req, res) => {
  // TypeScript business logic
  const users = await userService.getAll();
  res.json(users);
});
\`\`\`

\`\`\`python
# Python Data Science Service
from fastapi import FastAPI
import pandas as pd
import numpy as np

app = FastAPI()

@app.post("/analyze")
async def analyze_data(data: dict):
    df = pd.DataFrame(data['values'])
    analysis = {
        'mean': df.mean().to_dict(),
        'std': df.std().to_dict(),
        'correlation': df.corr().to_dict()
    }
    return analysis
\`\`\`

### 2. Shared Queue Architecture

Use message queues for language-agnostic communication:

\`\`\`typescript
// TypeScript Worker
import { Queue, Worker } from 'bullmq';

const processQueue = new Queue('data-processing');

// TypeScript produces work
await processQueue.add('analyze', {
  dataset: 'sales_2024',
  operations: ['aggregate', 'forecast']
});

// TypeScript consumes results
const resultWorker = new Worker('results', async (job) => {
  const { analysisId, results } = job.data;
  await saveResults(analysisId, results);
});
\`\`\`

\`\`\`python
# Python Worker
import redis
from bullmq import Worker
import pandas as pd

def process_analysis(job):
    dataset = job['data']['dataset']
    operations = job['data']['operations']
    
    # Heavy computation in Python
    df = load_dataset(dataset)
    results = perform_analysis(df, operations)
    
    # Send results back via queue
    result_queue.add('results', {
        'analysisId': job['id'],
        'results': results.to_dict()
    })

worker = Worker('data-processing', process_analysis)
worker.run()
\`\`\`

### 3. REST/GraphQL Bridge

TypeScript GraphQL server with Python REST backends:

\`\`\`typescript
// TypeScript GraphQL Server
import { ApolloServer, gql } from 'apollo-server';
import { RESTDataSource } from 'apollo-datasource-rest';

class PythonMLService extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'http://ml-service:8000/';
  }

  async predict(model: string, features: number[]) {
    return this.post('predict', { model, features });
  }

  async train(model: string, data: any) {
    return this.post('train', { model, data });
  }
}

const typeDefs = gql\`
  type Prediction {
    value: Float!
    confidence: Float!
  }

  type Query {
    predict(model: String!, features: [Float!]!): Prediction
  }

  type Mutation {
    trainModel(model: String!, data: JSON!): Boolean
  }
\`;

const resolvers = {
  Query: {
    predict: async (_, { model, features }, { dataSources }) => {
      return dataSources.pythonML.predict(model, features);
    }
  },
  Mutation: {
    trainModel: async (_, { model, data }, { dataSources }) => {
      return dataSources.pythonML.train(model, data);
    }
  }
};
\`\`\`

### 4. WebAssembly Integration

Run Python code in TypeScript via WASM:

\`\`\`typescript
// TypeScript with Pyodide
import { loadPyodide } from 'pyodide';

class PythonBridge {
  private pyodide: any;

  async initialize() {
    this.pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
    });
    
    // Load Python packages
    await this.pyodide.loadPackage(['numpy', 'pandas']);
  }

  async runPythonCode(code: string, inputs: any = {}) {
    // Pass inputs to Python
    for (const [key, value] of Object.entries(inputs)) {
      this.pyodide.globals.set(key, value);
    }
    
    // Execute Python code
    const result = await this.pyodide.runPythonAsync(code);
    
    // Convert result to JS
    return result.toJs();
  }

  async callPythonFunction(funcName: string, ...args: any[]) {
    const func = this.pyodide.globals.get(funcName);
    const result = func(...args);
    return result.toJs();
  }
}

// Usage
const bridge = new PythonBridge();
await bridge.initialize();

const pythonCode = \`
import numpy as np
import pandas as pd

def analyze_timeseries(data):
    df = pd.DataFrame(data)
    return {
        'trend': df.rolling(window=7).mean().tolist(),
        'seasonality': detect_seasonality(df),
        'forecast': forecast_next_period(df)
    }
\`;

await bridge.runPythonCode(pythonCode);
const result = await bridge.callPythonFunction('analyze_timeseries', data);
\`\`\`

### 5. Subprocess Architecture

TypeScript orchestrates Python scripts:

\`\`\`typescript
// TypeScript Process Manager
import { spawn } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream';

class PythonProcessor {
  async runScript(scriptPath: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [scriptPath, ...args]);
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(\`Python script failed: \${stderr}\`));
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            resolve(stdout);
          }
        }
      });
    });
  }

  async streamProcess(scriptPath: string, inputStream: NodeJS.ReadableStream) {
    const python = spawn('python3', [scriptPath]);
    const pipelineAsync = promisify(pipeline);
    
    await pipelineAsync(
      inputStream,
      python.stdin
    );
    
    return python.stdout;
  }
}
\`\`\`

## Migration Strategies

### Phase 1: Identify Boundaries
1. Map service dependencies
2. Identify Python-specific components (ML, data science)
3. Define clear API contracts

### Phase 2: Build TypeScript Shell
1. Create TypeScript API gateway
2. Implement shared authentication
3. Set up monitoring/logging

### Phase 3: Gradual Service Migration
1. Start with stateless services
2. Migrate simple CRUD operations
3. Keep complex algorithms in Python

### Phase 4: Data Layer Integration
1. Share database connections
2. Implement event sourcing
3. Use change data capture (CDC)

## Communication Patterns

### JSON-RPC
\`\`\`typescript
// TypeScript Client
class PythonRPCClient {
  async call(method: string, params: any[]) {
    const response = await fetch('http://python-rpc:4000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    });
    const result = await response.json();
    return result.result;
  }
}
\`\`\`

### gRPC
\`\`\`typescript
// TypeScript gRPC Client
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('service.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const client = new proto.DataService(
  'python-grpc:50051',
  grpc.credentials.createInsecure()
);

client.processData({ input: data }, (err, response) => {
  if (!err) {
    console.log('Processed:', response.output);
  }
});
\`\`\`

## Performance Considerations

### Caching Strategy
- Cache Python computation results in Redis
- Use TypeScript for cache management
- Implement cache warming strategies

### Load Balancing
- Route compute-intensive tasks to Python
- Handle I/O operations in TypeScript
- Use circuit breakers for service failures

### Monitoring
- Unified logging with correlation IDs
- Distributed tracing (OpenTelemetry)
- Service mesh for observability

## Database Patterns

### Shared Database
\`\`\`typescript
// TypeScript: Read-heavy operations
class UserService {
  async getUsers() {
    return await db.query('SELECT * FROM users WHERE active = true');
  }
}
\`\`\`

\`\`\`python
# Python: Write-heavy analytics
class AnalyticsService:
    def process_user_events(self, events):
        df = pd.DataFrame(events)
        aggregated = df.groupby('user_id').agg({
            'event_count': 'sum',
            'duration': 'mean'
        })
        aggregated.to_sql('user_analytics', connection)
\`\`\`

### Event Sourcing
\`\`\`typescript
// TypeScript: Event producer
class EventStore {
  async append(streamId: string, events: Event[]) {
    await kafka.producer.send({
      topic: 'domain-events',
      messages: events.map(e => ({
        key: streamId,
        value: JSON.stringify(e)
      }))
    });
  }
}
\`\`\`

\`\`\`python
# Python: Event consumer for analytics
from kafka import KafkaConsumer

consumer = KafkaConsumer('domain-events')
for message in consumer:
    event = json.loads(message.value)
    update_analytics_model(event)
    train_ml_model_incremental(event)
\`\`\`

## Security Considerations

### Authentication
- Shared JWT validation
- Service-to-service mTLS
- API key management

### Data Validation
\`\`\`typescript
// TypeScript: Input validation
import { z } from 'zod';

const DataSchema = z.object({
  values: z.array(z.number()),
  options: z.object({
    normalize: z.boolean(),
    outlierRemoval: z.boolean()
  })
});

app.post('/process', async (req, res) => {
  const validated = DataSchema.parse(req.body);
  const result = await pythonService.process(validated);
  res.json(result);
});
\`\`\`

## Testing Strategies

### Integration Testing
\`\`\`typescript
// TypeScript: Test hybrid flow
describe('Hybrid Data Processing', () => {
  it('should process data through Python service', async () => {
    // Arrange
    const mockData = generateTestData();
    
    // Act
    const result = await hybridProcessor.process(mockData);
    
    // Assert
    expect(result.pythonProcessed).toBe(true);
    expect(result.typeScriptFormatted).toBe(true);
  });
});
\`\`\`

### Contract Testing
- Use Pact for service contracts
- Schema validation at boundaries
- Backwards compatibility checks

## Deployment Patterns

### Docker Compose
\`\`\`yaml
version: '3.8'
services:
  typescript-api:
    build: ./typescript-service
    ports:
      - "3000:3000"
    depends_on:
      - python-ml
      - redis
  
  python-ml:
    build: ./python-service
    environment:
      - MODEL_PATH=/models
    volumes:
      - ./models:/models
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
\`\`\`

### Kubernetes
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hybrid-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: typescript
        image: app/typescript:latest
        ports:
        - containerPort: 3000
      - name: python-sidecar
        image: app/python:latest
        ports:
        - containerPort: 5000
\`\`\`

## Best Practices

1. **Clear Boundaries**: Define service responsibilities clearly
2. **API Contracts**: Use OpenAPI/Proto schemas
3. **Error Handling**: Implement circuit breakers and retries
4. **Monitoring**: Unified logging and tracing
5. **Performance**: Profile and optimize bottlenecks
6. **Security**: Validate at service boundaries
7. **Documentation**: Maintain architecture decision records (ADRs)

## Example: E-commerce Platform

### Before (Monolithic Python)
- Django monolith
- Celery for async tasks
- PostgreSQL database

### After (Hybrid Architecture)
- TypeScript: API gateway, user service, order service
- Python: Recommendation engine, analytics, ML models
- Shared: PostgreSQL, Redis, Kafka
- Communication: REST + gRPC + Events

### Migration Timeline
1. Month 1-2: TypeScript API gateway
2. Month 3-4: Extract user service
3. Month 5-6: Extract order service
4. Month 7+: Optimize and monitor

## Resources

- [TypeScript Microservices](https://www.typescriptlang.org/docs/handbook/microservices.html)
- [Python Microservices](https://python-microservices.github.io/)
- [gRPC Documentation](https://grpc.io/docs/)
- [Apache Kafka](https://kafka.apache.org/)
- [Docker Compose](https://docs.docker.com/compose/)
`;

    return {
      contents: [{
        uri: 'guides://hybrid-architectures',
        mimeType: 'text/markdown',
        text: content
      }]
    };
  });
}