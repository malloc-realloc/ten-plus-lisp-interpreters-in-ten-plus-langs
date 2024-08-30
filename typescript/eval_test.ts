import { Expr, ExprType } from "./ast";
import { ObjType, Obj } from "./obj";
import { Env } from "./env";
import { evalExpr } from "./eval";

let exprs: Expr[] = [
  new Expr(ExprType.LLM_EXPR, "你好 [a] 哈哈 hello world ! "),
];

let global_env: Env = new Env();
global_env.set("a", new Obj(1));

exprs.forEach((expr) => {
  let obj: Obj = evalExpr(global_env, expr);
  console.log(obj.toString());
});
