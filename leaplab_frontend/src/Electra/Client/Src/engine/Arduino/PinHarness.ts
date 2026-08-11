/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
export const LEAP_PINS: Record<string, { viewBox: { minX: number, minY: number, width: number, height: number }, pins: { name: string, x: number, y: number }[] }> = {
  "slide-potentiometer": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 55,
      "height": 29
    },
    "pins": [
      {
        "name": "VCC",
        "x": -0.5,
        "y": 10.5
      },
      {
        "name": "SIG",
        "x": -0.5,
        "y": 15.5
      },
      {
        "name": "GND",
        "x": 55,
        "y": 10
      }
    ]
  },
  "slide-pot": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 55,
      "height": 29
    },
    "pins": [
      {
        "name": "VCC",
        "x": 1,
        "y": 43
      },
      {
        "name": "SIG",
        "x": 1,
        "y": 63
      },
      {
        "name": "GND",
        "x": 207,
        "y": 43
      }
    ]
  },
  "small-sound-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 133,
      "height": 50.4
    },
    "pins": [
      {
        "name": "AOUT",
        "y": 8,
        "x": 0
      },
      {
        "name": "GND",
        "y": 17,
        "x": 0
      },
      {
        "name": "VCC",
        "y": 25.5,
        "x": 0
      },
      {
        "name": "DOUT",
        "y": 35,
        "x": 0
      }
    ]
  },
  "analog-joystick": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 27.2,
      "height": 31.8
    },
    "pins": [
      {
        "name": "VCC",
        "x": 32,
        "y": 109
      },
      {
        "name": "VERT",
        "x": 41,
        "y": 109
      },
      {
        "name": "HORZ",
        "x": 51,
        "y": 109
      },
      {
        "name": "SEL",
        "x": 61,
        "y": 109
      },
      {
        "name": "GND",
        "x": 70,
        "y": 109
      }
    ]
  },
  "arduino-mega": {
    "viewBox": {
      "minX": -4,
      "minY": 0,
      "width": 102.66,
      "height": 50.8
    },
    "pins": [
      {
        "name": "SCL",
        "x": 90,
        "y": 9
      },
      {
        "name": "SDA",
        "x": 100,
        "y": 9
      },
      {
        "name": "AREF",
        "x": 109,
        "y": 9
      },
      {
        "name": "GND.1",
        "x": 119,
        "y": 9
      },
      {
        "name": "13",
        "x": 129,
        "y": 9
      },
      {
        "name": "12",
        "x": 138,
        "y": 9
      },
      {
        "name": "11",
        "x": 148,
        "y": 9
      },
      {
        "name": "10",
        "x": 157.5,
        "y": 9
      },
      {
        "name": "9",
        "x": 167.5,
        "y": 9
      },
      {
        "name": "8",
        "x": 177,
        "y": 9
      },
      {
        "name": "7",
        "x": 190,
        "y": 9
      },
      {
        "name": "6",
        "x": 200,
        "y": 9
      },
      {
        "name": "5",
        "x": 209.5,
        "y": 9
      },
      {
        "name": "4",
        "x": 219,
        "y": 9
      },
      {
        "name": "3",
        "x": 228.5,
        "y": 9
      },
      {
        "name": "2",
        "x": 238,
        "y": 9
      },
      {
        "name": "1",
        "x": 247.5,
        "y": 9
      },
      {
        "name": "0",
        "x": 257.5,
        "y": 9
      },
      {
        "name": "14",
        "x": 270.5,
        "y": 9
      },
      {
        "name": "15",
        "x": 280,
        "y": 9
      },
      {
        "name": "16",
        "x": 289.5,
        "y": 9
      },
      {
        "name": "17",
        "x": 299,
        "y": 9
      },
      {
        "name": "18",
        "x": 308.5,
        "y": 9
      },
      {
        "name": "19",
        "x": 318.5,
        "y": 9
      },
      {
        "name": "20",
        "x": 328,
        "y": 9
      },
      {
        "name": "21",
        "x": 337.5,
        "y": 9
      },
      {
        "name": "5V.1",
        "x": 361,
        "y": 8
      },
      {
        "name": "5V.2",
        "x": 371,
        "y": 8
      },
      {
        "name": "22",
        "x": 361,
        "y": 17.5
      },
      {
        "name": "23",
        "x": 371,
        "y": 17.5
      },
      {
        "name": "24",
        "x": 361,
        "y": 27.25
      },
      {
        "name": "25",
        "x": 371,
        "y": 27.25
      },
      {
        "name": "26",
        "x": 361,
        "y": 36.75
      },
      {
        "name": "27",
        "x": 371,
        "y": 36.75
      },
      {
        "name": "28",
        "x": 361,
        "y": 46.25
      },
      {
        "name": "29",
        "x": 371,
        "y": 46.25
      },
      {
        "name": "30",
        "x": 361,
        "y": 56
      },
      {
        "name": "31",
        "x": 371,
        "y": 56
      },
      {
        "name": "32",
        "x": 361,
        "y": 65.5
      },
      {
        "name": "33",
        "x": 371,
        "y": 65.5
      },
      {
        "name": "34",
        "x": 361,
        "y": 75
      },
      {
        "name": "35",
        "x": 371,
        "y": 75
      },
      {
        "name": "36",
        "x": 361,
        "y": 84.5
      },
      {
        "name": "37",
        "x": 371,
        "y": 84.5
      },
      {
        "name": "38",
        "x": 361,
        "y": 94.25
      },
      {
        "name": "39",
        "x": 371,
        "y": 94.25
      },
      {
        "name": "40",
        "x": 361,
        "y": 103.75
      },
      {
        "name": "41",
        "x": 371,
        "y": 103.75
      },
      {
        "name": "42",
        "x": 361,
        "y": 113.5
      },
      {
        "name": "43",
        "x": 371,
        "y": 113.5
      },
      {
        "name": "44",
        "x": 361,
        "y": 123
      },
      {
        "name": "45",
        "x": 371,
        "y": 123
      },
      {
        "name": "46",
        "x": 361,
        "y": 132.75
      },
      {
        "name": "47",
        "x": 371,
        "y": 132.75
      },
      {
        "name": "48",
        "x": 361,
        "y": 142.25
      },
      {
        "name": "49",
        "x": 371,
        "y": 142.25
      },
      {
        "name": "50",
        "x": 361,
        "y": 152
      },
      {
        "name": "51",
        "x": 371,
        "y": 152
      },
      {
        "name": "52",
        "x": 361,
        "y": 161.5
      },
      {
        "name": "53",
        "x": 371,
        "y": 161.5
      },
      {
        "name": "GND.4",
        "x": 361,
        "y": 171.25
      },
      {
        "name": "GND.5",
        "x": 371,
        "y": 171.25
      },
      {
        "name": "IOREF",
        "x": 136,
        "y": 184.5
      },
      {
        "name": "RESET",
        "x": 145.5,
        "y": 184.5
      },
      {
        "name": "3.3V",
        "x": 155,
        "y": 184.5
      },
      {
        "name": "5V",
        "x": 164.5,
        "y": 184.5
      },
      {
        "name": "GND.2",
        "x": 174.25,
        "y": 184.5
      },
      {
        "name": "GND.3",
        "x": 183.75,
        "y": 184.5
      },
      {
        "name": "VIN",
        "x": 193.5,
        "y": 184.5
      },
      {
        "name": "A0",
        "x": 208.5,
        "y": 184.5
      },
      {
        "name": "A1",
        "x": 218,
        "y": 184.5
      },
      {
        "name": "A2",
        "x": 227.5,
        "y": 184.5
      },
      {
        "name": "A3",
        "x": 237.25,
        "y": 184.5
      },
      {
        "name": "A4",
        "x": 246.75,
        "y": 184.5
      },
      {
        "name": "A5",
        "x": 256.25,
        "y": 184.5
      },
      {
        "name": "A6",
        "x": 266,
        "y": 184.5
      },
      {
        "name": "A7",
        "x": 275.5,
        "y": 184.5
      },
      {
        "name": "A8",
        "x": 290.25,
        "y": 184.5
      },
      {
        "name": "A9",
        "x": 300,
        "y": 184.5
      },
      {
        "name": "A10",
        "x": 309.5,
        "y": 184.5
      },
      {
        "name": "A11",
        "x": 319.25,
        "y": 184.5
      },
      {
        "name": "A12",
        "x": 328.75,
        "y": 184.5
      },
      {
        "name": "A13",
        "x": 338.5,
        "y": 184.5
      },
      {
        "name": "A14",
        "x": 348,
        "y": 184.5
      },
      {
        "name": "A15",
        "x": 357.75,
        "y": 184.5
      }
    ]
  },
  "arduino-nano": {
    "viewBox": {
      "minX": -1.4,
      "minY": 0,
      "width": 44.9,
      "height": 17.8
    },
    "pins": [
      {
        "name": "12",
        "x": 19.7,
        "y": 4.8
      },
      {
        "name": "11",
        "x": 29.3,
        "y": 4.8
      },
      {
        "name": "10",
        "x": 38.9,
        "y": 4.8
      },
      {
        "name": "9",
        "x": 48.5,
        "y": 4.8
      },
      {
        "name": "8",
        "x": 58.1,
        "y": 4.8
      },
      {
        "name": "7",
        "x": 67.7,
        "y": 4.8
      },
      {
        "name": "6",
        "x": 77.3,
        "y": 4.8
      },
      {
        "name": "5",
        "x": 86.9,
        "y": 4.8
      },
      {
        "name": "4",
        "x": 96.5,
        "y": 4.8
      },
      {
        "name": "3",
        "x": 106.1,
        "y": 4.8
      },
      {
        "name": "2",
        "x": 115.7,
        "y": 4.8
      },
      {
        "name": "GND.2",
        "x": 125.3,
        "y": 4.8
      },
      {
        "name": "RESET.2",
        "x": 134.9,
        "y": 4.8
      },
      {
        "name": "0",
        "x": 144.5,
        "y": 4.8
      },
      {
        "name": "1",
        "x": 154.1,
        "y": 4.8
      },
      {
        "name": "13",
        "x": 19.7,
        "y": 62.4
      },
      {
        "name": "3.3V",
        "x": 29.3,
        "y": 62.4
      },
      {
        "name": "AREF",
        "x": 38.9,
        "y": 62.4
      },
      {
        "name": "A0",
        "x": 48.5,
        "y": 62.4
      },
      {
        "name": "A1",
        "x": 58.1,
        "y": 62.4
      },
      {
        "name": "A2",
        "x": 67.7,
        "y": 62.4
      },
      {
        "name": "A3",
        "x": 77.3,
        "y": 62.4
      },
      {
        "name": "A4",
        "x": 86.9,
        "y": 62.4
      },
      {
        "name": "A5",
        "x": 96.5,
        "y": 62.4
      },
      {
        "name": "A6",
        "x": 106.1,
        "y": 62.4
      },
      {
        "name": "A7",
        "x": 115.7,
        "y": 62.4
      },
      {
        "name": "5V",
        "x": 125.3,
        "y": 62.4
      },
      {
        "name": "RESET",
        "x": 134.9,
        "y": 62.4
      },
      {
        "name": "GND.1",
        "x": 144.5,
        "y": 62.4
      },
      {
        "name": "VIN",
        "x": 154.1,
        "y": 62.4
      },
      {
        "name": "12.2",
        "x": 163.7,
        "y": 43.2
      },
      {
        "name": "5V.2",
        "x": 154.1,
        "y": 43.2
      },
      {
        "name": "13.2",
        "x": 163.7,
        "y": 33.6
      },
      {
        "name": "11.2",
        "x": 154.1,
        "y": 33.6
      },
      {
        "name": "RESET.3",
        "x": 163.7,
        "y": 24
      },
      {
        "name": "GND.3",
        "x": 154.1,
        "y": 24
      }
    ]
  },
  "arduino-uno": {
    "viewBox": {
      "minX": -4,
      "minY": 0,
      "width": 72.58,
      "height": 53.34
    },
    "pins": [
      {
        "name": "A5.2",
        "x": 69,
        "y": 8
      },
      {
        "name": "A4.2",
        "x": 79,
        "y": 8
      },
      {
        "name": "AREF",
        "x": 89,
        "y": 8
      },
      {
        "name": "GND.1",
        "x": 99,
        "y": 8
      },
      {
        "name": "13",
        "x": 109,
        "y": 8
      },
      {
        "name": "12",
        "x": 119,
        "y": 8
      },
      {
        "name": "11",
        "x": 128,
        "y": 8
      },
      {
        "name": "10",
        "x": 138,
        "y": 8
      },
      {
        "name": "9",
        "x": 147,
        "y": 8
      },
      {
        "name": "8",
        "x": 157,
        "y": 8
      },
      {
        "name": "7",
        "x": 172,
        "y": 8
      },
      {
        "name": "6",
        "x": 182,
        "y": 8
      },
      {
        "name": "5",
        "x": 191,
        "y": 8
      },
      {
        "name": "4",
        "x": 201,
        "y": 8
      },
      {
        "name": "3",
        "x": 211,
        "y": 8
      },
      {
        "name": "2",
        "x": 221,
        "y": 8
      },
      {
        "name": "1",
        "x": 230,
        "y": 8
      },
      {
        "name": "0",
        "x": 240,
        "y": 8
      },
      {
        "name": "IOREF",
        "x": 114.5,
        "y": 185
      },
      {
        "name": "RESET",
        "x": 124,
        "y": 185
      },
      {
        "name": "3.3V",
        "x": 133.5,
        "y": 185
      },
      {
        "name": "5V",
        "x": 143,
        "y": 185
      },
      {
        "name": "GND.2",
        "x": 153,
        "y": 185
      },
      {
        "name": "GND.3",
        "x": 163,
        "y": 185
      },
      {
        "name": "VIN",
        "x": 172,
        "y": 185
      },
      {
        "name": "A0",
        "x": 191,
        "y": 185
      },
      {
        "name": "A1",
        "x": 201,
        "y": 185
      },
      {
        "name": "A2",
        "x": 211,
        "y": 185
      },
      {
        "name": "A3",
        "x": 221,
        "y": 185
      },
      {
        "name": "A4",
        "x": 230,
        "y": 185
      },
      {
        "name": "A5",
        "x": 240,
        "y": 185
      }
    ]
  },
  "biaxial-stepper": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 212,
      "height": 285
    },
    "pins": [
      {
        "name": "A1-",
        "x": 45,
        "y": 105.5
      },
      {
        "name": "A1+",
        "x": 45,
        "y": 115
      },
      {
        "name": "B1+",
        "x": 45,
        "y": 124.5
      },
      {
        "name": "B1-",
        "x": 45,
        "y": 134.5
      },
      {
        "name": "A2-",
        "x": 45,
        "y": 143
      },
      {
        "name": "A2+",
        "x": 45,
        "y": 152.5
      },
      {
        "name": "B2+",
        "x": 45,
        "y": 162
      },
      {
        "name": "B2-",
        "x": 45,
        "y": 171.2
      }
    ]
  },
  "stepper-motor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 220.3,
      "height": 239.2
    },
    "pins": [
      {
        "name": "A-",
        "x": 93.5,
        "y": 230
      },
      {
        "name": "A+",
        "x": 103,
        "y": 230
      },
      {
        "name": "B+",
        "x": 112.5,
        "y": 230
      },
      {
        "name": "B-",
        "x": 122,
        "y": 230
      }
    ]
  },
  "big-sound-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 140,
      "height": 50.4
    },
    "pins": [
      {
        "name": "AOUT",
        "x": 0,
        "y": 9
      },
      {
        "name": "GND",
        "x": 0,
        "y": 18
      },
      {
        "name": "VCC",
        "x": 0,
        "y": 26
      },
      {
        "name": "DOUT",
        "x": 0,
        "y": 35
      }
    ]
  },
  "buzzer": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 17,
      "height": 20
    },
    "pins": [
      {
        "name": "GND",
        "x": 22,
        "y": 74
      },
      {
        "name": "VCC",
        "x": 31,
        "y": 74
      }
    ]
  },
  "dht22": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 15.1,
      "height": 30.885
    },
    "pins": [
      {
        "name": "VCC",
        "x": 3.56,
        "y": 29
      },
      {
        "name": "SDA",
        "x": 6,
        "y": 29
      },
      {
        "name": "NC",
        "x": 8.7,
        "y": 29
      },
      {
        "name": "GND",
        "x": 11.2,
        "y": 29
      }
    ]
  },
  "ds1307": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 25.8,
      "height": 22.212
    },
    "pins": [
      {
        "name": "GND",
        "x": 2.5,
        "y": 3.2
      },
      {
        "name": "5V",
        "x": 2.4,
        "y": 5.6
      },
      {
        "name": "SDA",
        "x": 2.5,
        "y": 8
      },
      {
        "name": "SCL",
        "x": 2.5,
        "y": 10.3
      },
      {
        "name": "SQW",
        "x": 2.5,
        "y": 12.5
      }
    ]
  },
  "esp32-c3": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 107,
      "height": 201
    },
    "pins": [
      { "name": "VIN", "x": 3.55, "y": 151 },
      { "name": "GND.2", "x":3.55, "y": 141 },
      { "name": "D13", "x": 3.4, "y": 132 },
      { "name": "D12", "x": 3.4, "y": 123 },
      { "name": "D14", "x": 3.4, "y": 114 },
      { "name": "D27", "x": 3.4, "y": 105.5 },
      { "name": "D26", "x": 3.4, "y": 96 },
      { "name": "D25", "x": 3.4, "y": 86.5 },
      { "name": "D33", "x": 3.4, "y": 76 },
      { "name": "D32", "x": 3.4, "y": 68 },
      { "name": "D35", "x": 3.4, "y": 58 },
      { "name": "D34", "x": 3.4, "y": 50 },
      { "name": "VN", "x": 3.4, "y": 40 },
      { "name": "VP", "x": 3.4, "y": 31 },
      { "name": "EN", "x": 3.5, "y": 22 },
      { "name": "3V3", "x": 100, "y": 151 },
      { "name": "GND.1", "x": 100, "y": 141.0 },
      { "name": "D15", "x": 100, "y": 132.5 },
      { "name": "D2", "x": 100, "y": 123 },
      { "name": "D4", "x": 100, "y": 114 },
      { "name": "RX2", "x": 100, "y": 105 },
      { "name": "TX2", "x": 100, "y": 96 },
      { "name": "D5", "x": 100, "y": 86.5 },
      { "name": "D18", "x": 100, "y": 77 },
      { "name": "D19", "x": 100, "y": 68 },
      { "name": "D21", "x": 100, "y": 58 },
      { "name": "RX0", "x": 100, "y": 49 },
      { "name": "TX0", "x": 100, "y": 40 },
      { "name": "D22", "x": 100, "y": 31 },
      { "name": "D23", "x": 100, "y": 21 }
    ]
  },
  "flame-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 200,
      "height": 61.5
    },
    "pins": [
      {
        "name": "VCC",
        "x": 198,
        "y": 12
      },
      {
        "name": "GND",
        "x": 198,
        "y": 21.5
      },
      {
        "name": "DOUT",
        "x": 198,
        "y": 30.5
      },
      {
        "name": "AOUT",
        "x": 198,
        "y": 38.5
      }
    ]
  },
  "franzininho": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 64,
      "height": 30
    },
    "pins": [
      {
        "name": "GND.1",
        "x": 218.5,
        "y": 23.3
      },
      {
        "name": "VCC.1",
        "x": 218.5,
        "y": 32.9
      },
      {
        "name": "PB4",
        "x": 218.5,
        "y": 42.5
      },
      {
        "name": "PB5",
        "x": 218.5,
        "y": 52.2
      },
      {
        "name": "PB3",
        "x": 218.5,
        "y": 61.7
      },
      {
        "name": "PB2",
        "x": 218.5,
        "y": 71.2
      },
      {
        "name": "PB1",
        "x": 218.5,
        "y": 80.9
      },
      {
        "name": "PB0",
        "x": 218.5,
        "y": 90.5
      },
      {
        "name": "VIN",
        "x": 132.7,
        "y": 8.1
      },
      {
        "name": "GND.2",
        "x": 142.9,
        "y": 8.1
      },
      {
        "name": "VCC.2",
        "x": 153,
        "y": 8.1
      }
    ]
  },
  "gas-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 137,
      "height": 59.5
    },
    "pins": [
      {
        "name": "AOUT",
        "x": 137,
        "y": 13
      },
      {
        "name": "DOUT",
        "x": 137,
        "y": 21
      },
      {
        "name": "GND",
        "x": 137,
        "y": 30
      },
      {
        "name": "VCC",
        "x": 137,
        "y": 38.5
      }
    ]
  },
  "hc-sr04": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 45,
      "height": 25
    },
    "pins": [
      {
        "name": "VCC",
        "x": 18.5,
        "y": 23
      },
      {
        "name": "TRIG",
        "x": 21.2,
        "y": 23
      },
      {
        "name": "ECHO",
        "x": 23.6,
        "y": 23
      },
      {
        "name": "GND",
        "x": 26.3,
        "y": 23
      }
    ]
  },
  "heart-beat-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 88.4,
      "height": 79.2
    },
    "pins": [
      {
        "name": "GND",
        "x": 87,
        "y": 15
      },
      {
        "name": "VCC",
        "x": 87,
        "y": 24
      },
      {
        "name": "OUT",
        "x": 87,
        "y": 33
      }
    ]
  },
  "ili9341": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 46.5,
      "height": 77.6
    },
    "pins": [
      {
        "name": "VCC",
        "x": 12.3,
        "y": 73.5
      },
      {
        "name": "GND",
        "x": 14.5,
        "y": 73.5
      },
      {
        "name": "CS",
        "x": 17.5,
        "y": 73.5
      },
      {
        "name": "RST",
        "x": 20,
        "y": 73.5
      },
      {
        "name": "D/C",
        "x": 22.2,
        "y": 73.5
      },
      {
        "name": "MOSI",
        "x": 25,
        "y": 73.5
      },
      {
        "name": "SCK",
        "x": 27.7,
        "y": 73.5
      },
      {
        "name": "LED",
        "x": 30.2,
        "y": 73.5
      },
      {
        "name": "MISO",
        "x": 32.5,
        "y": 73.5
      }
    ]
  },
  "ili9341-touch": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 46.5,
      "height": 77.6
    },
    "pins": [
      {
        "name": "VCC",
        "x": 14.8,
        "y": 73.5
      },
      {
        "name": "GND",
        "x": 17.45,
        "y": 73.5
      },
      {
        "name": "CS",
        "x": 20,
        "y": 73.5
      },
      {
        "name": "RST",
        "x": 22.5,
        "y": 73.5
      },
      {
        "name": "D/C",
        "x": 25,
        "y": 73.5
      },
      {
        "name": "MOSI",
        "x": 27.5,
        "y": 73.5
      },
      {
        "name": "SCK",
        "x": 30,
        "y": 73.5
      },
      {
        "name": "LED",
        "x": 33,
        "y": 73.5
      },
      {
        "name": "MISO",
        "x": 35,
        "y": 73.5
      },
      {
        "name": "SDA",
        "x": 37.5,
        "y": 73.5
      },
      {
        "name": "SCL",
        "x": 40,
        "y": 73.5
      }
    ]
  },
  "ir-receiver": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 61.1,
      "height": 88.7
    },
    "pins": [
      {
        "name": "GND",
        "x": 78,
        "y": 303
      },
      {
        "name": "VCC",
        "x": 114,
        "y": 303
      },
      {
        "name": "DAT",
        "x": 149,
        "y": 303
      }
    ]
  },
  "ir-remote": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 151,
      "height": 316
    },
    "pins": []
  },
  "ks2e-m-dc5": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 21,
      "height": 10
    },
    "pins": [
      {
        "name": "NO2",
        "x": 1.45,
        "y": 1
      },
      {
        "name": "NC2",
        "x": 6.2,
        "y": 1
      },
      {
        "name": "P2",
        "x": 11.2,
        "y": 1
      },
      {
        "name": "COIL2",
        "x": 19,
        "y": 1
      },
      {
        "name": "NO1",
        "x": 1.45,
        "y": 7.1
      },
      {
        "name": "NC1",
        "x": 6.4,
        "y": 7.1
      },
      {
        "name": "P1",
        "x": 11.2,
        "y": 7.1
      },
      {
        "name": "COIL1",
        "x": 19,
        "y": 7.1
      }
    ]
  },
  "relay-module": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 30,
      "height": 12
    },
    "pins": [
      {
        "name": "VCC",
        "x": 1.5,
        "y": 2.1
      },
      {
        "name": "GND",
        "x": 1.5,
        "y": 5
      },
      {
        "name": "IN",
        "x": 1.5,
        "y": 7.5
      },
      {
        "name": "NO",
        "x": 27.5,
        "y": 2.1
      },
      {
        "name": "COM",
        "x": 27.5,
        "y": 5
      },
      {
        "name": "NC",
        "x": 27.5,
        "y": 7.5
      }
    ]
  },
  "ky-040": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 116,
      "height": 70.4
    },
    "pins": [
      {
        "name": "CLK",
        "x": 115,
        "y": 6
      },
      {
        "name": "DT",
        "x": 115,
        "y": 15
      },
      {
        "name": "SW",
        "x": 115,
        "y": 24
      },
      {
        "name": "VCC",
        "x": 114,
        "y": 32
      },
      {
        "name": "GND",
        "x": 115,
        "y": 41
      }
    ]
  },
  "led-bar-graph": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 10.1,
      "height": 25.5
    },
    "pins": [
      {
        "name": "A1",
        "x": 1,
        "y": 1
      },
      {
        "name": "A2",
        "x": 1,
        "y": 3.4
      },
      {
        "name": "A3",
        "x": 1,
        "y": 5.8
      },
      {
        "name": "A4",
        "x": 1,
        "y": 7.9
      },
      {
        "name": "A5",
        "x": 1,
        "y": 10.5
      },
      {
        "name": "A6",
        "x": 1,
        "y": 13
      },
      {
        "name": "A7",
        "x": 1,
        "y": 15.3
      },
      {
        "name": "A8",
        "x": 1,
        "y": 17.6
      },
      {
        "name": "A9",
        "x": 1,
        "y": 20
      },
      {
        "name": "A10",
        "x": 1,
        "y": 22.5
      },
      {
        "name": "C1",
        "x": 8.5,
        "y": 1
      },
      {
        "name": "C2",
        "x": 8.5,
        "y": 3
      },
      {
        "name": "C3",
        "x": 8.5,
        "y": 5.5
      },
      {
        "name": "C4",
        "x": 8.5,
        "y": 8
      },
      {
        "name": "C5",
        "x": 8.5,
        "y": 10.5
      },
      {
        "name": "C6",
        "x": 8.5,
        "y": 13
      },
      {
        "name": "C7",
        "x": 8.5,
        "y": 15
      },
      {
        "name": "C8",
        "x": 8.5,
        "y": 17.5
      },
      {
        "name": "C9",
        "x": 8.5,
        "y": 20
      },
      {
        "name": "C10",
        "x": 8.5,
        "y": 22.5
      }
    ]
  },
  "lcd1602": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 94,
      "height": 47.5
    },
    "pins": [
      {
        "name": "VSS",
        "x": 36,
        "y": 160
      },
      {
        "name": "VDD",
        "x": 48,
        "y": 160
      },
      {
        "name": "V0",
        "x": 59,
        "y": 160
      },
      {
        "name": "RS",
        "x": 70,
        "y": 160
      },
      {
        "name": "RW",
        "x": 82,
        "y": 160
      },
      {
        "name": "E",
        "x": 93,
        "y": 160
      },
      {
        "name": "D0",
        "x": 105,
        "y": 160
      },
      {
        "name": "D1",
        "x": 116,
        "y": 160
      },
      {
        "name": "D2",
        "x": 127,
        "y": 160
      },
      {
        "name": "D3",
        "x": 140,
        "y": 160
      },
      {
        "name": "D4",
        "x": 150,
        "y": 160
      },
      {
        "name": "D5",
        "x": 162,
        "y": 160
      },
      {
        "name": "D6",
        "x": 173,
        "y": 160
      },
      {
        "name": "D7",
        "x": 185,
        "y": 160
      },
      {
        "name": "A",
        "x": 195,
        "y": 160
      },
      {
        "name": "K",
        "x": 207,
        "y": 160
      }
    ]
  },
  "lcd1602-i2c": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 50,
      "height": 50
    },
    "pins": [
      {
        "name": "GND",
        "x": 2,
        "y": 37
      },
      {
        "name": "VCC",
        "x": 2,
        "y": 50
      },
      {
        "name": "SDA",
        "x": 2,
        "y": 64
      },
      {
        "name": "SCL",
        "x": 2,
        "y": 75
      }
    ]
  },
  "lcd2004-i2c": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 50,
      "height": 50
    },
    "pins": [
      {
        "name": "GND",
        "x": 2,
        "y": 30
      },
      {
        "name": "VCC",
        "x": 2,
        "y": 38
      },
      {
        "name": "SDA",
        "x": 2,
        "y": 48
      },
      {
        "name": "SCL",
        "x": 2,
        "y": 58
      }
    ]
  },
  "lcd2004": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 94,
      "height": 47.5
    },
    "pins": [
      {
        "name": "VSS",
        "x": 32,
        "y": 165
      },
      {
        "name": "VDD",
        "x": 42,
        "y": 165
      },
      {
        "name": "V0",
        "x": 51,
        "y": 165
      },
      {
        "name": "RS",
        "x": 61,
        "y": 165
      },
      {
        "name": "RW",
        "x": 70,
        "y": 165
      },
      {
        "name": "E",
        "x": 80,
        "y": 165
      },
      {
        "name": "D0",
        "x": 90,
        "y": 165
      },
      {
        "name": "D1",
        "x": 99,
        "y": 165
      },
      {
        "name": "D2",
        "x": 109,
        "y": 165
      },
      {
        "name": "D3",
        "x": 118,
        "y": 165
      },
      {
        "name": "D4",
        "x": 129,
        "y": 165
      },
      {
        "name": "D5",
        "x": 138,
        "y": 165
      },
      {
        "name": "D6",
        "x": 147,
        "y": 165
      },
      {
        "name": "D7",
        "x": 157,
        "y": 165
      },
      {
        "name": "A",
        "x": 166,
        "y": 165
      },
      {
        "name": "K",
        "x": 176,
        "y": 165
      }
    ]
  },
  "led": {
    "viewBox": {
      "minX": -10,
      "minY": -5,
      "width": 35.456,
      "height": 39.618
    },
    "pins": [
      {
        "name": "Anode",
        "x": 11,
        "y": 24
      },
      {
        "name": "Cathode",
        "x": 2.5,
        "y": 24
      }
    ]
  },
  "ssd1306": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 27.7,
      "height": 22.6
    },
    "pins": [
      {
        "name": "GND",
        "x": 10,
        "y": 1
      },
      {
        "name": "VCC",
        "x": 12.5,
        "y": 1
      },
      {
        "name": "SCL",
        "x": 15.2,
        "y": 1
      },
      {
        "name": "SDA",
        "x": 17.8,
        "y": 1
      }
    ]
  },
  "7segment": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 12.55,
      "height": 22
    },
    "pins": [
      {
        "name": "E",
        "x": 2.5,
        "y": 65
      },
      {
        "name": "D",
        "x": 13,
        "y": 65
      },
      {
        "name": "COM.1",
        "x": 23,
        "y": 65
      },
      {
        "name": "C",
        "x": 32.5,
        "y": 65
      },
      {
        "name": "DP",
        "x": 42.5,
        "y": 65
      },
      {
        "name": "B",
        "x": 3.5,
        "y": 1
      },
      {
        "name": "A",
        "x": 13,
        "y": 1
      },
      {
        "name": "COM.2",
        "x": 23.5,
        "y": 1
      },
      {
        "name": "F",
        "x": 32.5,
        "y": 1
      },
      {
        "name": "G",
        "x": 42.5,
        "y": 1
      }
    ]
  },
  "membrane-keypad": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 70.336,
      "height": 91
    },
    "pins": [
      {
        "name": "R1",
        "x": 26.3,
        "y": 88
      },
      {
        "name": "R2",
        "x": 28.8,
        "y": 88
      },
      {
        "name": "R3",
        "x": 31.4,
        "y": 88
      },
      {
        "name": "R4",
        "x": 33.9,
        "y": 88
      },
      {
        "name": "C1",
        "x": 36.4,
        "y": 88
      },
      {
        "name": "C2",
        "x": 39,
        "y": 88
      },
      {
        "name": "C3",
        "x": 41.5,
        "y": 88
      },
      {
        "name": "C4",
        "x": 44.1,
        "y": 88
      }
    ]
  },
  "microsd-card": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 21.6,
      "height": 20.4
    },
    "pins": [
      {
        "name": "CD",
        "x": 75.5,
        "y": 6.5
      },
      {
        "name": "DO",
        "x": 76,
        "y": 16
      },
      {
        "name": "GND",
        "x": 75.5,
        "y": 25.5
      },
      {
        "name": "SCK",
        "x": 75.5,
        "y": 34
      },
      {
        "name": "VCC",
        "x": 75.5,
        "y": 43
      },
      {
        "name": "DI",
        "x": 75.5,
        "y": 52.5
      },
      {
        "name": "CS",
        "x": 75.5,
        "y": 60.5
      }
    ]
  },
  "mpu6050": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 81.6,
      "height": 61.2
    },
    "pins": [
      {
        "name": "INT",
        "x": 6,
        "y": 4
      },
      {
        "name": "AD0",
        "x": 16,
        "y": 4.5
      },
      {
        "name": "XCL",
        "x": 25,
        "y": 4.5
      },
      {
        "name": "XDA",
        "x": 35,
        "y": 4.5
      },
      {
        "name": "SDA",
        "x": 44.5,
        "y": 4.5
      },
      {
        "name": "SCL",
        "x": 54,
        "y": 4.5
      },
      {
        "name": "GND",
        "x": 63.5,
        "y": 4.5
      },
      {
        "name": "VCC",
        "x": 73,
        "y": 4.5
      }
    ]
  },
  "mfrc522": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 40,
      "height": 30
    },
    "pins": [
      { "name": "VCC",  "x": 0,  "y": 5 },
      { "name": "RST",  "x": 0,  "y": 10 },
      { "name": "GND",  "x": 0,  "y": 15 },
      { "name": "IRQ",  "x": 0,  "y": 20 },
      { "name": "MISO", "x": 0,  "y": 25 },
      { "name": "MOSI", "x": 40, "y": 15 },
      { "name": "SCK",  "x": 40, "y": 20 },
      { "name": "SS",   "x": 40, "y": 25 }
    ]
  },
  "nano-rp2040-connect": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 168,
      "height": 67.9
    },
    "pins": [
      {
        "name": "D12",
        "x": 20.1,
        "y": 1
      },
      {
        "name": "D11",
        "x": 29.8,
        "y": 1
      },
      {
        "name": "D10",
        "x": 39.3,
        "y": 1
      },
      {
        "name": "D9",
        "x": 48.9,
        "y": 1
      },
      {
        "name": "D8",
        "x": 58.5,
        "y": 1
      },
      {
        "name": "D7",
        "x": 68.1,
        "y": 1
      },
      {
        "name": "D6",
        "x": 77.7,
        "y": 1
      },
      {
        "name": "D5",
        "x": 87.3,
        "y": 1
      },
      {
        "name": "D4",
        "x": 96.9,
        "y": 1
      },
      {
        "name": "D3",
        "x": 106.5,
        "y": 1
      },
      {
        "name": "D2",
        "x": 116.1,
        "y": 1
      },
      {
        "name": "GND.1",
        "x": 125.2,
        "y": 1
      },
      {
        "name": "RESET",
        "x": 135.3,
        "y": 1
      },
      {
        "name": "RX",
        "x": 153.9,
        "y": 1
      },
      {
        "name": "TX",
        "x": 144.5,
        "y": 1
      },
      {
        "name": "D13",
        "x": 20.1,
        "y": 67.5
      },
      {
        "name": "3.3V",
        "x": 29.7,
        "y": 67.5
      },
      {
        "name": "AREF",
        "x": 39.3,
        "y": 67.5
      },
      {
        "name": "A0",
        "x": 48.8,
        "y": 67.5
      },
      {
        "name": "A1",
        "x": 58.5,
        "y": 67.5
      },
      {
        "name": "A2",
        "x": 68,
        "y": 67.5
      },
      {
        "name": "A3",
        "x": 77.6,
        "y": 67.5
      },
      {
        "name": "A4",
        "x": 87.3,
        "y": 67.5
      },
      {
        "name": "A5",
        "x": 96.9,
        "y": 67.5
      },
      {
        "name": "A6",
        "x": 106.5,
        "y": 67.5
      },
      {
        "name": "A7",
        "x": 116.1,
        "y": 67.5
      },
      {
        "name": "5V",
        "x": 125.5,
        "y": 67.5
      },
      {
        "name": "RESET.2",
        "x": 134.9,
        "y": 67.5
      },
      {
        "name": "GND.2",
        "x": 145.3,
        "y": 67.5
      },
      {
        "name": "VIN",
        "x": 154.1,
        "y": 67.5
      }
    ]
  },
  "ntc-temperature-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 135.4,
      "height": 71.782
    },
    "pins": [
      {
        "name": "GND",
        "x": 136,
        "y": 23.4
      },
      {
        "name": "VCC",
        "x": 136,
        "y": 32.5
      },
      {
        "name": "OUT",
        "x": 136,
        "y": 41.5
      }
    ]
  },
  "photoresistor-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 174,
      "height": 61.5
    },
    "pins": [
      {
        "name": "VCC",
        "x": 174,
        "y": 14
      },
      {
        "name": "GND",
        "x": 174,
        "y": 22
      },
      {
        "name": "DO",
        "x": 174,
        "y": 31
      },
      {
        "name": "AO",
        "x": 174,
        "y": 40
      }
    ]
  },
  "proximity-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 132,
      "height": 77
    },
    "pins": [
      { "name": "VCC", "x": 130, "y": 34 },
      { "name": "GND", "x": 130, "y": 44 },
      { "name": "OUT", "x": 130, "y": 54 }
    ]
  },
  "pir-motion-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 90.7,
      "height": 92.4
    },
    "pins": [
      {
        "name": "VCC",
        "x": 35,
        "y": 84
      },
      {
        "name": "OUT",
        "x": 44,
        "y": 84
      },
      {
        "name": "GND",
        "x": 54,
        "y": 84
      }
    ]
  },
  "ir-obstacle-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 200,
      "height": 62
    },
    "pins": [
      {
        "name": "VCC",
        "x": 180,
        "y": 17
      },
      {
        "name": "OUT",
        "x": 180,
        "y": 27
      },
      {
        "name": "GND",
        "x": 180,
        "y": 36
      }
    ]
  },
  "potentiometer": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 20,
      "height": 20
    },
    "pins": [
      {
        "name": "GND",
        "x": 27,
        "y": 62
      },
      {
        "name": "SIG",
        "x": 38,
        "y": 62
      },
      {
        "name": "VCC",
        "x": 47,
        "y": 62
      }
    ]
  },
  "pushbutton-6mm": {
    "viewBox": {
      "minX": -3,
      "minY": 0,
      "width": 7.4954476,
      "height": 6
    },
    "pins": [
      {
        "name": "1.l",
        "x": 0,
        "y": 2.2
      },
      {
        "name": "2.l",
        "x": 0,
        "y": 21
      },
      {
        "name": "1.r",
        "x": 28,
        "y": 2.2
      },
      {
        "name": "2.r",
        "x": 28,
        "y": 21
      }
    ]
  },
  "pushbutton": {
    "viewBox": {
      "minX": -3,
      "minY": 0,
      "width": 18,
      "height": 12
    },
    "pins": [
      {
        "name": "1.l",
        "x": -3,
        "y": 2.5
      },
      {
        "name": "2.l",
        "x": -3,
        "y": 7.3
      },
      {
        "name": "1.r",
        "x": 15,
        "y": 2.8
      },
      {
        "name": "2.r",
        "x": 15,
        "y": 7.3
      }
    ]
  },
  "resistor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 15.645,
      "height": 3
    },
    "pins": [
      {
        "name": "1",
        "x": 0,
        "y": 5.65
      },
      {
        "name": "2",
        "x": 58.8,
        "y": 5.65
      }
    ]
  },
  "rgb-led": {
    "viewBox": {
      "minX": -17,
      "minY": -10,
      "width": 37.3425,
      "height": 57.5115
    },
    "pins": [
      {
        "name": "R",
        "x": 6,
        "y": 21
      },
      {
        "name": "COM",
        "x": -3,
        "y": 28
      },
      {
        "name": "G",
        "x": -11,
        "y": 21
      },
      {
        "name": "B",
        "x": 14,
        "y": 21
      }
    ]
  },
  "servo": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 170.08,
      "height": 119.55
    },
    "pins": [
      {
        "name": "GND",
        "x": 0,
        "y": 170
      },
      {
        "name": "V+",
        "x": 0,
        "y": 210
      },
      {
        "name": "PWM",
        "x": 0,
        "y": 250
      }
    ]
  },
  "slide-switch": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 8.5,
      "height": 9.23
    },
    "pins": [
      {
        "name": "1",
        "x": 6.5,
        "y": 28
      },
      {
        "name": "2",
        "x": 16,
        "y": 28
      },
      {
        "name": "3",
        "x": 25.5,
        "y": 28
      }
    ]
  },
  "tilt-switch": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 88.4,
      "height": 55.6
    },
    "pins": [
      {
        "name": "GND",
        "x": 88,
        "y": 15
      },
      {
        "name": "VCC",
        "x": 88,
        "y": 23.5
      },
      {
        "name": "OUT",
        "x": 88,
        "y": 32.5
      }
    ]
  },
  "hx711": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 580,
      "height": 430
    },
    "pins": [
      {
        "name": "VCC",
        "x": 18,
        "y": 128
      },
      {
        "name": "SCK",
        "x": 18,
        "y": 106
      },
      {
        "name": "DT",
        "x": 18,
        "y": 83
      },
      {
        "name": "GND",
        "x": 18,
        "y": 58
      }
    ]
  },
  "rotary-dialer": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 266,
      "height": 286
    },
    "pins": [
      {
        "name": "GND",
        "x": 121,
        "y": 279
      },
      {
        "name": "DIAL",
        "x": 130,
        "y": 279
      },
      {
        "name": "PULSE",
        "x": 140,
        "y": 279
      }
    ]
  },
  "neopixel": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 5.6631,
      "height": 5
    },
    "pins": [
      {
        "name": "VDD",
        "x": -0.5,
        "y": 0.5
      },
      {
        "name": "DOUT",
        "x": -0.5,
        "y": 2.5
      },
      {
        "name": "VSS",
        "x": 5.5,
        "y": 0.5
      },
      {
        "name": "DIN",
        "x": 5.5,
        "y": 2.5
      }
    ]
  },
  "neopixel-matrix": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 197.6,
      "height": 181.42
    },
    "pins": [
      {
        "name": "GND",
        "x": 85.27,
        "y": 173.42
      },
      {
        "name": "VCC",
        "x": 94.87,
        "y": 173.42
      },
      {
        "name": "DIN",
        "x": 105.47,
        "y": 173.42
      },
      {
        "name": "DOUT",
        "x": 115.07,
        "y": 173.42
      }
    ]
  },
  "a4988": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 113.39,
      "height": 325.04
    },
    "pins": [
      {
        "name": "ENABLE",
        "x": 0,
        "y": 35
      },
      {
        "name": "MS1",
        "x": 0,
        "y": 70
      },
      {
        "name": "MS2",
        "x": 0,
        "y": 105
      },
      {
        "name": "MS3",
        "x": 0,
        "y": 141
      },
      {
        "name": "RESET",
        "x": 0,
        "y": 176
      },
      {
        "name": "SLEEP",
        "x": 0,
        "y": 211
      },
      {
        "name": "STEP",
        "x": 0,
        "y": 246
      },
      {
        "name": "DIR",
        "x": 0,
        "y": 281.53
      },
      {
        "name": "VDD",
        "x": 113.39,
        "y": 35
      },
      {
        "name": "GND",
        "x": 113.39,
        "y": 70
      },
      {
        "name": "2B",
        "x": 113.39,
        "y": 105
      },
      {
        "name": "2A",
        "x": 113.39,
        "y": 141
      },
      {
        "name": "1A",
        "x": 113.39,
        "y": 175
      },
      {
        "name": "1B",
        "x": 113.39,
        "y": 211
      },
      {
        "name": "VMOT",
        "x": 113.39,
        "y": 246
      },
      {
        "name": "GND2",
        "x": 113.39,
        "y": 281
      }
    ]
  },
  "led-ring": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 141.62,
      "height": 152.94
    },
    "pins": [
      {
        "name": "GND",
        "x": 55,
        "y": 145.94
      },
      {
        "name": "VCC",
        "x": 65,
        "y": 145.94
      },
      {
        "name": "DIN",
        "x": 74,
        "y": 145.94
      },
      {
        "name": "DOUT",
        "x": 84,
        "y": 145.94
      }
    ]
  },
  "l298n": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 200,
      "height": 200
    },
    "pins": [
      {
        "name": "OUT1",
        "x": 1,
        "y": 119
      },
      {
        "name": "OUT2",
        "x": 1,
        "y": 140
      },
      {
        "name": "12V",
        "x": 40,
        "y": 190
      },
      {
        "name": "GND",
        "x": 65,
        "y": 190
      },
      {
        "name": "5V",
        "x": 85,
        "y": 190
      },
      {
        "name": "OUT4",
        "x": 200,
        "y": 115
      },
      {
        "name": "OUT3",
        "x": 200,
        "y": 135
      },
      {
        "name": "ENA",
        "x": 110,
        "y": 178
      },
      {
        "name": "IN1",
        "x": 122,
        "y": 178
      },
      {
        "name": "IN2",
        "x": 134,
        "y": 177
      },
      {
        "name": "IN3",
        "x": 145,
        "y": 178
      },
      {
        "name": "IN4",
        "x": 158,
        "y": 178
      },
      {
        "name": "ENB",
        "x": 170,
        "y": 178
      }
    ]
  },
  "dc-motor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 200,
      "height": 80
    },
    "pins": [
      {
        "name": "POS",
        "x": 2,
        "y": 30
      },
      {
        "name": "NEG",
        "x": 2,
        "y": 47
      }
    ]
  },
  "battery-12v": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 100,
      "height": 85
    },
    "pins": [
      {
        "name": "POS",
        "x": 21,
        "y": 11
      },
      {
        "name": "NEG",
        "x": 79,
        "y": 11
      }
    ]
  },
  "rain-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 540,
      "height": 462
    },
    "pins": [
      { "name": "AO",  "x": 288, "y": 450 },
      { "name": "DO",  "x": 307, "y": 450 },
      { "name": "GND", "x": 326, "y": 450 },
      { "name": "VCC", "x": 345, "y": 450 }
    ]
  },
  "soil-moisture-sensor": {
    "viewBox": {
      "minX": 0,
      "minY": 0,
      "width": 174,
      "height": 61.5
    },
    "pins": [
      { "name": "VCC", "x": 174, "y": 14 },
      { "name": "GND", "x": 174, "y": 22 },
      { "name": "DO",  "x": 174, "y": 31 },
      { "name": "AO",  "x": 174, "y": 40 }
    ]
  }
};
