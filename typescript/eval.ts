// eval.ts
import { Expr, ExprType, Atom } from "./ast";
import {
  Obj,
  IntNumber,
  FloatNumber,
  Procedure,
  LLM_EXPRObj,
  String_Obj,
  ErrorObj,
} from "./obj";
import { Env } from "./env";
import {
  builtinOpts,
  builtinVars,
  isExprLiteralOpt,
} from "./builtins";
import { handleError } from "./commons";

export function evalExpr(env: Env, expr: Expr): Obj {
  let result: Obj;
  if (expr.type === ExprType.ATOM) {
    result = evalAtom(env, expr);
  } else if (expr.type === ExprType.STRING_EXPR) {
    result = evalStringExpr(env, expr);
  } else if (expr.type === ExprType.LLM_EXPR) {
    result = evalLLMExpr(env, expr);
  } else {
    result = evalListExpr(env, expr);
  }

  if (!env.hasFailed) {
    return result;
  } else {
    const obj = new ErrorObj(env.errorMessage);
    env.cleanup()
    return obj;
  }
}

function evalStringExpr(env: Env, expr: Expr): String_Obj | ErrorObj {
  return new String_Obj(expr.literal as Atom);
}

// most of running time is spent here.
function evalListExpr(env: Env, expr: Expr): Obj {
  const exprList = expr.literal as Expr[];

  const firstExpr = exprList[0]; // get operator with ExprType.LST_EXPR (these expressions in the form of (opt arg1 arg2 ...) )

  try {
    let opt: Obj; // opt is of type Procedure, notice opt itself can be of type ExprType.LST_EXPR
    if (firstExpr.type === ExprType.ATOM) {
      opt = evalAtom(env, firstExpr);
    } else {
      opt = evalListExpr(env, firstExpr);
    }

    const func = builtinOpts[(opt as Procedure).value];
    if (isExprLiteralOpt(opt as Procedure)) {
      let result: Obj;
      if ((opt as Procedure).value === "LambdaObj") {
         result = func(env, opt, exprList);
      } else  {
        result = func(env, exprList);
      }
      if (result instanceof ErrorObj) {
        return new ErrorObj(result.value);
      } else {
        return result;
      }
    } else {
      const parameters = exprList.slice(1).map((expr) => evalExpr(env, expr));
      const result = func(env, ...parameters);
      if (result instanceof ErrorObj) {
        return new ErrorObj(result.value);
      } else {
        return result;
      }
    }
  } catch (e: any) {
    console.error(`An error occurred: ${e.message}`);
    throw e;
  }
}

function evalAtom(env: Env, expr: Expr): Obj {
  try {
    const literal = expr.literal as Atom;

  if (isInt(literal)) {
    return new IntNumber(parseInt(literal, 10));
  } else if (isFloat(literal)) {
    return new FloatNumber(parseFloat(literal));
  } else if (isBuiltin(literal)) {
    return getBuiltin(env, literal);
  } else {
    return getFromEnv(env, literal);
  }
  } catch (error) {
    return handleError(env, `Invalid use of ${expr.literal as Atom}`)
  }
}

export function getFromEnv(env: Env, literal: string): Obj {
  try  {
    const value = env.get(literal);
    if (value === undefined) {
      return new Obj(literal);
    }
    return value;
  } catch(error) {
    return handleError(env, `${literal} not found in env.`)
  }
}

function isInt(s: Atom): boolean {
  return !isNaN(parseInt(s, 10));
}

function isFloat(s: Atom): boolean {
  return !isNaN(parseFloat(s));
}

function isBuiltin(s: Atom): boolean {
  return s in builtinOpts || s in builtinVars;
}

export function getBuiltin(env: Env, s: string): Procedure {
  try{
  const proc = builtinOpts[s];
  if (proc !== undefined) {
    return new Procedure(s);
  } else {
    const builtinVar = getBuiltinVars(s);
    if (builtinVar instanceof Procedure) {
      return builtinVar;
    } else {
      throw new Error(`Undefined built-in procedure: ${s}`);
    }
  }} catch( error) {
     handleError(env, `builtin function ${s} does not exist.`)
     return new Procedure("")
  }
}

function getBuiltinVars(s: Atom): Obj {
  return builtinVars[s];
}

function evalLLMExpr(env: Env, expr: Expr): Obj {
  let new_literal: string = "";
  for (let i = 0; i < expr.literal.length; i++) {
    if (expr.literal[i] !== "[") {
      new_literal += expr.literal[i];
    } else {
      let varName = "";
      i++; // skip [
      for (let j = i; j < expr.literal.length && expr.literal[j] !== "]"; j++) {
        varName += expr.literal[j];
        i++;
      }

      let v: Obj | undefined = env.get(varName);
      if (v === undefined) {
        continue;
      } else {
        new_literal += String(v.value);
      }
    }
  }

  return new LLM_EXPRObj(new Expr(ExprType.LLM_EXPR, new_literal));
}