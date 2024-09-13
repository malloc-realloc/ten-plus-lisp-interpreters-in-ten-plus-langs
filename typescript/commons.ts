import { Env } from "./env";
import { ErrorObj } from "./obj";
import * as fs from "fs";

export function handleError(env: Env, operation: string): ErrorObj {
  env.setErrorMessage(operation);
  env.hasFailed = true;
  return new ErrorObj("");
}
