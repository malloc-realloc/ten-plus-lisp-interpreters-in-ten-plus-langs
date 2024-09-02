#include "ast.h"
#include "commons.h"

Expr makeExpr(ExprType t, void *v) {
  Expr e = (Expr)malloc(sizeof(struct _Expr_struct));
  if (e != NULL) {
    e->type = t;
    e->value = v;
  }

  return e;
}

static int pos = 0;

static char *parseToken(const char *input) {
  int start;

  // Skip whitespace characters
  while (isspace(input[pos])) {
    pos++;
  }

  if (input[pos] == '\0') {
    return NULL;
  }

  if (input[pos] == '"') {
    // Parse string literal
    start = pos;
    pos++;
    while (input[pos] != '\0' && input[pos] != '"') {
      pos++;
    }
    if (input[pos] == '"') {
      pos++; // Consume the closing quote
    }
    char *token = strndup(input + start, pos - start);
    return token;
  }

  if (input[pos] == '(' || input[pos] == ')') {
    // Return single special character
    char *token = strndup(input + pos, 1);
    pos++;
    return token;
  }

  // Parse atom
  start = pos;
  while (input[pos] != '\0' && !isspace(input[pos]) && input[pos] != '"' &&
         input[pos] != '(' && input[pos] != ')') {
    pos++;
  }
  char *token = strndup(input + start, pos - start);
  return token;
}

static Expr parse(const char *input) {
  char *token = parseToken(input);

  if (token == NULL) {
    return makeExpr(ERROR, (void *)"Unexpected end of input");
  }

  if (strcmp(token, "\"") == 0) {
    char *stringContent = parseToken(input);
    free(token);
    return makeExpr(STRING_EXPR, stringContent);
  }

  if (strcmp(token, "(") == 0) {
    ExprVec exprVec = makeExpr(LST_EXPR, NULL); // Placeholder for list

    while (1) {
      char *nextToken = parseToken(input);
      if (nextToken && strcmp(nextToken, ")") == 0) {
        // free(nextToken);
        break;
      }
      if (!nextToken) {
        free(exprVec); //! TODO freeExprVec
        return makeExpr(ERROR, (void *)"Unexpected end of input");
      }
      pos -= strlen(nextToken); // Rewind the position to re-read the token
      free(nextToken);

      Expr subExpr = parse(input);
      // Add subExpr to exprVec's value (requires list implementation)
    }
    free(token);
    return exprVec;
  }

  Expr atomExpr = makeExpr(ATOM, token);
  return atomExpr;
}

Expr parseExpr(const char *input) {
  pos = 0;
  return parse(input);
}

void printExpr(Expr e) {
  if (!e) {
    printf("NULL\n");
    return;
  }

  switch (e->type) {
  case ATOM:
    printf("ATOM: %s\n", (char *)e->value);
    break;
  case STRING_EXPR:
    printf("STRING_EXPR: %s\n", (char *)e->value);
    break;
  // case LST_EXPR: {
  //   printf("LST_EXPR: [ ");
  //   printExpr(((Expr *)e->value)[0]);
  //   printf("\n]\n");
  //   break;
  // }
  case ERROR:
    printf("ERROR: %s\n", (char *)e->value);
    break;
  default:
    printf("UNKNOWN TYPE\n");
  }
}
