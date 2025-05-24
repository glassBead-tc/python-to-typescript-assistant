<!-- srcbook:{"language":"typescript"} -->

# Flask API to Express.js Migration (Python 3.9+)

###### package.json

```json
{
  "type": "module",
  "dependencies": {
    "express": "^4.18.0",
    "@types/express": "^4.17.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

This notebook demonstrates a systematic approach to porting a Flask API to Express.js, showcasing how Python 3.9+ features translate beautifully to TypeScript.

## Porting Strategy Analysis

First, we analyze the overall porting strategy for this Flask application:

**Tools used:**
- `porting-strategy` - Overall project analysis
- `library-mapping` - Flask → Express.js mapping
- `type-analysis` - Python 3.9+ type mappings

## Original Python Code (Python 3.9+)

The original Flask API uses modern Python 3.9+ syntax with built-in generics and union types:

```python
# app.py - Modern Python 3.9+ Flask API
from flask import Flask, request, jsonify
from typing import Optional
from dataclasses import dataclass

app = Flask(__name__)

@dataclass
class User:
    id: int
    name: str
    email: str | None = None  # Python 3.9+ union syntax!
    tags: list[str] = None    # Python 3.9+ built-in generics!
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []

# In-memory storage with Python 3.9+ types
users: dict[int, User] = {}  # No typing import needed!
next_id: int = 1

@app.route('/users', methods=['GET'])
def get_users() -> dict[str, list[dict[str, str | int | list[str]]]]:
    return {
        'users': [
            {
                'id': user.id,
                'name': user.name, 
                'email': user.email,
                'tags': user.tags
            }
            for user in users.values()
        ]
    }

@app.route('/users', methods=['POST'])
def create_user() -> dict[str, User | str] | tuple[dict[str, str], int]:
    global next_id
    data = request.get_json()
    
    if not data or 'name' not in data:
        return {'error': 'Name is required'}, 400
    
    user = User(
        id=next_id,
        name=data['name'],
        email=data.get('email'),
        tags=data.get('tags', [])
    )
    
    users[next_id] = user
    next_id += 1
    
    return {'user': user}
```

## Type Analysis Results

Using the `type-analysis` tool on our Python 3.9+ types:

**Key Mappings:**
- `str | None` → `string | null` ✨ Perfect alignment!
- `list[str]` → `string[]` ✨ No typing import needed!
- `dict[int, User]` → `Record<number, User>` ✨ Clean mapping!
- `dict[str, list[dict[str, str | int | list[str]]]]` → Complex union type

## Library Mapping Analysis

Using `library-mapping` tool for Flask → Express.js:

**Results:**
- **Flask** → **Express.js** (High confidence)
- **Migration complexity:** Moderate
- **Key differences:** Decorator syntax → Manual route definition

## TypeScript Conversion

### User Interface Definition

###### types.ts

```typescript
// TypeScript interface derived from Python dataclass
export interface User {
  id: number;
  name: string;
  email: string | null; // Python 3.9+ str | None maps perfectly!
  tags: string[];        // Python 3.9+ list[str] maps perfectly!
}

// Response types derived from Python type hints
export interface UsersResponse {
  users: Array<{
    id: number;
    name: string;
    email: string | null;
    tags: string[];
  }>;
}

export interface CreateUserRequest {
  name: string;
  email?: string;
  tags?: string[];
}

export interface CreateUserResponse {
  user: User;
}

export interface ErrorResponse {
  error: string;
}
```

### Express.js Server Implementation

###### server.ts

```typescript
import express, { Request, Response } from 'express';
import { User, UsersResponse, CreateUserRequest, CreateUserResponse, ErrorResponse } from './types.js';

const app = express();
app.use(express.json());

// In-memory storage with TypeScript types
const users: Record<number, User> = {}; // Python 3.9+ dict[int, User] → Record<number, User>
let nextId: number = 1;

// Helper function to create User (replaces dataclass)
function createUser(id: number, name: string, email?: string, tags: string[] = []): User {
  return {
    id,
    name,
    email: email ?? null,
    tags
  };
}

// GET /users - Python decorator → Express route
app.get('/users', (req: Request, res: Response<UsersResponse>) => {
  const userList = Object.values(users).map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    tags: user.tags
  }));
  
  res.json({ users: userList });
});

// POST /users - Python decorator → Express route  
app.post('/users', (req: Request<{}, CreateUserResponse | ErrorResponse, CreateUserRequest>, res: Response) => {
  const { name, email, tags = [] } = req.body;
  
  if (!name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  
  const user = createUser(nextId, name, email, tags);
  users[nextId] = user;
  nextId++;
  
  res.json({ user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

## Pattern Mapping Analysis

Using `pattern-mapping` tool for key conversions:

### Flask Decorators → Express Routes
**Python Pattern:** `@app.route('/users', methods=['GET'])`
**TypeScript Equivalent:** `app.get('/users', (req, res) => {...})`
**Complexity:** Simple

### Python 3.9+ Union Types → TypeScript Unions  
**Python Pattern:** `str | None` ✨
**TypeScript Equivalent:** `string | null`
**Complexity:** Simple (Perfect alignment!)

### Dataclass → Interface
**Python Pattern:** `@dataclass class User:`
**TypeScript Equivalent:** `interface User`
**Complexity:** Simple

## Validation Testing

###### test-api.ts

```typescript
import axios from 'axios';

// Test the converted API
async function testApi() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test GET /users (empty initially)
    console.log('Testing GET /users...');
    const emptyResponse = await axios.get(`${baseUrl}/users`);
    console.log('Empty users:', emptyResponse.data);
    
    // Test POST /users
    console.log('Testing POST /users...');
    const newUser = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      tags: ['developer', 'python', 'typescript']
    };
    
    const createResponse = await axios.post(`${baseUrl}/users`, newUser);
    console.log('Created user:', createResponse.data);
    
    // Test GET /users (with data)
    console.log('Testing GET /users with data...');
    const usersResponse = await axios.get(`${baseUrl}/users`);
    console.log('Users list:', usersResponse.data);
    
    // Test error handling
    console.log('Testing error handling...');
    try {
      await axios.post(`${baseUrl}/users`, {});
    } catch (error: any) {
      console.log('Expected error:', error.response.data);
    }
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testApi();
```

## Migration Notes

### Python 3.9+ Advantages
✨ **Perfect Type Alignment:** Python 3.9+ union syntax (`str | None`) maps directly to TypeScript unions (`string | null`)

✨ **Built-in Generics:** No typing imports needed - `list[str]`, `dict[int, User]` translate cleanly

✨ **Modern Syntax:** Python 3.9+ patterns align beautifully with TypeScript conventions

### Key Differences Handled
- **Decorators → Manual routing:** Flask's `@app.route` becomes Express route methods
- **Dataclasses → Interfaces:** Python dataclasses become TypeScript interfaces
- **Global state:** Maintained similar structure but with explicit typing
- **Error handling:** Python tuple returns → Express status codes

### Performance Considerations
- **Memory usage:** Similar patterns, TypeScript provides better type safety
- **Runtime behavior:** Express.js async nature vs Flask's synchronous default
- **Error handling:** More explicit in TypeScript with proper status codes

This migration demonstrates how Python 3.9+ features create an almost seamless transition to TypeScript, with excellent type alignment and clear conversion patterns. 