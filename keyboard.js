var Keyboard = Keyboard || {};

Keyboard.COMBO_KEYS = {
  NONE: 0,
  ALT: 1 << 0,
  CTRL: 1 << 1,
  SHIFT: 1 << 2,
  CMD: 1 << 3
};

Keyboard.combo = function(e) {
  var combo = Keyboard.COMBO_KEYS.NONE;
  if (e.altKey)
    combo |= Keyboard.COMBO_KEYS.ALT;
  if (e.ctrlKey)
    combo |= Keyboard.COMBO_KEYS.CTRL;
  if (e.shiftKey)
    combo |= Keyboard.COMBO_KEYS.SHIFT;
  if (e.metaKey)
    combo |= Keyboard.COMBO_KEYS.CMD;
  return combo;
};

Keyboard.KEYS = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPS_LOCK: 20,
  ESCAPE: 27,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT_ARROW: 37,
  UP_ARROW: 38,
  RIGHT_ARROW: 39,
  DOWN_ARROW: 40,
  INSERT: 45,
  DELETE: 46,
  ZERO: 48,
  ONE: 49,
  TWO: 50,
  THREE: 51,
  FOUR: 52,
  FIVE: 53,
  SIX: 54,
  SEVEN: 55,
  EIGHT: 56,
  NINE: 57,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  LEFT_WINDOW_KEY: 91,
  RIGHT_WINDOW_KEY: 92,
  SELECT_KEY: 93,
  NUMPAD_0: 96,
  NUMPAD_1: 97,
  NUMPAD_2: 98,
  NUMPAD_3: 99,
  NUMPAD_4: 100,
  NUMPAD_5: 101,
  NUMPAD_6: 102,
  NUMPAD_7: 103,
  NUMPAD_8: 104,
  NUMPAD_9: 105,
  MULTIPLY: 106,
  ADD: 107,
  SUBTRACT: 109,
  DECIMAL_POINT: 110,
  DIVIDE: 111,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  NUM_LOCK: 144,
  SCROLL_LOCK: 145,
  SEMICOLON: 186,
  EQUAL_SIGN: 187,
  COMMA: 188,
  DASH: 189,
  PERIOD: 190,
  FORWARD_SLASH: 191,
  GRAVE_ACCENT: 192,
  OPEN_BRACKET: 219,
  BACK_SLASH: 220,
  CLOSE_BRACKET: 221,
  SINGLE_QUOTE: 222
};

Keyboard.KEYS.MULTIFUNC = Keyboard.KEYS.F7;

Keyboard.MODES = {
  NONE: 1,
  MULTIFUNC: 2
};

Keyboard.MODE = Keyboard.MODES.NONE;

Keyboard[Keyboard.KEYS.ESCAPE] = {};
Keyboard[Keyboard.KEYS.ESCAPE][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().clearPreview();
};

Keyboard[Keyboard.KEYS.F3] = {};
Keyboard[Keyboard.KEYS.F3][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().clearPreview();
  scope.textOverlay().addPreviewChar('IC');
};

Keyboard[Keyboard.KEYS.F4] = {};
Keyboard[Keyboard.KEYS.F4][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().clearPreview();
  scope.textOverlay().addPreviewChar('TC');
};

Keyboard[Keyboard.KEYS.MULTIFUNC] = {};
Keyboard[Keyboard.KEYS.MULTIFUNC][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().clearPreview();
  scope.textOverlay().addPreviewChar('F');
  Keyboard.MODE = Keyboard.MODES.MULTIFUNC;
};

Keyboard[Keyboard.KEYS.F11] = {};
Keyboard[Keyboard.KEYS.F11][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().clearPreview();
  scope.textOverlay().addPreviewChar('CA');
};

Keyboard[Keyboard.KEYS.S] = {};
Keyboard[Keyboard.KEYS.S][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  $('.scope-settings').toggle();
};

Keyboard[Keyboard.KEYS.M] = {};
Keyboard[Keyboard.KEYS.M][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  $('.situation-controls').toggle();
  if ($('.situation-controls').is(':visible')) {
    $(scope.renderer().scope()).css('margin-left', '250px');
    $('.scope-settings').css('margin-left', '250px');
  } else {
    $(scope.renderer().scope()).css('margin-left', '0');
    $('.scope-settings').css('margin-left', '0');
  }
};

Keyboard[Keyboard.KEYS.R] = {};
Keyboard[Keyboard.KEYS.R][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  //scope.situation().run();
};

Keyboard[Keyboard.KEYS.T] = {};
Keyboard[Keyboard.KEYS.T][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  $('.incoming-messages').toggle();
};


Keyboard[Keyboard.KEYS.P] = {};
Keyboard[Keyboard.KEYS.P][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  //scope.situation().pause();
};

Keyboard[Keyboard.KEYS.ONE] = {};
Keyboard[Keyboard.KEYS.ONE][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(1);
};
Keyboard[Keyboard.KEYS.ONE][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(1);
};

Keyboard[Keyboard.KEYS.TWO] = {};
Keyboard[Keyboard.KEYS.TWO][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(2);
};
Keyboard[Keyboard.KEYS.TWO][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(2);
};

