## General Decisions

### Use of Types
- **When Necessary**: Types are used judiciously to facilitate easier translation to other type-based languages and to simplify debugging processes.

### Avoid Complex Python Tricks
- **Data Abstractions**: The interpreter avoids overly "Pythonic" idioms in favor of clear data abstractions, making it easier to understand and translate each step of the interpreter pipeline.

## Design Decisions

### Parser and Data Structures
- **Lisp List Correspondence**: There is a natural one-to-one correspondence between Lisp lists and Python lists. The parser converts tokens into either an `Atom` or an array of expressions (`Expr[]`).

### Literal Storage
- **Expression Handling**: The `Expr.literal` field stores expressions for execution. It's named 'literal' because the syntax mirrors list literals in Python, changing Lisp’s parentheses `()` to square brackets `[]`.

### Abstraction and Extensibility
- **Data Abstractions**: Additional abstractions around data types are implemented, introducing numerous new types within the interpreter. This approach facilitates clear separation of different interpreter stages and simplifies future enhancements such as adding new built-in syntax or keywords.
- **Language Versatility**: The design intentionally avoids specific Python features to maintain versatility and ease of translation to other programming languages. This ensures that the interpreter’s syntax and semantics are as generic as possible, supporting broad adaptability and understandability.
