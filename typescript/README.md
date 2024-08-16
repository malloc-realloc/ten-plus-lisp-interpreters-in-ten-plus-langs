## Translating Python to TypeScript: Considerations and Challenges

### Overview

While translating Python (Py) code to TypeScript (TS) using GPT-4-o generally achieves high accuracy, there are crucial differences and nuances that require careful review. The following sections detail the key semantic discrepancies and common translation errors encountered.

My version of ts-node is v10.9.2, we can test this project by running ts-node index.ts

### Semantic Differences Between Python and TypeScript

#### String Replacement

- **Python**: The `.replace` method replaces all occurrences of a pattern.
- **TypeScript**: By default, `.replace` modifies only the first occurrence, unless a global flag is used.

#### Deep Copy Functionality

- **Differences**: The behavior of deep copying objects differs significantly between Python and TypeScript, affecting how objects are cloned and managed.

### Design Decisions

- **Expr_Obj**: introduces a new Expr_Obj type to store the argument list, mother function environment, and expressions in the lisp_lambda_function.
