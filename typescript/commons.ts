import { Env } from "./env";
import { ErrorObj } from "./obj";

export function handleError(env: Env, operation: string): ErrorObj {
  env.setErrorMessage(operation);
  env.hasFailed = true;
  return new ErrorObj("");
}
