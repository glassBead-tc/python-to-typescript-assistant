export const FASTAPI_EXAMPLES = {
  "fastapi-to-typescript-client": {
    title: "🔄 FastAPI to TypeScript Client Conversion",
    content: `# FastAPI to TypeScript Client Conversion

## Overview

Converting FastAPI backends to work seamlessly with TypeScript frontends, based on real-world patterns from projects like Next.js + FastAPI hybrid applications.

## Python FastAPI Backend (Original)

\`\`\`python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Union, Literal
from datetime import datetime
from enum import Enum

app = FastAPI()

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class UserCreate(BaseModel):
    username: str
    email: str
    role: UserRole = UserRole.USER
    metadata: Optional[dict] = None

class User(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    created_at: datetime
    is_active: bool = True
    metadata: Optional[dict] = None

class ApiResponse(BaseModel):
    success: bool
    data: Optional[Union[User, List[User]]] = None
    message: Optional[str] = None

@app.post("/api/users", response_model=ApiResponse)
async def create_user(user_data: UserCreate):
    # Simulate user creation
    new_user = User(
        id=123,
        username=user_data.username,
        email=user_data.email,
        role=user_data.role,
        created_at=datetime.now(),
        metadata=user_data.metadata
    )
    return ApiResponse(success=True, data=new_user)

@app.get("/api/users/{user_id}", response_model=ApiResponse)
async def get_user(user_id: int):
    # Simulate user retrieval
    user = User(
        id=user_id,
        username="john_doe",
        email="john@example.com",
        role=UserRole.USER,
        created_at=datetime.now()
    )
    return ApiResponse(success=True, data=user)
\`\`\`

## TypeScript Equivalent Patterns

### 1. Type Definitions

\`\`\`typescript
// Enum conversion - Python Enum becomes TypeScript union of literals
export type UserRole = 'admin' | 'user' | 'guest';

// Python BaseModel becomes TypeScript interface
export interface UserCreate {
  username: string;
  email: string;
  role: UserRole;
  metadata?: Record<string, unknown> | null; // Optional[dict] -> optional property with null
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string; // datetime -> ISO string
  is_active: boolean;
  metadata?: Record<string, unknown> | null;
}

// Union types translate directly
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T | null;
  message?: string | null;
}

// Specific response types for better type safety
export type UserResponse = ApiResponse<User>;
export type UsersResponse = ApiResponse<User[]>;
\`\`\`

### 2. API Client Implementation

\`\`\`typescript
// Configuration following real-world patterns
interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

class ApiClient {
  constructor(private config: ApiClientConfig) {}

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.config.baseUrl}\${endpoint}\`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status} \${response.statusText}\`);
    }

    return response.json();
  }

  async createUser(userData: UserCreate): Promise<UserResponse> {
    return this.makeRequest<UserResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(userId: number): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(\`/api/users/\${userId}\`);
  }
}

// Usage with proper error handling
export async function exampleUsage() {
  const client = new ApiClient({
    baseUrl: 'http://localhost:8000',
    headers: {
      'Authorization': 'Bearer your-token-here'
    }
  });

  try {
    // Type-safe API calls
    const createResponse = await client.createUser({
      username: 'jane_smith',
      email: 'jane@example.com',
      role: 'admin',
      metadata: { department: 'engineering' }
    });

    if (createResponse.success && createResponse.data) {
      console.log('User created:', createResponse.data.username);
      
      // TypeScript knows the exact shape here
      const userId: number = createResponse.data.id;
      const userRole: UserRole = createResponse.data.role;
    }
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}
\`\`\`

## Key Conversion Patterns

### Python 3.9+ → TypeScript Mappings

| Python 3.9+ | TypeScript | Notes |
|-------------|------------|-------|
| \`str \| int\` | \`string \| number\` | Union operators translate directly |
| \`Optional[str]\` | \`string \| null\` | Optional becomes union with null |
| \`List[User]\` | \`User[]\` | Generic collections |
| \`Dict[str, Any]\` | \`Record<string, unknown>\` | Dictionary mapping |
| \`Literal["admin"]\` | \`"admin"\` | Literal types |
| \`datetime\` | \`string\` | Serialize as ISO strings |
| \`Enum\` | Union of literals | More type-safe approach |

### FastAPI → TypeScript Client Benefits

1. **Automatic Type Safety**: Pydantic models provide structure that maps cleanly to TypeScript interfaces
2. **Error Handling**: FastAPI's HTTP exception patterns work well with fetch-based error handling  
3. **Async Patterns**: FastAPI's async nature aligns with TypeScript's Promise-based patterns
4. **Validation**: Pydantic validation rules can inform TypeScript runtime validation

### Real-World Considerations

- **Date Handling**: Always serialize dates as ISO strings, handle timezone conversions in TypeScript
- **Null vs Undefined**: Python's None maps to TypeScript null, but optional fields are undefined
- **Enum Strategy**: Union literals are more type-safe than TypeScript enums
- **Error Response Shape**: Standardize error response format for consistent client handling
- **Authentication**: JWT tokens work seamlessly between FastAPI and TypeScript clients

This pattern is used by companies like Uber and Netflix for their FastAPI → TypeScript integration workflows.`,
    tags: ["fastapi", "api-client", "pydantic", "real-world", "web-frameworks"],
    language: "typescript" as const
  }
}; 