# 10+ Lisp Interpreters in 10+ Languages

This repository contains implementations of Lisp interpreters in various programming languages. The goal of this project is to explore different programming paradigms and to showcase diverse compiling techniques and methodologies.

---

## Lisp Interpreters Collection

This repository is a collection of Lisp interpreters implemented in various programming languages. Each subdirectory contains a different implementation, demonstrating the unique stylistic and technical features of each language, exploring their design tradeoffs. For more detailed discussions, refer to the README in each subdirectory.

### Current Implementations

- **Python**: The Python implementation serves as the Minimal Viable Product (MVP) for this series of Lisp interpreters. Python was chosen due to its clear syntax and extensive standard library, which facilitate rapid prototyping and ease of understanding. Additionally, Python's flexibility in supporting various programming paradigms makes it an excellent conceptual and logical reference for future implementations in other languages. 
- **TypeScript**: Explores translation from Python to TypeScript using GPT. New syntax `{}` allows calling large language models like ChatGPT to evaluate natural language "expressions". Integrated into [platogaze.com](http://www.platogaze.com) for assisting in formal writing.

### Planned Implementations

- **Go**: Implementation using a C-flavored top-down parser.
- **Rust**: System programming with strong safety guarantees.
- **C**: "Nothing is better than C.""
- **C++**: "Our favorite language, right?"
- **Java**: Object-oriented version.
- **Haskell**: Demonstrates functional programming concepts.
- **SQL**: An experimental SQL-based approach. It's a thought experiment rather than a serious project.
- **OCaml**: Often used in compiler/interpreter design due to its functional paradigm.
- **Ruby**: Focus on expressive syntax and metaprogramming.
- **Prolog**: Exploring logic programming.
- **Scheme**: Emphasizes Lisp's "code as data" philosophy, simplifying interpreter design.
- **Litex**: This is the math formal proof system I am currently working on. It has lisp-inspired semantics and latex-inspired syntax. It helps mathematicians write math as naturally as they are using natural language and check their proof "just in time".

Additional languages and frameworks will be considered as the project expands. Check back for updates.

---

This format gives a brief overview of each implementation and outlines future plans, keeping the description succinct yet informative, suitable for a GitHub audience.

## Features

Here are the key functionalities that each interpreter should support:

### 1. **Lambda Functions**
   - **Definition and Use**: Ability to define and execute anonymous functions using the `lambda` syntax.
   - **Scoping**: Proper scoping rules where functions can access variables defined in their enclosing environment.

### 2. **Variable Definition and Manipulation**
   - **Defining Variables**: Use of the `define` keyword to create new bindings in the environment.
   - **Modifying Variables**: Ability to change the value of an existing variable with `set!`.

### 3. **Functional Operations**
   - **Basic Arithmetic and Logical Operations**: Support for operations like `+`, `-`, `>`, etc.
   - **Higher-Order Functions**: Capability to handle functions that return other functions, demonstrating closure properties.

### 4. **Control Structures**
   - **Conditional Statements**: Implementing conditional logic with `if` statements.
   - **Truthiness Evaluation**: Defining truthy and falsey values in the context of the language (e.g., in Lisp, non-zero and non-nil values are generally truthy).

### 5. **List Manipulations**
   - **List Operations**: Handling of basic list

`cdr` (tail of the list), `cons` (construct a new list by adding an element to the front), and other typical Lisp list manipulations.

### 6. **Quoting and Evaluation**
   - **Quoting**: The ability to quote a list or expression, preventing it from being evaluated.
   - **Direct Evaluation**: Using `eval` to evaluate quoted expressions, enabling dynamic computation.


Certainly there are much left to be done, e.g. `macros`, `while-loops` and `for-loops`, `defun` etc. I hope I will have time to get them ready soon!

## How to Use

Each subdirectory contains its own README with specific instructions on how to run and use that particular implementation.

## Contributing

Contributions are welcome! If you'd like to add an implementation in a new language or improve an existing one, please feel free to open a pull request.

## License

This project is licensed under the MIT License

## Contact

Feel free to push issues and let me know what you are looking for! I am sure my project is far from perfection so your feedback means a lot to me and my project. Contact me by malloc_realloc_calloc@outlook.com