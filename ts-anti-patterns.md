# TypeScript Anti-Patterns Detection and Correction Guide

## Purpose
This guide serves as a comprehensive reference for detecting and correcting TypeScript anti-patterns and code smells. Each anti-pattern includes detection criteria and specific correction instructions.

---

## 1. The "any" Anti-Pattern

### Detection
Look for any usage of the `any` type in:
- Variable declarations
- Function parameters
- Return types
- Type assertions

### Correction Instructions
```typescript
// ❌ AVOID
function processData(data: any) {
  return data.map(item => item.value);
}

// ✅ CORRECT TO
interface DataItem {
  value: number;
}
function processData(data: DataItem[]) {
  return data.map(item => item.value);
}

// Alternative corrections:
// 1. Use 'unknown' for truly unknown types
function processUnknown(data: unknown) {
  // Type guard required before use
  if (Array.isArray(data)) {
    return data;
  }
}

// 2. Use generics for reusable functions
function processGeneric<T extends { value: number }>(data: T[]) {
  return data.map(item => item.value);
}
```

---

## 2. Excessive Type Assertions

### Detection
Look for `as` keyword usage, especially:
- Multiple assertions in a single file
- Assertions without type guards
- Double assertions (`as unknown as Type`)

### Correction Instructions
```typescript
// ❌ AVOID
const value = someData as string;
const forced = someData as unknown as MyType;

// ✅ CORRECT TO
// Use type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

if (isString(someData)) {
  // someData is safely typed as string here
  console.log(someData.toUpperCase());
}

// For objects, use proper type predicates
interface User {
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    value !== null &&
    typeof value === 'object' &&
    'name' in value &&
    'email' in value &&
    typeof (value as User).name === 'string' &&
    typeof (value as User).email === 'string'
  );
}
```

---

## 3. Enum Misuse

### Detection
Look for:
- `enum` declarations
- Numeric enums with auto-incrementing values
- String enums that could be const assertions

### Correction Instructions
```typescript
// ❌ AVOID
enum Colors {
  Red = 'RED',
  Blue = 'BLUE',
  Green = 'GREEN'
}

enum Status {
  Pending,  // 0
  Active,   // 1
  Inactive  // 2
}

// ✅ CORRECT TO
// Use const assertions
const Colors = {
  Red: 'RED',
  Blue: 'BLUE',
  Green: 'GREEN'
} as const;

type Color = typeof Colors[keyof typeof Colors];

// For numeric values, be explicit
const Status = {
  Pending: 0,
  Active: 1,
  Inactive: 2
} as const;

type StatusType = typeof Status[keyof typeof Status];
```

---

## 4. Missing Strict Mode

### Detection
Check `tsconfig.json` for:
- Missing `"strict": true`
- Individual strict flags set to false
- No compiler options at all

### Correction Instructions
```json
// ❌ AVOID
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs"
  }
}

// ✅ CORRECT TO
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

---

## 5. Declaring Errors as Type Any

### Detection
Look for:
- `catch (err: any)`
- Error handling without type checking
- Direct property access on caught errors

### Correction Instructions
```typescript
// ❌ AVOID
try {
  await doSomething();
} catch (err: any) {
  console.log(err.message);
  toast(`Error: ${err.response.data.message}`);
}

// ✅ CORRECT TO
try {
  await doSomething();
} catch (err) {
  // Error is 'unknown' by default
  if (err instanceof Error) {
    console.log(err.message);
    toast(`Error: ${err.message}`);
  } else if (typeof err === 'string') {
    toast(`Error: ${err}`);
  } else {
    toast('An unexpected error occurred');
    console.error('Unknown error:', err);
  }
}

// For API errors, create specific type guards
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

function isApiError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error
  );
}
```

---

## 6. Functions with Multiple Same-Type Parameters

### Detection
Look for functions with:
- 2+ consecutive parameters of the same type
- Multiple string/number parameters
- Positional parameters that could be confused

### Correction Instructions
```typescript
// ❌ AVOID
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  address: string
) {
  // Implementation
}

// ✅ CORRECT TO
interface CreateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

function createUser(params: CreateUserParams) {
  const { firstName, lastName, email, phone, address } = params;
  // Implementation
}

