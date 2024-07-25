from enum import Enum, auto
from pylisp_ast import *
from typing import Callable


class ObjType(Enum):
    INT = auto()
    FLOAT = auto()
    PROCEDURE = auto()
    BOOL = auto()
    NONE = auto()
    ERROR = auto()
    Expr = auto()


class Obj:
    def __init__(self, value, type: ObjType) -> None:
        "We follow the code as data philosophy, so even though Procedure is a child type of Obj, we store procedure in value"
        self.value = value
        self.type = type

    def __str__(self):
        return f"Obj is {str(self.value)}, type is {self.type}"


class IntNumber(Obj):
    def __init__(self, value: int, type=ObjType.INT) -> None:
        super().__init__(value, type)


class FloatNumber(Obj):
    def __init__(self, value: float, type=ObjType.FLOAT) -> None:
        super().__init__(value, type)


Number = Union[IntNumber, FloatNumber]


class Procedure(Obj):
    def __init__(
        self,
        value: Callable,
        name: Atom = Atom("lambda"),
        type=ObjType.PROCEDURE,
    ) -> None:
        super().__init__(value, type)
        self.name = name


class Bool(Obj):
    def __init__(self, value: bool, type=ObjType.BOOL) -> None:
        super().__init__(value, type)


class Error(Obj):
    def __init__(
        self,
        value="",
        type=ObjType.ERROR,
    ) -> None:
        super().__init__(value, type)


TRUE = Bool(True, ObjType.BOOL)
FALSE = Bool(False, ObjType.BOOL)

None_Obj = Obj(None, ObjType.NONE)


class Expr_Obj(Obj):
    def __init__(self, value: Expr, type=ObjType.Expr) -> None:
        super().__init__(value, type)
