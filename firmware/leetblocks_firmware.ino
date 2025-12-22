/**
 * LeetBlocks Default Firmware
 * 
 * This firmware enables real-time control of Arduino from LeetBlocks Stage mode.
 * It implements a simple command/response protocol over serial.
 * 
 * Command format: <CMD><ARGS>\n
 * Response format: OK:<DATA>\n or ERR:<MESSAGE>\n
 * 
 * Upload this sketch to your Arduino before using Stage mode with hardware.
 */

#include <Servo.h>

// Maximum number of servos supported
#define MAX_SERVOS 6
Servo servos[MAX_SERVOS];
int servoPins[MAX_SERVOS] = {-1, -1, -1, -1, -1, -1};

// Serial buffer
String inputBuffer = "";

void setup() {
    Serial.begin(115200);
    while (!Serial) {
        ; // Wait for serial connection
    }
    Serial.println("OK:LeetBlocks Ready");
}

void loop() {
    while (Serial.available()) {
        char c = Serial.read();
        
        if (c == '\n' || c == '\r') {
            if (inputBuffer.length() > 0) {
                processCommand(inputBuffer);
                inputBuffer = "";
            }
        } else {
            inputBuffer += c;
        }
    }
}

void processCommand(String cmd) {
    if (cmd.length() == 0) {
        return;
    }
    
    char cmdType = cmd.charAt(0);
    String args = cmd.substring(1);
    
    switch (cmdType) {
        case 'P':  // Ping
            Serial.println("OK");
            break;
            
        case 'D':  // Set Digital - D<pin>:<value>
            handleSetDigital(args);
            break;
            
        case 'R':  // Read Digital - R<pin>
            handleReadDigital(args);
            break;
            
        case 'A':  // Read Analog - A<pin>
            handleReadAnalog(args);
            break;
            
        case 'W':  // Set PWM - W<pin>:<value>
            handleSetPWM(args);
            break;
            
        case 'S':  // Set Servo - S<pin>:<angle>
            handleSetServo(args);
            break;
            
        case 'M':  // Set Motor - M<id>:<speed>
            handleSetMotor(args);
            break;
            
        case 'X':  // Stop all motors
            handleStopMotors();
            break;
            
        case 'T':  // Tone - T<pin>:<freq>,<duration>
            handleTone(args);
            break;
            
        case 'N':  // No Tone - N<pin>
            handleNoTone(args);
            break;
            
        default:
            Serial.println("ERR:Unknown command");
            break;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DIGITAL I/O
// ═══════════════════════════════════════════════════════════════════════════

void handleSetDigital(String args) {
    int colonPos = args.indexOf(':');
    if (colonPos == -1) {
        Serial.println("ERR:Invalid format");
        return;
    }
    
    int pin = args.substring(0, colonPos).toInt();
    int value = args.substring(colonPos + 1).toInt();
    
    pinMode(pin, OUTPUT);
    digitalWrite(pin, value ? HIGH : LOW);
    Serial.println("OK");
}

void handleReadDigital(String args) {
    int pin = args.toInt();
    pinMode(pin, INPUT);
    int value = digitalRead(pin);
    Serial.print("OK:");
    Serial.println(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALOG I/O
// ═══════════════════════════════════════════════════════════════════════════

void handleReadAnalog(String args) {
    int pin = args.toInt();
    int value = analogRead(pin);
    Serial.print("OK:");
    Serial.println(value);
}

void handleSetPWM(String args) {
    int colonPos = args.indexOf(':');
    if (colonPos == -1) {
        Serial.println("ERR:Invalid format");
        return;
    }
    
    int pin = args.substring(0, colonPos).toInt();
    int value = args.substring(colonPos + 1).toInt();
    
    pinMode(pin, OUTPUT);
    analogWrite(pin, constrain(value, 0, 255));
    Serial.println("OK");
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVO CONTROL
// ═══════════════════════════════════════════════════════════════════════════

int getServoIndex(int pin) {
    // Check if servo already attached to this pin
    for (int i = 0; i < MAX_SERVOS; i++) {
        if (servoPins[i] == pin) {
            return i;
        }
    }
    // Find free slot
    for (int i = 0; i < MAX_SERVOS; i++) {
        if (servoPins[i] == -1) {
            servoPins[i] = pin;
            servos[i].attach(pin);
            return i;
        }
    }
    return -1;  // No free slot
}

void handleSetServo(String args) {
    int colonPos = args.indexOf(':');
    if (colonPos == -1) {
        Serial.println("ERR:Invalid format");
        return;
    }
    
    int pin = args.substring(0, colonPos).toInt();
    int angle = args.substring(colonPos + 1).toInt();
    
    int idx = getServoIndex(pin);
    if (idx == -1) {
        Serial.println("ERR:No servo slots");
        return;
    }
    
    servos[idx].write(constrain(angle, 0, 180));
    Serial.println("OK");
}

// ═══════════════════════════════════════════════════════════════════════════
// MOTOR CONTROL (Simple DC motor via PWM pins)
// ═══════════════════════════════════════════════════════════════════════════

// Motor pin mappings (customize for your motor shield)
// Default: Motor 1 = pins 5,6, Motor 2 = pins 9,10
const int MOTOR_PINS[2][2] = {
    {5, 6},   // Motor 1: forward, backward
    {9, 10}   // Motor 2: forward, backward
};

void handleSetMotor(String args) {
    int colonPos = args.indexOf(':');
    if (colonPos == -1) {
        Serial.println("ERR:Invalid format");
        return;
    }
    
    int motorId = args.substring(0, colonPos).toInt();
    int speed = args.substring(colonPos + 1).toInt();
    
    if (motorId < 1 || motorId > 2) {
        Serial.println("ERR:Invalid motor");
        return;
    }
    
    int idx = motorId - 1;
    pinMode(MOTOR_PINS[idx][0], OUTPUT);
    pinMode(MOTOR_PINS[idx][1], OUTPUT);
    
    if (speed >= 0) {
        analogWrite(MOTOR_PINS[idx][0], constrain(speed, 0, 255));
        analogWrite(MOTOR_PINS[idx][1], 0);
    } else {
        analogWrite(MOTOR_PINS[idx][0], 0);
        analogWrite(MOTOR_PINS[idx][1], constrain(-speed, 0, 255));
    }
    
    Serial.println("OK");
}

void handleStopMotors() {
    for (int i = 0; i < 2; i++) {
        analogWrite(MOTOR_PINS[i][0], 0);
        analogWrite(MOTOR_PINS[i][1], 0);
    }
    Serial.println("OK");
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUND
// ═══════════════════════════════════════════════════════════════════════════

void handleTone(String args) {
    int colonPos = args.indexOf(':');
    if (colonPos == -1) {
        Serial.println("ERR:Invalid format");
        return;
    }
    
    int pin = args.substring(0, colonPos).toInt();
    String freqDur = args.substring(colonPos + 1);
    
    int commaPos = freqDur.indexOf(',');
    if (commaPos == -1) {
        Serial.println("ERR:Invalid format");
        return;
    }
    
    int freq = freqDur.substring(0, commaPos).toInt();
    int duration = freqDur.substring(commaPos + 1).toInt();
    
    tone(pin, freq, duration);
    Serial.println("OK");
}

void handleNoTone(String args) {
    int pin = args.toInt();
    noTone(pin);
    Serial.println("OK");
}
