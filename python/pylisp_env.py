from pylisp_obj import Obj


class Env(dict):
    def __setitem__(self, key, value):
        if not isinstance(value, Obj):
            raise TypeError("Values in Env must be of type Obj")
        super().__setitem__(key, value)
