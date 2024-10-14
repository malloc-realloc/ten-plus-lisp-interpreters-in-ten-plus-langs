#include "builtins.h"

int repl(Env &env) {
  std::string input;
  std::cout << "Welcome to the Math Expression REPL!\n";
  std::cout << "Enter expressions or type 'exit' to quit.\n";

  while (true) {
    std::cout << "> ";
    std::getline(std::cin, input);

    if (input == "exit") {
      break;
    }

    try {
      std::vector<std::string> tokens = scan(input);
      size_t start = 0;
      shared_ptr<Obj> result = runExpr(env, tokens, start);
      std::cout << any_cast<double>((*result.get()).value) << std::endl;
    } catch (const std::exception &e) {
      std::cout << "Error: " << e.what() << std::endl;
    }
  }

  std::cout << "Goodbye!\n";
  return 0;
}