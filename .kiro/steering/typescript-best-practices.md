---
inclusion: manual
---

<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 
TypeScript Best Practices — Super Simple Version

1. Describe Your Data
Use types/interfaces for object & function shapes.

Avoid any—it disables type safety.
type Result = "success" | "failure";
function verify(result: Result) { /* ... */ }

2. Prefer Literal Unions (or Scoped Enums)
Use const unions for small sets of values.

If you use enum, export it once and import everywhere.

ts
Copy
Edit
export const EventType = ["create", "delete", "update"] as const;
export type EventType = (typeof EventType)[number];
3. Interfaces = Contracts
Define props/params with interfaces.

Use readonly for values that never change.

Extend interfaces instead of duplicating fields.

Don’t create empty interfaces—they enforce nothing.

ts
Copy
Edit
interface BucketProps { name: string; region: string; encryption: boolean; }
interface Position { readonly latitude: number; readonly longitude: number; }

interface Base { name: string }
interface EncryptedVolume extends Base { keyName: string }
4. Use Factories (Abstract Factory etc.)
Centralize object creation instead of sprinkling new everywhere.

5. Destructure Props/Objects
ts
Copy
Edit
const { objname, scope } = object;
6. Naming Conventions
camelCase: variables, functions, interface members, file names.

PascalCase: classes, interfaces, types, enums.

Avoid weird casing; be consistent.

7. Never var
Use const by default, let only when you must reassign.

8. Lint & Format
ESLint for rules; Prettier for formatting.

json
Copy
Edit
"scripts": {
  "lint": "eslint --ext .js,.ts .",
  "format": "prettier --ignore-path .gitignore --write \"**/*.+(js|ts|json)\""
}
9. Access Modifiers
private → only inside class

protected → class + subclasses

public (default) → everywhere

10. Utility Types (use them!)
Partial<T>: make all fields optional

Required<T>: make all fields required

Also: Pick, Omit, Readonly, Record, etc.

ts
Copy
Edit
interface Dog { name: string; age: number; breed: string; weight?: number }
const partialDog: Partial<Dog> = {};
const dog: Required<Dog> = { name: "scruffy", age: 5, breed: "lab", weight: 55 };
Rule of thumb: Strong types, no any, no var, small & explicit interfaces, centralized constants/factories, and let ESLint/Prettier keep you honest.

Need this dropped into a canvas doc too? Or want it even more minimal (one-pager/checklist/json)? Let me know.