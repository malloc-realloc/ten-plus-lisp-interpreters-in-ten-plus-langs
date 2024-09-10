import { handleError } from "./commons";
import { None_Obj, Obj } from "./obj";

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
