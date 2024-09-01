// function getExprLiteralFunc(key: string): Function | undefined {
//     switch (key) {
//         case 'quote':
//             return quote;
//         case 'bind':
//             return bind;
//         case 'update':
//             return updateVar;
//         case '=':
//         case 'define':
//         case 'set!':
//             return defineVar;
//         case 'lambda':
//             return lambdaObj;
//         case 'LambdaObj':
//             return evalLambdaObj;
//         case 'if':
//             return ifFunc;
//         case 'while':
//             return whileFunc;
//         case '_displayFuncDepth':
//             return _displayFuncDepth;
//         case 'callMethod':
//             return call_method;
//         case 'for':
//             return forFunc;
//         default:
//             return undefined;
//     }
// }

// function getObjOptsFunc(key: string): Function | undefined {
//     switch (key) {
//         case 'exit':
//             return (...args: any) => {};
//         case '+':
//             return addObjs;
//         case '-':
//             return subObjs;
//         case '*':
//             return mulObjs;
//         case '**':
//             return powerObjs;
//         case '/':
//             return divObjs;
//         case '>':
//             return gtObjs;
//         case '<':
//             return ltObjs;
//         case '>=':
//             return geObjs;
//         case '<=':
//             return leObjs;
//         case '==':
//             return eqObjs;
//         case 'abs':
//             return absObj;
//         case 'display':
//             return display;
//         case 'begin':
//             return begin;
//         case 'eval':
//             return evalExprObj;
//         case 'cdr':
//             return cdr;
//         case 'car':
//             return car;
//         case 'cons':
//             return cons;
//         case 'list':
//             return listObj;
//         case 'get':
//             return getFromContainer;
//         case 'set':
//             return setContainer;
//         case 'push':
//             return pushIntoContainer;
//         case 'dict':
//             return dictObj;
//         case 'str':
//             return makeStr;
//         case 'random':
//             return randomFunc;
//         case 'randInt':
//             return randInt;
//         case 'randChoice':
//             return randChoice;
//         case 'return':
//             return returnFunc;
//         case 'class':
//             return defineClass;
//         case 'instance':
//             return defineClassInstance;
//         case 'getItem':
//             return getItem;
//         case 'setItem':
//             return setItem;
//         case 'setMethod':
//             return setMethod;
//         case 'subclass':
//             return defineSubClass;
//         case 'and':
//             return andFunc;
//         case 'or':
//             return orFunc;
//         case 'array':
//             return arrayFunc;
//         case 'setArr':
//             return setArrFunc;
//         case 'getArr':
//             return getArrFunc;
//         default:
//             return undefined;
//     }
// }