// Usage becomes self-documenting:
createUser({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "555-0123",
  address: "123 Main St"
});
```

---

## 7. Missing Explicit Return Types

### Detection
Look for:
- Functions without return type annotations
- Arrow functions relying on inference
- Complex functions with multiple return paths

### Correction Instructions
```typescript
// ❌ AVOID
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const getName = (user) => user.name;

async function fetchData(id) {
  const response = await api.get(`/data/${id}`);
  return response.data;
}

// ✅ CORRECT TO
interface Item {
  price: number;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

interface User {
  name: string;
}

const getName = (user: User): string => user.name;

interface ApiData {
  // Define structure
}

async function fetchData(id: string): Promise<ApiData> {
  const response = await api.get(`/data/${id}`);
  return response.data;
}
```

---

## 8. Excessive Optional Properties

### Detection
Look for:
- Interfaces with many optional properties
- Excessive use of `?:` in type definitions
- Complex optional chaining in implementation

### Correction Instructions
```typescript
// ❌ AVOID
interface User {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
}

// ✅ CORRECT TO
// Use discriminated unions
type User = 
  | { type: 'guest'; id: number }
  | { type: 'member'; id: number; name: string; email: string }
  | { type: 'employee'; id: number; name: string; email: string; role: string; department: string };

// Or use required base with extensions
interface BaseUser {
  id: number;
  name: string;
}

interface MemberUser extends BaseUser {
  email: string;
}

interface EmployeeUser extends MemberUser {
  role: string;
  department: string;
}
```

---

## 9. Non-Null Assertion Overuse

### Detection
Look for:
- Excessive use of `!` operator
- Multiple non-null assertions in a single function
- Assertions without prior null checks

### Correction Instructions
```typescript
// ❌ AVOID
function processUser(user?: User) {
  console.log(user!.name);
  console.log(user!.email!.toLowerCase());
  return user!.id!;
}

// ✅ CORRECT TO
function processUser(user?: User): number | undefined {
  if (!user) {
    return undefined;
  }
  
  console.log(user.name);
  
  if (user.email) {
    console.log(user.email.toLowerCase());
  }
  
  return user.id;
}

// Or use early returns
function processUserStrict(user?: User): number {
  if (!user) {
    throw new Error('User is required');
  }
  
  if (!user.email) {
    throw new Error('User email is required');
  }
  
  console.log(user.name);
  console.log(user.email.toLowerCase());
  return user.id;
}
```

---

## 10. Index Signature Overuse

### Detection
Look for:
- `[key: string]: any` patterns
- Overly permissive index signatures
- Objects that should have known keys

### Correction Instructions
```typescript
// ❌ AVOID
interface Config {
  [key: string]: any;
}

interface UserData {
  name: string;
  [key: string]: string | number;
}

// ✅ CORRECT TO
// Define known properties explicitly
interface Config {
  apiUrl: string;
  timeout: number;
  retryCount: number;
  features: {
    enableLogging: boolean;
    enableCache: boolean;
  };
}

// Use Record for truly dynamic keys with known value types
type StringDictionary = Record<string, string>;

// Use Map for dynamic key-value pairs
const userMetadata = new Map<string, string | number>();

// Or use a more specific approach
interface UserData {
  name: string;
  email: string;
  metadata?: Record<string, string | number>;
}
```

---

## 11. Improper Generic Constraints

### Detection
Look for:
- Generics without constraints
- Overly broad generic types
- Missing generic parameters where needed

### Correction Instructions
```typescript
// ❌ AVOID
function getValue<T>(obj: T, key: string) {
  return obj[key]; // Error: can't index T with string
}

class Container<T> {
  value: T;
  constructor(value: T) {
    this.value = value;
  }
}

// ✅ CORRECT TO
// Add proper constraints
function getValue<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T
): T[keyof T] {
  return obj[key];
}

// Better: be more specific
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Add meaningful constraints to classes
interface Identifiable {
  id: string | number;
}

class Container<T extends Identifiable> {
  value: T;
  
  constructor(value: T) {
    this.value = value;
  }
  
  getId(): string | number {
    return this.value.id;
  }
}
```

---

## 12. Namespace Misuse

### Detection
Look for:
- `namespace` declarations
- Nested namespaces
- Module augmentation without proper need

### Correction Instructions
```typescript
// ❌ AVOID
namespace Utils {
  export namespace String {
    export function capitalize(str: string): string {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }
  
