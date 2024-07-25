import { cons } from "./builtins";

export function tokenize(expr: string): string[] {
    // Use a regular expression with global replacement to handle all instances of `(
    expr = expr.replace(/`\(/g, '(quote ');

    // Regular expression to handle different patterns preceded by a backtick
    expr = expr.replace(/`([\w+\-*/!@#$%^&=<>?]+|[^\s\(\)]+)/g, '(quote $1)');
    // // Replace parenthesis for easier tokenization
    expr = expr.replace(/\(/g, '( ').replace(/\)/g, ' )');
    expr = expr.replace(/\{/g, '{ ').replace(/\}/g, ' }');

    // // Replace multiple spaces with a single space and trim leading/trailing spaces
    expr = expr.replace(/\s+/g, ' ').trim();

    // // {} is tokenized and parsed in a completely different way from norma-lisp expressions

    let tokens: string[] = expr.split(' ');

    return tokens
}

let temp = [
    "(cons `a `3)",
    "(define shit (quote + 1 1))",
    "{你好 [a] 哈哈 hello world !}"
]
let tokens: string[][]  = []
temp.forEach(ele => {
  tokens.push(tokenize(ele))
})

console.log(tokens)