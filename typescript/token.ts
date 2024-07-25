import { cons } from "./builtins";

export function tokenize(expr: string): string[] {
    // Use a regular expression with global replacement to handle all instances of `(
    expr = expr.replace(/`\(/g, '(quote ');

    // Regular expression to handle different patterns preceded by a backtick
    expr = expr.replace(/`([\w+\-*/!@#$%^&=<>?]+|[^\s\(\)]+)/g, '(quote $1)');

    expr = expr.replace(/\(/g, '( ').replace(/\)/g, ' )');
    expr = expr.replace(/\{/g, '{ ').replace(/\}/g, ' }');

    expr = expr.replace(/\s+/g, ' ').trim();

    let tokens: string[] = expr.split(' ');

    return tokens
}