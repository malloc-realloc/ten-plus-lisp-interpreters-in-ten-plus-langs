export function tokenize(expr: string): string[] {
    // Use a regular expression with global replacement to handle all instances of `(
    expr = expr.replace(/`\(/g, '(quote ');

    // Regular expression to handle different patterns preceded by a backtick
    expr = expr.replace(/`([\w+\-*/!@#$%^&=<>?]+|[^\s\(\)]+)/g, '(quote $1)');

    // Replace parenthesis for easier tokenization
    expr = expr.replace(/\(/g, '( ').replace(/\)/g, ' )');

    // Replace multiple spaces with a single space and trim leading/trailing spaces
    expr = expr.replace(/\s+/g, ' ').trim();

    return expr.split(' ');
}

