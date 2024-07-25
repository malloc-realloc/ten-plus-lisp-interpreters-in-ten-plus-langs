// eval.ts
import { Expr, ExprType, Atom } from './ast';
import { Obj, IntNumber, FloatNumber, Procedure, Bool, TRUE, FALSE, None_Obj, Error, ObjType, Lambda_Procedure, LLM_EXPRObj } from './obj';
import { Env } from './env';
import { builtin_procedures, builtin_vars } from './builtins';


export function evalExpr(env: Env, expr: Expr): Obj {
    if (expr.type === ExprType.ATOM) {
        return evalAtom(env, expr);
    } else if (expr.type === ExprType.LLM_EXPR)  {
        return evalLLMExpr(env, expr);
    }
    else {
        return evalListExpr(env, expr);
    }
}

function evalLLMExpr(env: Env, expr: Expr): Obj {
  let new_literal: string = ""
  for (let i = 0; i < expr.literal.length; i++) {
    if (expr.literal[i] !== "[") {
      new_literal += expr.literal[i]
    } else  {
      let varName = ""
      i++ // skip [
      for (let j = i; j  < expr.literal.length && expr.literal[j] !== "]"; j++) {
          varName += expr.literal[j]
          i++
      }

      console.log(varName)

      let v: Obj | undefined = env.get(varName)
      if (v === undefined) {
        continue
      } else {
        new_literal += String(v.value)
      }
    }
  }

  return new LLM_EXPRObj(new Expr(ExprType.LLM_EXPR, new_literal))
}

// most of running time is spent here.
function evalListExpr(env: Env, expr: Expr): Obj {
    const exprList = expr.literal as Expr[];

    const firstExpr = exprList[0];

    try {
        let opt: any // opt is of type Procedure  | Lambda_Procedure
        if (firstExpr.type === ExprType.ATOM) {
            opt = evalAtom(env, firstExpr) as Procedure;
        } else {
            opt = evalListExpr(env, firstExpr) as Procedure;
        }

        if (!(opt.type === ObjType.PROCEDURE || opt.type === ObjType.LAMBDA_PROCEDURE) ) {
            throw new Error(`Invalid procedure: ${firstExpr.literal} is not an operator.`);
        }

        if (opt.name === "quote") {
            if (exprList.length === 2 && exprList[1].type === ExprType.ATOM) {
                return opt.value(env, new Expr(ExprType.ATOM, exprList[1].literal));
            } else {
                return opt.value(env, new Expr(ExprType.LST_EXPR, exprList.slice(1)));
            }
        }

        if (opt.name === "define" || opt.name === "set!") {
            const parameters = [atomAsEnvKey(exprList[1]), evalExpr(env, exprList[2])];
            return opt.value(env, ...parameters);
        } else if (opt.name === "lambda") {
            return evalLambdaExpr(env, exprList.slice(1));
        } else if (opt.name === "lambda_eval")  {
            const parameters = exprList.slice(1).map(expr => evalExpr(env, expr));
            return opt.value(env, opt.argNames, opt.body, ...parameters)
        } else {
            const parameters = exprList.slice(1).map(expr => evalExpr(env, expr));
            return opt.value(env, ...parameters);
        }
    } catch (e:any) {
        console.error(`An error occurred: ${e.message}`);
        throw e;
    }
}

function evalLambdaExpr(env: Env, exprList: Expr[]): Procedure {
    let argNames = exprList[0].literal as Expr[];
    let body = exprList.slice(1);

    function procedureValue(bodyEnv: Env, argNames: Expr[], body: Expr[], ...args: any[]): Obj  {
        if (args.length !== argNames.length) {
            console.error("Error: Invalid number of arguments");
        }
        let workingEnv = bodyEnv;  // structuredClone(bodyEnv) is WRONG!
        argNames.forEach((argName, index) => {
            if (typeof argName.literal === 'string') {
                workingEnv.set(argName.literal, args[index]);
            } else {
                console.error(`Error: Invalid argument name type: ${typeof argName.literal}`);
            }
        });

        let result: Obj = None_Obj;
        for (let expr of body) {
            result = evalExpr(workingEnv, expr);
        }
        return result;
    };

    return new Lambda_Procedure(procedureValue, "lambda_eval", ObjType.LAMBDA_PROCEDURE, argNames=argNames, body = body, );
}

function atomAsEnvKey(expr: Expr): Obj {
    return new Obj(expr.literal, ObjType.NONE);
}

function evalAtom(env: Env, expr: Expr): Obj {
    const literal = expr.literal as Atom;

    if (isInt(literal)) {
        return new IntNumber(parseInt(literal, 10));
    } else if (isFloat(literal)) {
        return new FloatNumber(parseFloat(literal));
    } else if (isBuiltin(literal)) {
        return getBuiltin(literal);
    } else {
        return getFromEnv(env, literal);
    }
}

export function getFromEnv(env: Env, literal: string): Obj {
    const value = env.get(literal);
    if (value === undefined) {
        console.error(`Error: retrieve undefined variable ${literal} from environment`);
        return None_Obj;
    }
    return value;
}

function isInt(s: Atom): boolean {
    return !isNaN(parseInt(s, 10));
}

function isFloat(s: Atom): boolean {
    return !isNaN(parseFloat(s));
}

function isBuiltin(s: Atom): boolean {
    return s in builtin_procedures || s in builtin_vars;
}

export function getBuiltin(s: string): Procedure {
    const proc = builtin_procedures[s];
    if (proc !== undefined) {
        return new Procedure(proc, s);
    } else {
        const builtinVar = getBuiltinVars(s);
        if (builtinVar instanceof Procedure) {
            return builtinVar;
        } else {
            throw new Error(`Undefined built-in procedure: ${s}`);
        }
    }
}

function getBuiltinVars(s: Atom): Obj {
    return builtin_vars[s];
}
