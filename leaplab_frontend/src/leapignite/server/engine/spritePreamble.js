export const SPRITE_PREAMBLE = `
class Sprite:
    def __init__(self, name):
        self._name = str(name)
        _leap_dispatch(self._name, "INIT", [])

    def _action(self, action, *args):
        _leap_dispatch(self._name, action, list(args))

    def move(self, steps=20):
        self._action("FORWARD", steps)

    def move_right(self, steps=20):
        self._action("RIGHT", steps)

    def move_left(self, steps=20):
        self._action("LEFT", steps)

    def move_up(self, steps=20):
        self._action("UP", steps)

    def move_down(self, steps=20):
        self._action("DOWN", steps)

    def turn_right(self, times=1):
        self._action("TURN_RIGHT", times)

    def turn_left(self, times=1):
        self._action("TURN_LEFT", times)

    def go_to(self, x, y):
        self._action("GOTO", x, y)

    def setx(self, x):
        self._action("SETX", x)

    def sety(self, y):
        self._action("SETY", y)

    def set_x(self, x):
        self._action("SETX", x)

    def set_y(self, y):
        self._action("SETY", y)

    def say(self, message, secs=2):
        self._action("SAY", str(message), secs)

    def think(self, message, secs=2):
        self._action("THINK", str(message), secs)

    def hide(self):
        self._action("HIDE")

    def show(self):
        self._action("SHOW")

    def set_size(self, pct):
        self._action("SIZE", pct)

    def change_size(self, delta):
        self._action("CHANGE_SIZE", delta)

    def point_in_direction(self, angle):
        self._action("ANGLE", angle)

    def next_costume(self):
        self._action("NEXT_COSTUME")

    def switch_costume(self, name):
        self._action("COSTUME", name)

def sprite(name):
    return Sprite(name)
`;
