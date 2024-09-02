#ifndef AST_H
#define AST_H

#include "commons.h"

typedef enum ExprType {
  ATOM,
  LST_EXPR,
  STRING_EXPR,
  ERROR,
} ExprType;

typedef struct _Expr_struct {
  ExprType type;
  void *value; // char*, ExprVec*
} *Expr;

typedef struct _ExprVec_struct {
  Expr start;
  size_t sz;
} *ExprVec;

Expr makeExpr(ExprType t, void *v);
Expr parseExpr(const char *input);
void printExpr(Expr e);

#endif