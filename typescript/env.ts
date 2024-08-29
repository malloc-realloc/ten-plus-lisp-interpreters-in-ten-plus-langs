import { Class_Obj, None_Obj, Obj } from "./obj";

export class Env extends Map<string, Obj> {
  functionDepth: number = 0;
  hasFailed: boolean = false;
  errorMessage: string = "";
  thisStack: string[] = [];
  thisValueStack: Obj[] = [None_Obj]; // there is always a None_Obj as value of "this"
  classes: Map<string, Map<string, Obj>> = new Map<string, Map<string, Obj>>();
  fatherEnv: Env | undefined = undefined;

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
  }
}