  export namespace Array {
    export function unique<T>(arr: T[]): T[] {
      return [...new Set(arr)];
    }
  }
}

// ✅ CORRECT TO
// Use ES modules
// stringUtils.ts
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// arrayUtils.ts
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

// index.ts - barrel export if needed
export * as StringUtils from './stringUtils';
export * as ArrayUtils from './arrayUtils';
```

---

## 13. Type vs Interface Confusion

### Detection
Look for:
- Inconsistent use of `type` and `interface`
- Types used for object shapes that should be interfaces
- Interfaces used for unions/intersections

### Correction Instructions
```typescript
// ❌ AVOID
type User = {
  id: number;
  name: string;
};

interface Status = 'active' | 'inactive'; // Error: can't use interface for unions

type ExtendedUser = User & {
  email: string;
};

// ✅ CORRECT TO
// Use interface for object types that might be extended
interface User {
  id: number;
  name: string;
}

// Use type for unions, intersections, and aliases
type Status = 'active' | 'inactive';

// Extend interfaces properly
interface ExtendedUser extends User {
  email: string;
}

// Use type for complex type operations
type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;
type UserKeys = keyof User;
```

---

## 14. Import/Export Anti-Patterns

### Detection
Look for:
- Default exports for utilities
- Wildcard imports (`import * as`)
- Missing type imports
- Circular dependencies

### Correction Instructions
```typescript
// ❌ AVOID
// utils.ts
export default {
  capitalize,
  lowercase,
  trim
};

// Bad import
import * as everything from './module';
import { SomeType } from './types'; // Runtime import for type

// ✅ CORRECT TO
// utils.ts - use named exports
export { capitalize, lowercase, trim };

// Good imports
import { specific, functions } from './module';
import type { SomeType } from './types'; // Type-only import
import { type AnotherType, someFunction } from './mixed'; // Mixed import

// Prevent circular dependencies by using:
// - Dependency injection
// - Interface segregation
// - Proper module boundaries
```

---

## 15. Mutation of Function Parameters

### Detection
Look for:
- Direct mutation of object parameters
- Array mutations (push, pop, splice)
- Assignment to parameter properties

### Correction Instructions
```typescript
// ❌ AVOID
function updateUser(user: User): void {
  user.name = user.name.toUpperCase();
  user.lastModified = new Date();
}

function addItem(items: string[], newItem: string): void {
  items.push(newItem); // Mutates original array
}

// ✅ CORRECT TO
// Return new objects/arrays
function updateUser(user: User): User {
  return {
    ...user,
    name: user.name.toUpperCase(),
    lastModified: new Date()
  };
}

function addItem(items: readonly string[], newItem: string): string[] {
  return [...items, newItem]; // Creates new array
}

// Use readonly to prevent mutations at compile time
interface User {
  readonly id: number;
  name: string;
  email: string;
}

// Use ReadonlyArray or readonly modifier
function processItems(items: readonly string[]): void {
  // items.push('new'); // Error: push doesn't exist on readonly array
  const newItems = [...items, 'new']; // OK
}
```

---

## Detection Script Example

```typescript
// lint-config.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-namespace": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/strict-boolean-expressions": "error"
  }
}
```

---

## Summary Checklist for Code Review

When reviewing TypeScript code, check for:

1. ✅ No `any` types - use `unknown`, generics, or specific types
2. ✅ Minimal type assertions - prefer type guards
3. ✅ No enums - use const assertions
4. ✅ Strict mode enabled in tsconfig
5. ✅ Proper error handling without `any`
6. ✅ Object parameters for multiple same-type arguments
7. ✅ Explicit return types on all functions
8. ✅ Discriminated unions instead of excessive optionals
9. ✅ No non-null assertions - use proper null checks
10. ✅ No overly permissive index signatures
11. ✅ Proper generic constraints
12. ✅ ES modules instead of namespaces
13. ✅ Consistent use of interface vs type
14. ✅ Type-only imports for types
15. ✅ Immutable operations on parameters

## First Principles

Remember: TypeScript exists to provide compile-time type safety. Every anti-pattern represents a deviation from this core principle. When correcting code:

1. **Embrace the type system** - Don't fight it with assertions and `any`
2. **Be explicit** - Clear types are better than clever inference
3. **Think immutably** - Prevent mutations at the type level
4. **Use the compiler** - Let it catch errors before runtime
5. **Design for maintenance** - Future developers (including yourself) will thank you