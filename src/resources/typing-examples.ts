export const TYPING_EXAMPLES = {
  "python-typing-to-typescript": {
    title: "🏷️ Python Type System to TypeScript Mapping",
    content: `# Python Type System to TypeScript Mapping

## Overview

Comprehensive mapping of Python's typing system to TypeScript equivalents, covering Python 3.9+ union operators, generics, and advanced typing patterns from real-world codebases.

## Core Type Mappings

### Python 3.9+ Union Syntax

\`\`\`python
# Python 3.9+ Union Operators → TypeScript
from typing import Union, Optional, Literal, Final, TypeAlias
from datetime import datetime
from uuid import UUID

# Union types (Python 3.9+)
StringOrNumber = str | int
OptionalString = str | None  # Preferred over Optional[str]
MultiUnion = str | int | float | None

# Complex union patterns
ResponseData = dict[str, str | int | list[str]]
DatabaseId = int | str | UUID
StatusCode = Literal[200, 404, 500] | int
\`\`\`

\`\`\`typescript
// TypeScript equivalents - direct mapping
type StringOrNumber = string | number;
type OptionalString = string | null;
type MultiUnion = string | number | number | null;

// Complex union patterns
type ResponseData = Record<string, string | number | string[]>;
type DatabaseId = number | string; // UUID becomes string in TS
type StatusCode = 200 | 404 | 500 | number;
\`\`\`

### Generic Collections

\`\`\`python
# Python generics → TypeScript
from typing import Dict, List, Set, Tuple, Any

# Built-in generics (Python 3.9+)
user_names: list[str] = ["alice", "bob"]
user_scores: dict[str, int] = {"alice": 95, "bob": 87}
unique_ids: set[int] = {1, 2, 3}
coordinates: tuple[float, float] = (10.5, 20.3)

# Nested generics
user_groups: dict[str, list[str]] = {
    "admins": ["alice"], 
    "users": ["bob", "charlie"]
}

# Complex nested structures
api_responses: dict[str, dict[str, list[dict[str, str | int]]]] = {}
\`\`\`

\`\`\`typescript
// TypeScript equivalents
const userNames: string[] = ["alice", "bob"];
const userScores: Record<string, number> = { alice: 95, bob: 87 };
const uniqueIds: Set<number> = new Set([1, 2, 3]);
const coordinates: [number, number] = [10.5, 20.3]; // Tuple

// Nested generics
const userGroups: Record<string, string[]> = {
  admins: ["alice"],
  users: ["bob", "charlie"]
};

// Complex nested structures
const apiResponses: Record<string, Record<string, Record<string, string | number>[]>> = {};
\`\`\`

### Literal Types and Enums

\`\`\`python
# Python Literal and Enum → TypeScript
from typing import Literal
from enum import Enum, StrEnum

# Literal types
HttpMethod = Literal["GET", "POST", "PUT", "DELETE"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]
BooleanLiteral = Literal[True, False]  # Special case

# String Enums (Python 3.11+)
class UserRole(StrEnum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

# Regular Enums
class StatusCode(Enum):
    SUCCESS = 200
    NOT_FOUND = 404
    SERVER_ERROR = 500

# Combining literals with unions
Response = Literal["success"] | Literal["error"] | dict[str, str]
\`\`\`

\`\`\`typescript
// TypeScript literal types - preferred approach
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR";
type BooleanLiteral = true | false; // More explicit than boolean

// Enum alternatives in TypeScript
// Option 1: Union of literals (recommended)
type UserRole = "admin" | "user" | "guest";

// Option 2: Const assertions
const UserRole = {
  ADMIN: "admin",
  USER: "user", 
  GUEST: "guest"
} as const;
type UserRole = typeof UserRole[keyof typeof UserRole];

// Option 3: Traditional enum (use sparingly)
enum StatusCode {
  SUCCESS = 200,
  NOT_FOUND = 404,
  SERVER_ERROR = 500
}

// Combining with unions
type Response = "success" | "error" | Record<string, string>;
\`\`\`

## Advanced Typing Patterns

### TypedDict to Interfaces

\`\`\`python
# Python TypedDict → TypeScript interface
from typing import TypedDict, NotRequired, Required

class User(TypedDict):
    id: int
    name: str
    email: str
    is_active: bool
    metadata: NotRequired[dict[str, str | int]]  # Optional field

class UserWithRequiredMeta(TypedDict):
    id: int
    name: str
    metadata: Required[dict[str, str]]  # Explicitly required

# Inheritance
class AdminUser(User):
    permissions: list[str]
    access_level: Literal["admin", "superadmin"]

# Total=False for all optional fields
class PartialUser(TypedDict, total=False):
    name: str
    email: str
    phone: str
\`\`\`

\`\`\`typescript
// TypeScript interface equivalents
interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  metadata?: Record<string, string | number>; // Optional with ?
}

interface UserWithRequiredMeta {
  id: number;
  name: string;
  metadata: Record<string, string>; // Required (no ?)
}

// Inheritance with extends
interface AdminUser extends User {
  permissions: string[];
  access_level: "admin" | "superadmin";
}

// Partial utility type for all optional
interface PartialUser {
  name?: string;
  email?: string;
  phone?: string;
}

// Or use built-in Partial<T>
type PartialUserAlt = Partial<Pick<User, 'name' | 'email'>> & {
  phone?: string;
};
\`\`\`

### Protocols and Structural Typing

\`\`\`python
# Python Protocols → TypeScript interfaces
from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> None: ...
    def get_area(self) -> float: ...

class Serializable(Protocol):
    def to_json(self) -> str: ...
    def from_json(self, data: str) -> None: ...

# Generic protocols
from typing import TypeVar
T = TypeVar('T')

class Repository(Protocol[T]):
    def save(self, entity: T) -> T: ...
    def find_by_id(self, id: int) -> T | None: ...
    def find_all(self) -> list[T]: ...

# Using protocols
def render_shape(shape: Drawable) -> None:
    shape.draw()
    print(f"Area: {shape.get_area()}")
\`\`\`

\`\`\`typescript
// TypeScript structural interfaces (protocols equivalent)
interface Drawable {
  draw(): void;
  getArea(): number; // snake_case → camelCase
}

interface Serializable {
  toJson(): string;
  fromJson(data: string): void;
}

// Generic interfaces
interface Repository<T> {
  save(entity: T): T;
  findById(id: number): T | null;
  findAll(): T[];
}

// Structural typing works automatically
function renderShape(shape: Drawable): void {
  shape.draw();
  console.log(\`Area: \${shape.getArea()}\`);
}

// Any object with the right shape works
const circle = {
  draw: () => console.log("Drawing circle"),
  getArea: () => Math.PI * 5 * 5
};

renderShape(circle); // ✅ Works due to structural typing
\`\`\`

## Modern Python → TypeScript Patterns

### dataclass to interface/type

\`\`\`python
# Python dataclass → TypeScript
from dataclasses import dataclass, field
from typing import ClassVar, InitVar

@dataclass
class Product:
    id: int
    name: str
    price: float
    category: str = "general"
    tags: list[str] = field(default_factory=list)
    
    # Class variables
    tax_rate: ClassVar[float] = 0.1
    
    # Init-only variable
    currency: InitVar[str] = "USD"
    
    def __post_init__(self, currency: str) -> None:
        if currency == "EUR":
            self.price *= 1.1  # Convert from EUR

@dataclass(frozen=True)  # Immutable
class ImmutableProduct:
    id: int
    name: str
    price: float
\`\`\`

\`\`\`typescript
// TypeScript equivalent patterns
interface Product {
  id: number;
  name: string;
  price: number;
  category: string; // Default handled in factory/constructor
  tags: string[];   // Default handled in factory/constructor
}

// Factory function for defaults (replacing __init__)
function createProduct(
  id: number,
  name: string,
  price: number,
  options: {
    category?: string;
    tags?: string[];
    currency?: string;
  } = {}
): Product {
  const { category = "general", tags = [], currency = "USD" } = options;
  
  // Post-init logic
  let adjustedPrice = price;
  if (currency === "EUR") {
    adjustedPrice *= 1.1;
  }
  
  return {
    id,
    name,
    price: adjustedPrice,
    category,
    tags: [...tags] // Defensive copy
  };
}

// Class constants (ClassVar equivalent)
const PRODUCT_TAX_RATE = 0.1;

// Immutable type (frozen=True equivalent)
type ImmutableProduct = Readonly<{
  id: number;
  name: string;
  price: number;
}>;

// Or with readonly properties
interface ImmutableProductInterface {
  readonly id: number;
  readonly name: string;
  readonly price: number;
}
\`\`\`

## Conversion Decision Matrix

| Python Pattern | TypeScript Equivalent | When to Use |
|----------------|----------------------|-------------|
| \`str \| int\` | \`string \| number\` | Always prefer for Python 3.9+ |
| \`Optional[T]\` | \`T \| null\` | Legacy code, use \`T \| null\` instead |
| \`List[T]\` | \`T[]\` | Built-in arrays |
| \`Dict[K, V]\` | \`Record<K, V>\` | Simple key-value mappings |
| \`TypedDict\` | \`interface\` | Structured objects |
| \`Protocol\` | \`interface\` | Structural typing |
| \`Literal[...]\` | \`"..." \| ...\` | Exact value constraints |
| \`Enum\` | Union of literals | Type safety over runtime behavior |
| \`dataclass\` | \`interface + factory\` | Data structures with logic |
| \`NamedTuple\` | \`type [..., ...]\` | Fixed-length tuples |

## Mypy to TypeScript Best Practices

### 1. Strict Mode Equivalence

\`\`\`python
# Python mypy strict mode
# mypy: strict = True
from typing import Any, Never

def process_data(data: Any) -> Never:  # Never for impossible returns
    raise NotImplementedError("Not implemented")
\`\`\`

\`\`\`typescript
// TypeScript strict mode equivalent
// tsconfig.json: "strict": true

function processData(data: unknown): never {  // unknown over any, never for impossible
  throw new Error("Not implemented");
}
\`\`\`

### 2. Type Narrowing Patterns

\`\`\`python
# Python type narrowing
from typing import Union, TypeGuard

def is_string(value: Union[str, int]) -> TypeGuard[str]:
    return isinstance(value, str)

def process_value(value: Union[str, int]) -> str:
    if is_string(value):
        return value.upper()  # mypy knows this is str
    return str(value)
\`\`\`

\`\`\`typescript
// TypeScript type narrowing
function isString(value: string | number): value is string {
  return typeof value === "string";
}

function processValue(value: string | number): string {
  if (isString(value)) {
    return value.toUpperCase(); // TS knows this is string
  }
  return String(value);
}
\`\`\`

This mapping covers the essential patterns found in production Python codebases and their TypeScript equivalents, ensuring type safety is maintained across the conversion.`,
    tags: ["typing", "mypy", "type-safety", "type-system", "advanced"],
    language: "typescript" as const
  }
}; 