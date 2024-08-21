import { Class_Obj, Obj } from "./obj";

export class Env extends Map<string, Obj> {
  functionDepth: number = 0;
  hasFailed: boolean = false;
  errorMessage: string = "";
  thisStack: string[] = [];
  classes: Map<string, Map<string, Obj>> = new Map<string, Map<string, Obj>>();

  newThis(s: string) {
    this.thisStack.push(s);
  }

  popThis(s: string) {
    this.thisStack.pop();
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
  }
}
