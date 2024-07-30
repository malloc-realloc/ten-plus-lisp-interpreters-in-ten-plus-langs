import { Obj } from "./obj";

export class Env extends Map<string, Obj> {
  set(key: string, value: Obj): this {
    if (!(value instanceof Obj)) {
      throw new TypeError("Values in Env must be of type Obj");
    }
    return super.set(key, value);
  }
}
  