Keyboard[Keyboard.KEYS.THREE] = {};
Keyboard[Keyboard.KEYS.THREE][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(3);
};
Keyboard[Keyboard.KEYS.THREE][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(3);
};

Keyboard[Keyboard.KEYS.FOUR] = {};
Keyboard[Keyboard.KEYS.FOUR][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(4);
};
Keyboard[Keyboard.KEYS.FOUR][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(4);
};

Keyboard[Keyboard.KEYS.FIVE] = {};
Keyboard[Keyboard.KEYS.FIVE][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(5);
};
Keyboard[Keyboard.KEYS.FIVE][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(5);
};

Keyboard[Keyboard.KEYS.SIX] = {};
Keyboard[Keyboard.KEYS.SIX][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(6);
};
Keyboard[Keyboard.KEYS.SIX][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(6);
};

Keyboard[Keyboard.KEYS.SEVEN] = {};
Keyboard[Keyboard.KEYS.SEVEN][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(7);
};
Keyboard[Keyboard.KEYS.SEVEN][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(7);
};

Keyboard[Keyboard.KEYS.EIGHT] = {};
Keyboard[Keyboard.KEYS.EIGHT][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(8);
};
Keyboard[Keyboard.KEYS.EIGHT][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(8);
};

Keyboard[Keyboard.KEYS.NINE] = {};
Keyboard[Keyboard.KEYS.NINE][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(9);
};
Keyboard[Keyboard.KEYS.NINE][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(9);
};

Keyboard[Keyboard.KEYS.ZERO] = {};
Keyboard[Keyboard.KEYS.ZERO][Keyboard.COMBO_KEYS.CTRL | Keyboard.COMBO_KEYS.ALT] = function(e) {
  scope.renderer().setPreset(0);
};
Keyboard[Keyboard.KEYS.ZERO][Keyboard.COMBO_KEYS.CTRL] = function(e) {
  scope.renderer().selectPreset(0);
};

Keyboard[Keyboard.KEYS.BACKSPACE] = {};
Keyboard[Keyboard.KEYS.BACKSPACE][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().removePreviewChar();
};

Keyboard[Keyboard.KEYS.ADD] = {};
Keyboard[Keyboard.KEYS.ADD][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().targetSelect();
};

Keyboard[Keyboard.KEYS.TAB] = {};
Keyboard[Keyboard.KEYS.TAB][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().targetSelect();
};

Keyboard[Keyboard.KEYS.ENTER] = {};
Keyboard[Keyboard.KEYS.ENTER][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().processPreviewArea(null, scope._controller);
};

Keyboard[Keyboard.KEYS.LEFT_ARROW] = {};
Keyboard[Keyboard.KEYS.LEFT_ARROW][Keyboard.COMBO_KEYS.NONE] = function(e) {
  switch (scope.textOverlay().lines()) {
    case 2:
      scope.textOverlay().addPreviewChar('TL');
      scope.textOverlay().addPreviewChar(' ');
      break;
    case 3:
      scope.textOverlay().addPreviewChar('L');
      break;
  }
};

Keyboard[Keyboard.KEYS.RIGHT_ARROW] = {};
Keyboard[Keyboard.KEYS.RIGHT_ARROW][Keyboard.COMBO_KEYS.NONE] = function(e) {
  switch (scope.textOverlay().lines()) {
    case 2:
      scope.textOverlay().addPreviewChar('TR');
      scope.textOverlay().addPreviewChar(' ');
      break;
    case 3:
      scope.textOverlay().addPreviewChar('R');
      break;
  }
};

Keyboard[Keyboard.KEYS.UP_ARROW] = {};
Keyboard[Keyboard.KEYS.UP_ARROW][Keyboard.COMBO_KEYS.NONE] = function(e) {
  switch (scope.textOverlay().lines()) {
    case 2:
      scope.textOverlay().addPreviewChar('CM');
      scope.textOverlay().addPreviewChar(' ');
      break;
    case 3:
      scope.textOverlay().addPreviewChar('C');
      break;
  }
};

Keyboard[Keyboard.KEYS.DOWN_ARROW] = {};
Keyboard[Keyboard.KEYS.DOWN_ARROW][Keyboard.COMBO_KEYS.NONE] = function(e) {
  switch (scope.textOverlay().lines()) {
    case 2:
      scope.textOverlay().addPreviewChar('DM');
      scope.textOverlay().addPreviewChar(' ');
      break;
    case 3:
      scope.textOverlay().addPreviewChar('C');
      break;
  }
};

Keyboard[Keyboard.KEYS.DECIMAL_POINT] = {};
Keyboard[Keyboard.KEYS.DECIMAL_POINT][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().addPreviewChar('SPD');
  scope.textOverlay().addPreviewChar(' ');
};

Keyboard[Keyboard.KEYS.EQUAL_SIGN] = {};
Keyboard[Keyboard.KEYS.EQUAL_SIGN][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().addPreviewChar('ILS');
  scope.textOverlay().addPreviewChar(' ');
};

Keyboard[Keyboard.KEYS.EQUAL_SIGN] = {};
Keyboard[Keyboard.KEYS.EQUAL_SIGN][Keyboard.COMBO_KEYS.NONE] = function(e) {
  scope.textOverlay().addPreviewChar('ILS');
  scope.textOverlay().addPreviewChar(' ');
};