import { Obj } from "./obj";

export class Env extends Map<string, Obj> {
  functionDepth: number = 0;
  hasFailed: boolean = false;
  errorMessage: string = "";

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
