import { Env } from "./env";
import { ErrorObj } from "./obj";

export function handleError(
  env: Env,
  operation: string,
  error: unknown
): ErrorObj {
  env.setErrorMessage(operation);
  return new ErrorObj(operation);
}
