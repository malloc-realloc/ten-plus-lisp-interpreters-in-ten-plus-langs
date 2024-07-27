import { parseExpr } from "./parser";
import { tokenize } from "./token";

let tokens = tokenize('define m "hello, world"');
console.log(tokens);
let expr = parseExpr(tokens);
console.log(expr);
