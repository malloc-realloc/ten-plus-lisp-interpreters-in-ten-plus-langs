import { handleError } from "./commons";
import { Bool, None_Obj, Obj, ThrowError } from "./obj";
import { Expr } from "./ast";
import { evalExprs } from "./eval";

export const L_Heap = new Map<string, Obj>();

export class Env extends Map<string, Obj> {
  functionDepth: number = 0;
  hasFailed: boolean = false;
  errorMessage: string = "";
  thisStack: string[] = [];
  thisValueStack: Obj[] = [None_Obj]; // there is always a None_Obj as value of "this"
  classes: Map<string, Map<string, Obj>> = new Map<string, Map<string, Obj>>();
  fatherEnv: Env | undefined = undefined;
  macros: [RegExp, string][] = [];
  errorMessages: string[] = [];
  constVarNames: string[] = [];
  literalRegExps: [RegExp, Expr[]][] = [];
  tsLispThis: Env | Obj = this;
  thrownError: ThrowError | undefined = undefined;
  listen: Map<string, { cond: Expr; execWhat: Expr }> = new Map<
    string,
    { cond: Expr; execWhat: Expr }
  >();
  whenListening = false;
  aliases: Map<string, string> = new Map<string, string>();
  ret = false;
  continued = false;
  varsMap = new Map<string, Map<string, Obj>>();

  cleanup() {
    this.functionDepth = 0;
    this.hasFailed = false;
    this.errorMessage = "";
    this.thisStack = [];
    this.thisValueStack = [None_Obj];
    this.errorMessages = [];
  }

  newThis(s: string, obj: Obj) {
    this.thisStack.push(s);
    this.set("this", obj);
    this.thisValueStack.push(obj);
  }

  popThis() {
    this.thisStack.pop();
    this.thisValueStack.pop();
    this.set("this", this.thisValueStack[this.thisValueStack.length - 1]);
  }

  getThis() {
    return this.thisStack[this.thisStack.length - 1];
  }

  set(key: string, value: Obj): this {
    if (!(value instanceof Obj)) {
      throw new TypeError("Values in Env must be of type Obj");
    }
    return super.set(key, value);
  }

  constructor(functionDepth: number = 0) {
    super();
    this.functionDepth = functionDepth;
  }

  setErrorMessage(message: string) {
    this.hasFailed = true;
    this.errorMessage = `Invalid invocation: ${message}.\n`;
    this.errorMessages.push(this.errorMessage);
  }

  getFromEnv(literal: string): Obj | undefined {
    try {
      const value = this.get(literal);
      if (value !== undefined) {
        return value;
      }

      if (this.aliases.has(literal)) {
        const v = this.get(this.aliases.get(literal) as string);
        return v;
      }

      let env: Env | undefined = this;
      while (true) {
        if (env.fatherEnv !== undefined) {
          env = env.fatherEnv;
          const value = env.get(literal);
          if (value !== undefined) {
            return value;
          }
        } else {
          return undefined;
        }
      }
    } catch (error) {
      return handleError(this, `${literal} not found in env.`);
    }
  }

  whereIsVar(literal: string): Env | undefined {
    try {
      const value = this.get(literal);
      if (value !== undefined) {
        return this;
      }

      let env: Env | undefined = this;
      while (true) {
        if (env.fatherEnv !== undefined) {
          env = env.fatherEnv;
          const value = env.get(literal);
          if (value !== undefined) {
            return env;
          }
        } else {
          return undefined;
        }
      }
    } catch (error) {
      return undefined;
    }
  }
}

export function loopOverLiteralExprs(env: Env, s: string) {
  for (const item of env.literalRegExps) {
    if (item[0].test(s)) {
      evalExprs(env, item[1]);
    }
  }
  if (env.fatherEnv) loopOverLiteralExprs(env.fatherEnv, s);
}
