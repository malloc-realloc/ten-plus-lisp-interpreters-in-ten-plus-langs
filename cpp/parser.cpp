#include "common.h"
#include <memory>
#include <stdexcept>
#include <vector>

std::shared_ptr<LispExpr> parseLispExpr() {
  return std::make_shared<LispExpr>(LispExprType::ATOM, "1");
}
