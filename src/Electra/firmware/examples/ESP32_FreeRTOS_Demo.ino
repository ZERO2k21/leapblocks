/*
 * ESP32 FreeRTOS Demo — LeapBlocks Simulation
 *
 * Demonstrates:
 *   - xTaskCreate: creating multiple FreeRTOS tasks
 *   - vTaskDelay: periodic task execution
 *   - xQueueCreate / xQueueSend / xQueueReceive: inter-task communication
 *   - xSemaphoreCreateMutex: mutual exclusion for shared resources
 *   - Serial output from multiple tasks
 *
 * Expected behavior (in simulation):
 *   - Task 1 (LED blinker): toggles GPIO 8 every 500ms
 *   - Task 2 (Sensor reader): reads a simulated sensor every 1000ms
 *     and sends data to a queue
 *   - Task 3 (Display): receives data from the queue and prints it
 *   - All tasks share the Serial port via a mutex
 */

// ── FreeRTOS handles ────────────────────────────────────────────
QueueHandle_t sensorQueue;
SemaphoreHandle_t serialMutex;

// ── Task 1: LED Blinker ────────────────────────────────────────
void blinkTask(void *pvParameters) {
    (void)pvParameters;
    const int LED_PIN = 8;
    pinMode(LED_PIN, OUTPUT);

    for (;;) {
        digitalWrite(LED_PIN, HIGH);
        Serial.println("[Task1] LED ON");
        vTaskDelay(500 / portTICK_PERIOD_MS);

        digitalWrite(LED_PIN, LOW);
        Serial.println("[Task1] LED OFF");
        vTaskDelay(500 / portTICK_PERIOD_MS);
    }
}

// ── Task 2: Sensor Reader ──────────────────────────────────────
void sensorTask(void *pvParameters) {
    (void)pvParameters;
    int sensorValue = 0;

    for (;;) {
        // Simulate reading a sensor (analog pin 0)
        sensorValue = analogRead(A0);
        Serial.print("[Task2] Sensor read: ");
        Serial.println(sensorValue);

        // Send value to queue
        xQueueSend(sensorQueue, &sensorValue, portMAX_DELAY);

        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

// ── Task 3: Display / Consumer ─────────────────────────────────
void displayTask(void *pvParameters) {
    (void)pvParameters;
    int receivedValue;

    for (;;) {
        // Wait for data from queue
        if (xQueueReceive(sensorQueue, &receivedValue, portMAX_DELAY) == pdPASS) {
            // Take serial mutex before printing
            if (xSemaphoreTake(serialMutex, 100 / portTICK_PERIOD_MS) == pdPASS) {
                Serial.print("[Task3] Received from queue: ");
                Serial.println(receivedValue);
                xSemaphoreGive(serialMutex);
            }
        }
    }
}

// ── Arduino setup() — called once at start ─────────────────────
void setup() {
    Serial.begin(115200);
    delay(1000); // Wait for Serial to stabilize

    Serial.println("=== FreeRTOS Demo Starting ===");

    // Create queue (holds 5 integers)
    sensorQueue = xQueueCreate(5, sizeof(int));
    if (sensorQueue == 0) {
        Serial.println("[ERROR] Failed to create queue!");
        return;
    }
    Serial.println("[OK] Queue created");

    // Create mutex for Serial port
    serialMutex = xSemaphoreCreateMutex();
    if (serialMutex == 0) {
        Serial.println("[ERROR] Failed to create mutex!");
        return;
    }
    Serial.println("[OK] Mutex created");

    // Create tasks
    xTaskCreate(blinkTask,  "Blink",  2048, NULL, 1, NULL);
    xTaskCreate(sensorTask, "Sensor", 2048, NULL, 1, NULL);
    xTaskCreate(displayTask,"Display",2048, NULL, 1, NULL);

    Serial.println("[OK] All tasks created");
    Serial.println("=== FreeRTOS Demo Running ===");
}

// ── Arduino loop() — runs as the main task ─────────────────────
void loop() {
    // In FreeRTOS, loop() runs as the main task.
    // We can do housekeeping or just delay.
    vTaskDelay(1000 / portTICK_PERIOD_MS);
}
