import { evalExpression } from ".";
import { Env } from "./env";
import { evalExpr, evalExprs, evalStrExprs } from "./eval";
import { None_Obj, Obj } from "./obj";
import { parseExprs } from "./parser";
import { tokenize } from "./token";

type MonitorType = [string, string[], string][];

let text = "";

let monitor: [string, string[], string][] = [];

function userInit(env: Env, expr: string, monitor: MonitorType) {
  env.cleanup();
  evalStrExprs(env, expr);
}

function handleMonitorError(env: Env, varName: string, value: Obj) {
  if (value === None_Obj || value.name === "ErrorObj") {
    env.setErrorMessage(
      "Expression bound to " + varName + " is either invalid or null.\n"
    );
  }
  env.set(varName, value);
}

function userChangeMonitorAndRerun(
  env: Env,
  varName: string,
  listenToVars: string[],
  expr: string,
  monitor: MonitorType
) {
  env.cleanup();
  let isNewItem = true;
  const value = evalStrExprs(env, expr);
  handleMonitorError(env, varName, value);

  env.set(varName, value);

  for (let i = 0; i < monitor.length; i++) {
    if (monitor[i][0] === varName) {
      isNewItem = false;
      monitor[i][1] = listenToVars;
      monitor[i][2] = expr;
    }

    if (monitor[i][1].includes(varName)) {
      const value: Obj = evalStrExprs(env, monitor[i][2]);
      handleMonitorError(env, varName, value);
      env.set(varName, value);
    }
  }
  if (isNewItem) {
    monitor.push([varName, listenToVars, expr]);
  }
}

function userChangeMonitor(
  varName: string,
  listenToVars: string[],
  expr: string,
  monitor: MonitorType
) {
  let isNewItem = true;
  for (let i = 0; i < monitor.length; i++) {
    if (monitor[i][0] === varName) {
      isNewItem = false;
      monitor[i][1] = listenToVars;
      monitor[i][2] = expr;
    }
  }
  if (isNewItem) {
    monitor.push([varName, listenToVars, expr]);
  }
}

function rerunMonitor(env: Env, monitor: MonitorType) {
  env.cleanup();
  for (let i = 0; i < monitor.length; i++) {
    const value = evalStrExprs(env, monitor[i][2]);
    handleMonitorError(env, monitor[i][0], value);
    env.set(monitor[i][0], value);
  }
}

function displayedText(env: Env): string {
  if (env.errorMessages.length === 0) {
    return evalExpression(env, text) + "\n";
  } else {
    let result = evalExpression(env, text) + "\n\nError Reports:\n";
    for (let i = 0; i < env.errorMessages.length; i++) {
      result += env.errorMessages[i];
    }
    return result + "\n-------\n";
  }
}

function pgIndex() {
  const env = new Env();

  text = "A: Today a Tesla stock price is {a}. {func1}\n{func2}";

  // userInit(env, "(define taxRate 10)", monitor);

  userChangeMonitor("a", [], "20000", monitor);
  userChangeMonitor(
    "func1",
    ["a"],
    '(define taxedPrice (* a taxRate))(if (< taxedPrice 40000) (+ "taxedPriced " taxedPrice " So cheap, we should buy it.") (+ "taxedPriced " taxedPrice " So expensive, you should not buy it"))',
    monitor
  );
  userChangeMonitor(
    "func2",
    ["func1", "a"],
    '(+ "B: Your judgement \'" func1 "\' is terrible. Reconsider the price " a " again.")',
    monitor
  );

  rerunMonitor(env, monitor);
  console.log(displayedText(env));

  userInit(env, "(define taxRate 2)", monitor);
  rerunMonitor(env, monitor);

  console.log(displayedText(env));

  userChangeMonitorAndRerun(env, "a", [], "10000", monitor);

  console.log(displayedText(env));

  userInit(env, "(define taxRate 2)", monitor);

  text =
    "A: now taxRate is {taxRate} and Nvidia stock price is {a}. {func1}\n{func2}";

  rerunMonitor(env, monitor);

  console.log(displayedText(env));
}

pgIndex();
