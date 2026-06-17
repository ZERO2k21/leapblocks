/**
 * FreeRTOS Cooperative Scheduler for Browser Simulation
 *
 * Simulates FreeRTOS APIs using JavaScript's event loop for cooperative
 * multitasking. This allows Arduino sketches using FreeRTOS primitives
 * (xTaskCreate, semaphores, queues, etc.) to run in the browser.
 *
 * Limitations vs real FreeRTOS:
 * - Cooperative, not preemptive (tasks yield at await points)
 * - No true thread safety (single JS thread)
 * - Timing is approximate (browser timer resolution)
 * - Stack size is unlimited (JS heap)
 *
 * Supported APIs:
 * - Task management: xTaskCreate, vTaskDelete, vTaskDelay, vTaskDelayUntil, vTaskSuspend, vTaskResume
 * - Semaphores: xSemaphoreCreateBinary, xSemaphoreCreateMutex, xSemaphoreCreateCounting
 * - Queues: xQueueCreate, xQueueSend, xQueueReceive, xQueueSendToBack, xQueueSendToFront
 * - Event groups: xEventGroupCreate, xEventGroupSetBits, xEventGroupWaitBits
 * - Task notifications: xTaskNotifyGive, ulTaskNotifyTake
 * - Timers: xTimerCreate, xTimerStart, xTimerStop, xTimerDelete
 * - Utilities: taskYIELD, portMAX_DELAY, pdMS_TO_TICKS
 */

// ─── Constants ──────────────────────────────────────────────────
export const pdTRUE = 1;
export const pdFALSE = 0;
export const pdPASS = 1;
export const pdFAIL = 0;
export const errQUEUE_FULL = 0;
export const errQUEUE_EMPTY = 0;

export const portMAX_DELAY = 0xFFFFFFFF;
export const portTICK_PERIOD_MS = 1;

// Task priority constants
export const tskIDLE_PRIORITY = 0;
export const configMAX_PRIORITIES = 25;

// Event group bits
export const bitsWANT_ALL_BITS = 0xFFFFFFFF;

// Timer constants
export const errQUEUE_BACK = 0;
export const errQUEUE_FRONT = 1;

// Task state
const TASK_STATE_READY = 0;
const TASK_STATE_RUNNING = 1;
const TASK_STATE_BLOCKED = 2;
const TASK_STATE_SUSPENDED = 3;
const TASK_STATE_DELETED = 4;

// ─── Types ──────────────────────────────────────────────────────
type TaskHandle = number;
type QueueHandle = number;
type SemaphoreHandle = number;
type EventGroupHandle = number;
type TimerHandle = number;

interface TaskControlBlock {
    id: TaskHandle;
    name: string;
    function: (params: any) => void | Promise<void>;
    params: any;
    priority: number;
    state: number;
    notifyValue: number;
    notifyClear: number;
    suspendCount: number;
    created: boolean;
}

interface QueueItem {
    data: any;
    priority: number;
}

interface QueueControlBlock {
    id: QueueHandle;
    name: string;
    items: QueueItem[];
    maxLength: number;
    itemSize: number;
    type: number; // 0=queue, 1=binary semaphore, 2=mutex, 3=counting semaphore
    mutexHolder: TaskHandle | null;
    count: number;
    maxCount: number;
}

interface EventGroupControlBlock {
    id: EventGroupHandle;
    bits: number;
}

interface TimerControlBlock {
    id: TimerHandle;
    name: string;
    periodMs: number;
    autoReload: boolean;
    callback: (timer: TimerHandle) => void;
    running: boolean;
    timeoutId: ReturnType<typeof setTimeout> | null;
}

// ─── FreeRTOS Scheduler ─────────────────────────────────────────
export class FreeRTOS {
    private tasks: Map<TaskHandle, TaskControlBlock> = new Map();
    private queues: Map<QueueHandle, QueueControlBlock> = new Map();
    private eventGroups: Map<EventGroupHandle, EventGroupControlBlock> = new Map();
    private timers: Map<TimerHandle, TimerControlBlock> = new Map();

    private nextTaskId: TaskHandle = 1;
    private nextQueueId: QueueHandle = 1;
    private nextEventGroupId: EventGroupHandle = 1;
    private nextTimerId: TimerHandle = 1;

    private currentTask: TaskHandle | null = null;
    private schedulerRunning: boolean = false;
    private taskQueue: TaskHandle[] = []; // Ready queue (sorted by priority)

    // Callbacks into ArduinoRuntime
    private _onSerial: ((text: string) => void) | null = null;
    private _microsFn: (() => number) | null = null;
    private _delayFn: ((ms: number) => Promise<void>) | null = null;
    private _runningFn: (() => boolean) | null = null;

    constructor() {}

    /** Set callbacks to interface with ArduinoRuntime */
    setRuntimeCallbacks(callbacks: {
        onSerial: (text: string) => void;
        micros: () => number;
        delay: (ms: number) => Promise<void>;
        isRunning: () => boolean;
    }): void {
        this._onSerial = callbacks.onSerial;
        this._microsFn = callbacks.micros;
        this._delayFn = callbacks.delay;
        this._runningFn = callbacks.isRunning;
    }

    private log(msg: string): void {
        this._onSerial?.(`[FreeRTOS] ${msg}\n`);
        console.log(`[FreeRTOS] ${msg}`);
    }

    private nowMicros(): number {
        return this._microsFn?.() ?? 0;
    }

    private nowMs(): number {
        return Math.floor(this.nowMicros() / 1000);
    }

    // ─── Task Management ─────────────────────────────────────────

    /**
     * xTaskCreate — Create a new task
     * Returns pdPASS on success, pdFAIL on failure.
     */
    xTaskCreate(
        taskFunction: (params: any) => void | Promise<void>,
        taskName: string,
        _stackSize: number,
        params: any,
        priority: number,
        _taskHandle?: any,
    ): number {
        const id = this.nextTaskId++;
        const tcb: TaskControlBlock = {
            id,
            name: taskName,
            function: taskFunction,
            params,
            priority: Math.max(0, Math.min(configMAX_PRIORITIES - 1, priority)),
            state: TASK_STATE_READY,
            notifyValue: 0,
            notifyClear: 0,
            suspendCount: 0,
            created: true,
        };

        this.tasks.set(id, tcb);
        this.addToReadyQueue(id);
        this.log(`Task "${taskName}" created (id=${id}, priority=${priority})`);
        return pdPASS;
    }

    /**
     * vTaskDelete — Delete a task (or self if null)
     */
    vTaskDelete(taskHandle: TaskHandle | null): void {
        const id = taskHandle ?? this.currentTask;
        if (id === null) return;

        const tcb = this.tasks.get(id);
        if (!tcb) return;

        tcb.state = TASK_STATE_DELETED;
        this.removeFromReadyQueue(id);
        this.tasks.delete(id);
        this.log(`Task "${tcb.name}" deleted`);
    }

    /**
     * vTaskDelay — Delay task for specified ticks
     * In real FreeRTOS this blocks; here we schedule a resume.
     */
    async vTaskDelay(ticksToDelay: number): Promise<void> {
        if (ticksToDelay === 0) {
            // Yield to scheduler
            await this.yield();
            return;
        }

        const delayMs = ticksToDelay * portTICK_PERIOD_MS;
        const taskId = this.currentTask;
        if (taskId === null) return;

        const tcb = this.tasks.get(taskId);
        if (!tcb) return;

        tcb.state = TASK_STATE_BLOCKED;
        this.removeFromReadyQueue(taskId);

        // Schedule resume after delay
        setTimeout(() => {
            if (tcb.state === TASK_STATE_BLOCKED && tcb.created) {
                tcb.state = TASK_STATE_READY;
                this.addToReadyQueue(taskId);
            }
        }, Math.max(1, delayMs));

        await this.yield();
    }

    /**
     * vTaskDelayUntil — Delay until specified tick count (periodic task)
     */
    async vTaskDelayUntil(_previousWakeTime: number, timeIncrement: number): Promise<void> {
        await this.vTaskDelay(timeIncrement);
    }

    /**
     * vTaskSuspend — Suspend a task
     */
    vTaskSuspend(taskHandle: TaskHandle | null): void {
        const id = taskHandle ?? this.currentTask;
        if (id === null) return;

        const tcb = this.tasks.get(id);
        if (!tcb) return;

        tcb.suspendCount++;
        if (tcb.suspendCount > 0) {
            tcb.state = TASK_STATE_SUSPENDED;
            this.removeFromReadyQueue(id);
        }
    }

    /**
     * vTaskResume — Resume a suspended task
     */
    vTaskResume(taskHandle: TaskHandle): void {
        const tcb = this.tasks.get(taskHandle);
        if (!tcb) return;

        if (tcb.suspendCount > 0) {
            tcb.suspendCount--;
        }
        if (tcb.suspendCount === 0 && tcb.state === TASK_STATE_SUSPENDED) {
            tcb.state = TASK_STATE_READY;
            this.addToReadyQueue(taskHandle);
        }
    }

    /**
     * xTaskResumeFromISR — Resume a task from interrupt context (simplified)
     */
    xTaskResumeFromISR(taskHandle: TaskHandle): number {
        this.vTaskResume(taskHandle);
        return pdFALSE;
    }

    /**
     * taskYIELD — Yield to the scheduler
     */
    async yield(): Promise<void> {
        // Yield to the browser event loop
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }

    /**
     * xTaskGetCurrentTaskHandle — Get current task handle
     */
    xTaskGetCurrentTaskHandle(): TaskHandle | null {
        return this.currentTask;
    }

    /**
     * uxTaskPriorityGet — Get task priority
     */
    uxTaskPriorityGet(taskHandle: TaskHandle | null): number {
        const id = taskHandle ?? this.currentTask;
        if (id === null) return 0;
        const tcb = this.tasks.get(id);
        return tcb?.priority ?? 0;
    }

    /**
     * vTaskPrioritySet — Set task priority
     */
    vTaskPrioritySet(taskHandle: TaskHandle, priority: number): void {
        const tcb = this.tasks.get(taskHandle);
        if (!tcb) return;

        tcb.priority = Math.max(0, Math.min(configMAX_PRIORITIES - 1, priority));
        // Re-sort ready queue
        this.sortReadyQueue();
    }

    /**
     * xTaskGetTickCount — Get current tick count
     */
    xTaskGetTickCount(): number {
        return Math.floor(this.nowMs() / portTICK_PERIOD_MS);
    }

    /**
     * xTaskGetTickCountISR — Get tick count from ISR
     */
    xTaskGetTickCountFromISR(): number {
        return this.xTaskGetTickCount();
    }

    // ─── Semaphore / Mutex ───────────────────────────────────────

    /**
     * xSemaphoreCreateBinary — Create a binary semaphore
     */
    xSemaphoreCreateBinary(): SemaphoreHandle {
        const id = this.nextQueueId++;
        const cb: QueueControlBlock = {
            id,
            name: `sem_${id}`,
            items: [],
            maxLength: 1,
            itemSize: 1,
            type: 1, // binary semaphore
            mutexHolder: null,
            count: 0,
            maxCount: 1,
        };
        this.queues.set(id, cb);
        this.log(`Binary semaphore created (id=${id})`);
        return id;
    }

    /**
     * xSemaphoreCreateMutex — Create a mutex
     */
    xSemaphoreCreateMutex(): SemaphoreHandle {
        const id = this.nextQueueId++;
        const cb: QueueControlBlock = {
            id,
            name: `mutex_${id}`,
            items: [],
            maxLength: 1,
            itemSize: 1,
            type: 2, // mutex
            mutexHolder: null,
            count: 1, // Mutex starts "available" (count=1 means free)
            maxCount: 1,
        };
        this.queues.set(id, cb);
        this.log(`Mutex created (id=${id})`);
        return id;
    }

    /**
     * xSemaphoreCreateCounting — Create a counting semaphore
     */
    xSemaphoreCreateCounting(maxCount: number, initialCount: number): SemaphoreHandle {
        const id = this.nextQueueId++;
        const cb: QueueControlBlock = {
            id,
            name: `countsem_${id}`,
            items: [],
            maxLength: maxCount,
            itemSize: 1,
            type: 3, // counting semaphore
            mutexHolder: null,
            count: initialCount,
            maxCount,
        };
        this.queues.set(id, cb);
        this.log(`Counting semaphore created (id=${id}, max=${maxCount}, init=${initialCount})`);
        return id;
    }

    /**
     * xSemaphoreTake — Take (acquire) a semaphore/mutex
     * Returns pdPASS if taken, pdFAIL if timeout.
     */
    async xSemaphoreTake(semaphoreHandle: SemaphoreHandle, timeout: number = 0): Promise<number> {
        const cb = this.queues.get(semaphoreHandle);
        if (!cb) return pdFAIL;

        // Binary semaphore: check if available
        if (cb.type === 1) {
            if (cb.count > 0) {
                cb.count--;
                return pdPASS;
            }
            if (timeout === 0) return pdFAIL; // Non-blocking

            // Wait for it to become available
            const startTime = this.nowMs();
            while (cb.count === 0) {
                if (this._runningFn && !this._runningFn()) return pdFAIL;
                if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                    return pdFAIL;
                }
                await this.yield();
            }
            cb.count--;
            return pdPASS;
        }

        // Mutex: check if available or held by us
        if (cb.type === 2) {
            if (cb.count > 0) {
                cb.count--;
                cb.mutexHolder = this.currentTask;
                return pdPASS;
            }
            // Recursive mutex: same task can take again
            if (cb.mutexHolder === this.currentTask) {
                return pdPASS;
            }
            if (timeout === 0) return pdFAIL;

            // Wait for mutex to be released
            const startTime = this.nowMs();
            while (cb.count === 0) {
                if (this._runningFn && !this._runningFn()) return pdFAIL;
                if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                    return pdFAIL;
                }
                await this.yield();
            }
            cb.count--;
            cb.mutexHolder = this.currentTask;
            return pdPASS;
        }

        // Counting semaphore
        if (cb.type === 3) {
            if (cb.count > 0) {
                cb.count--;
                return pdPASS;
            }
            if (timeout === 0) return pdFAIL;

            const startTime = this.nowMs();
            while (cb.count === 0) {
                if (this._runningFn && !this._runningFn()) return pdFAIL;
                if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                    return pdFAIL;
                }
                await this.yield();
            }
            cb.count--;
            return pdPASS;
        }

        return pdFAIL;
    }

    /**
     * xSemaphoreGive — Give (release) a semaphore/mutex
     */
    xSemaphoreGive(semaphoreHandle: SemaphoreHandle): number {
        const cb = this.queues.get(semaphoreHandle);
        if (!cb) return pdFAIL;

        if (cb.type === 1) {
            // Binary semaphore
            if (cb.count < 1) {
                cb.count++;
                return pdPASS;
            }
            return pdFAIL; // Already given
        }

        if (cb.type === 2) {
            // Mutex
            if (cb.mutexHolder === this.currentTask || cb.mutexHolder === null) {
                cb.count = 1;
                cb.mutexHolder = null;
                return pdPASS;
            }
            return pdFAIL; // Not the holder
        }

        if (cb.type === 3) {
            // Counting semaphore
            if (cb.count < cb.maxCount) {
                cb.count++;
                return pdPASS;
            }
            return pdFAIL; // Already at max
        }

        return pdFAIL;
    }

    /**
     * xSemaphoreGiveFromISR — Give semaphore from interrupt context (simplified)
     */
    xSemaphoreGiveFromISR(semaphoreHandle: SemaphoreHandle): number {
        return this.xSemaphoreGive(semaphoreHandle);
    }

    /**
     * xSemaphoreTakeMutex — Take mutex (alias for xSemaphoreTake with infinite timeout)
     */
    async xSemaphoreTakeMutex(mutexHandle: SemaphoreHandle): Promise<number> {
        return this.xSemaphoreTake(mutexHandle, portMAX_DELAY);
    }

    // ─── Queue ───────────────────────────────────────────────────

    /**
     * xQueueCreate — Create a queue
     */
    xQueueCreate(queueLength: number, itemSize: number): QueueHandle {
        const id = this.nextQueueId++;
        const cb: QueueControlBlock = {
            id,
            name: `queue_${id}`,
            items: [],
            maxLength: queueLength,
            itemSize,
            type: 0, // queue
            mutexHolder: null,
            count: 0,
            maxCount: queueLength,
        };
        this.queues.set(id, cb);
        this.log(`Queue created (id=${id}, length=${queueLength})`);
        return id;
    }

    /**
     * xQueueSend — Send item to queue (back)
     */
    async xQueueSend(queueHandle: QueueHandle, item: any, timeout: number = 0): Promise<number> {
        return this.xQueueSendToBack(queueHandle, item, timeout);
    }

    /**
     * xQueueSendToBack — Send item to back of queue
     */
    async xQueueSendToBack(queueHandle: QueueHandle, item: any, timeout: number = 0): Promise<number> {
        const cb = this.queues.get(queueHandle);
        if (!cb) return pdFAIL;

        if (cb.items.length < cb.maxLength) {
            cb.items.push({ data: item, priority: 0 });
            return pdPASS;
        }

        if (timeout === 0) return pdFAIL;

        // Wait for space
        const startTime = this.nowMs();
        while (cb.items.length >= cb.maxLength) {
            if (this._runningFn && !this._runningFn()) return pdFAIL;
            if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                return pdFAIL;
            }
            await this.yield();
        }

        cb.items.push({ data: item, priority: 0 });
        return pdPASS;
    }

    /**
     * xQueueSendToFront — Send item to front of queue
     */
    async xQueueSendToFront(queueHandle: QueueHandle, item: any, timeout: number = 0): Promise<number> {
        const cb = this.queues.get(queueHandle);
        if (!cb) return pdFAIL;

        if (cb.items.length < cb.maxLength) {
            cb.items.unshift({ data: item, priority: 0 });
            return pdPASS;
        }

        if (timeout === 0) return pdFAIL;

        const startTime = this.nowMs();
        while (cb.items.length >= cb.maxLength) {
            if (this._runningFn && !this._runningFn()) return pdFAIL;
            if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                return pdFAIL;
            }
            await this.yield();
        }

        cb.items.unshift({ data: item, priority: 0 });
        return pdPASS;
    }

    /**
     * xQueueReceive — Receive item from queue
     */
    async xQueueReceive(queueHandle: QueueHandle, timeout: number = 0): Promise<any> {
        const cb = this.queues.get(queueHandle);
        if (!cb) return null;

        if (cb.items.length > 0) {
            return cb.items.shift()!.data;
        }

        if (timeout === 0) return null;

        const startTime = this.nowMs();
        while (cb.items.length === 0) {
            if (this._runningFn && !this._runningFn()) return null;
            if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                return null;
            }
            await this.yield();
        }

        return cb.items.shift()!.data;
    }

    /**
     * xQueuePeek — Peek at front item without removing
     */
    async xQueuePeek(queueHandle: QueueHandle, timeout: number = 0): Promise<any> {
        const cb = this.queues.get(queueHandle);
        if (!cb) return null;

        if (cb.items.length > 0) {
            return cb.items[0].data;
        }

        if (timeout === 0) return null;

        const startTime = this.nowMs();
        while (cb.items.length === 0) {
            if (this._runningFn && !this._runningFn()) return null;
            if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                return null;
            }
            await this.yield();
        }

        return cb.items[0].data;
    }

    /**
     * xQueueMessagesWaiting — Get number of messages in queue
     */
    xQueueMessagesWaiting(queueHandle: QueueHandle): number {
        const cb = this.queues.get(queueHandle);
        return cb?.items.length ?? 0;
    }

    /**
     * xQueueSendToBackFromISR — ISR-safe send to back
     */
    xQueueSendToBackFromISR(queueHandle: QueueHandle, item: any): number {
        const cb = this.queues.get(queueHandle);
        if (!cb) return pdFAIL;
        if (cb.items.length >= cb.maxLength) return pdFAIL;
        cb.items.push({ data: item, priority: 0 });
        return pdPASS;
    }

    /**
     * xQueueSendToFrontFromISR — ISR-safe send to front
     */
    xQueueSendToFrontFromISR(queueHandle: QueueHandle, item: any): number {
        const cb = this.queues.get(queueHandle);
        if (!cb) return pdFAIL;
        if (cb.items.length >= cb.maxLength) return pdFAIL;
        cb.items.unshift({ data: item, priority: 0 });
        return pdPASS;
    }

    /**
     * xQueueReceiveFromISR — ISR-safe receive
     */
    xQueueReceiveFromISR(queueHandle: QueueHandle): any {
        const cb = this.queues.get(queueHandle);
        if (!cb || cb.items.length === 0) return null;
        return cb.items.shift()!.data;
    }

    // ─── Event Groups ────────────────────────────────────────────

    /**
     * xEventGroupCreate — Create an event group
     */
    xEventGroupCreate(): EventGroupHandle {
        const id = this.nextEventGroupId++;
        const cb: EventGroupControlBlock = { id, bits: 0 };
        this.eventGroups.set(id, cb);
        this.log(`Event group created (id=${id})`);
        return id;
    }

    /**
     * xEventGroupSetBits — Set bits in event group
     */
    xEventGroupSetBits(eventGroup: EventGroupHandle, bitsToSet: number): number {
        const cb = this.eventGroups.get(eventGroup);
        if (!cb) return pdFAIL;
        cb.bits |= bitsToSet;
        return pdPASS;
    }

    /**
     * xEventGroupClearBits — Clear bits in event group
     */
    xEventGroupClearBits(eventGroup: EventGroupHandle, bitsToClear: number): number {
        const cb = this.eventGroups.get(eventGroup);
        if (!cb) return pdFAIL;
        cb.bits &= ~bitsToClear;
        return pdPASS;
    }

    /**
     * xEventGroupWaitBits — Wait for bits in event group
     */
    async xEventGroupWaitBits(
        eventGroup: EventGroupHandle,
        bitsToWaitFor: number,
        clearOnExit: boolean,
        waitAllBits: boolean,
        timeout: number = portMAX_DELAY,
    ): Promise<number> {
        const cb = this.eventGroups.get(eventGroup);
        if (!cb) return 0;

        const startTime = this.nowMs();

        while (true) {
            if (waitAllBits) {
                if ((cb.bits & bitsToWaitFor) === bitsToWaitFor) break;
            } else {
                if ((cb.bits & bitsToWaitFor) !== 0) break;
            }

            if (this._runningFn && !this._runningFn()) return 0;
            if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                break; // Timeout
            }

            await this.yield();
        }

        const result = cb.bits & bitsToWaitFor;
        if (clearOnExit) {
            cb.bits &= ~bitsToWaitFor;
        }
        return result;
    }

    /**
     * xEventGroupGetBits — Get current event group bits
     */
    xEventGroupGetBits(eventGroup: EventGroupHandle): number {
        const cb = this.eventGroups.get(eventGroup);
        return cb?.bits ?? 0;
    }

    // ─── Task Notifications ──────────────────────────────────────

    /**
     * xTaskNotifyGive — Send notification to task (increment counter)
     */
    xTaskNotifyGive(taskHandle: TaskHandle): void {
        const tcb = this.tasks.get(taskHandle);
        if (!tcb) return;
        tcb.notifyValue++;
    }

    /**
     * ulTaskNotifyTake — Take notification (clear or decrement)
     * clearOnExit: pdTRUE = clear to 0, pdFALSE = decrement
     */
    async ulTaskNotifyTake(clearOnExit: boolean, timeout: number = 0): Promise<number> {
        const taskId = this.currentTask;
        if (taskId === null) return 0;

        const tcb = this.tasks.get(taskId);
        if (!tcb) return 0;

        if (tcb.notifyValue > 0) {
            const val = tcb.notifyValue;
            if (clearOnExit) {
                tcb.notifyValue = 0;
            } else {
                tcb.notifyValue--;
            }
            return val;
        }

        if (timeout === 0) return 0;

        // Wait for notification with timeout
        const startTime = this.nowMs();
        while (tcb.notifyValue === 0) {
            if (this._runningFn && !this._runningFn()) return 0;
            if (timeout !== portMAX_DELAY && this.nowMs() - startTime >= timeout) {
                return 0;
            }
            await this.yield();
        }

        const val = tcb.notifyValue;
        if (clearOnExit) {
            tcb.notifyValue = 0;
        } else {
            tcb.notifyValue--;
        }
        return val;
    }

    /**
     * xTaskNotify — Send notification with specific action
     */
    xTaskNotify(taskHandle: TaskHandle, value: number, action: number = 0): number {
        const tcb = this.tasks.get(taskHandle);
        if (!tcb) return pdFAIL;

        switch (action) {
            case 0: // eNoAction — just set value
                tcb.notifyValue = value;
                break;
            case 1: // eSetBits
                tcb.notifyValue |= value;
                break;
            case 2: // eIncrement
                tcb.notifyValue++;
                break;
            case 3: // eSetValueWithOverwrite
                tcb.notifyValue = value;
                break;
            case 4: // eSetValueWithoutOverwrite
                if (tcb.notifyValue === 0) {
                    tcb.notifyValue = value;
                }
                break;
        }

        return pdPASS;
    }

    // ─── Software Timers ─────────────────────────────────────────

    /**
     * xTimerCreate — Create a software timer
     */
    xTimerCreate(
        timerName: string,
        periodMs: number,
        autoReload: boolean,
        _timerID: any,
        callback: (timer: TimerHandle) => void,
    ): TimerHandle {
        const id = this.nextTimerId++;
        const cb: TimerControlBlock = {
            id,
            name: timerName,
            periodMs,
            autoReload,
            callback,
            running: false,
            timeoutId: null,
        };
        this.timers.set(id, cb);
        this.log(`Timer "${timerName}" created (id=${id}, period=${periodMs}ms)`);
        return id;
    }

    /**
     * xTimerStart — Start a timer
     */
    xTimerStart(timerHandle: TimerHandle, _timeout: number = 0): number {
        const cb = this.timers.get(timerHandle);
        if (!cb) return pdFAIL;

        if (cb.running) return pdPASS;

        cb.running = true;
        this.startTimer(cb);
        return pdPASS;
    }

    /**
     * xTimerStop — Stop a timer
     */
    xTimerStop(timerHandle: TimerHandle, _timeout: number = 0): number {
        const cb = this.timers.get(timerHandle);
        if (!cb) return pdFAIL;

        cb.running = false;
        if (cb.timeoutId !== null) {
            clearTimeout(cb.timeoutId);
            cb.timeoutId = null;
        }
        return pdPASS;
    }

    /**
     * xTimerDelete — Delete a timer
     */
    xTimerDelete(timerHandle: TimerHandle, _timeout: number = 0): number {
        const cb = this.timers.get(timerHandle);
        if (!cb) return pdFAIL;

        cb.running = false;
        if (cb.timeoutId !== null) {
            clearTimeout(cb.timeoutId);
        }
        this.timers.delete(timerHandle);
        return pdPASS;
    }

    /**
     * xTimerChangePeriod — Change timer period
     */
    xTimerChangePeriod(timerHandle: TimerHandle, periodMs: number, _timeout: number = 0): number {
        const cb = this.timers.get(timerHandle);
        if (!cb) return pdFAIL;

        cb.periodMs = periodMs;
        if (cb.running) {
            if (cb.timeoutId !== null) clearTimeout(cb.timeoutId);
            this.startTimer(cb);
        }
        return pdPASS;
    }

    /**
     * xTimerReset — Reset a timer
     */
    xTimerReset(timerHandle: TimerHandle, _timeout: number = 0): number {
        const cb = this.timers.get(timerHandle);
        if (!cb) return pdFAIL;

        if (cb.running) {
            if (cb.timeoutId !== null) clearTimeout(cb.timeoutId);
            this.startTimer(cb);
        }
        return pdPASS;
    }

    private startTimer(cb: TimerControlBlock): void {
        cb.timeoutId = setTimeout(() => {
            if (!cb.running) return;
            try {
                cb.callback(cb.id);
            } catch (e) {
                console.error(`[FreeRTOS] Timer "${cb.name}" callback error:`, e);
            }
            if (cb.autoReload && cb.running) {
                this.startTimer(cb);
            } else {
                cb.running = false;
            }
        }, cb.periodMs);
    }

    // ─── Scheduler Control ───────────────────────────────────────

    /**
     * vTaskSuspendAll — Suspend the scheduler (prevent context switches)
     */
    vTaskSuspendAll(): void {
        this.schedulerRunning = false;
    }

    /**
     * xTaskResumeAll — Resume the scheduler
     */
    async xTaskResumeAll(): Promise<number> {
        this.schedulerRunning = true;
        return pdPASS;
    }

    /**
     * xTaskGetSchedulerState — Get scheduler state
     */
    xTaskGetSchedulerState(): number {
        if (!this.schedulerRunning) return 0; // taskSCHEDULER_SUSPENDED
        if (this.currentTask !== null) return 1; // taskSCHEDULER_RUNNING
        return 2; // taskSCHEDULER_NOT_STARTED
    }

    // ─── Internal Helpers ────────────────────────────────────────

    private addToReadyQueue(taskId: TaskHandle): void {
        if (!this.taskQueue.includes(taskId)) {
            this.taskQueue.push(taskId);
            this.sortReadyQueue();
        }
    }

    private removeFromReadyQueue(taskId: TaskHandle): void {
        const idx = this.taskQueue.indexOf(taskId);
        if (idx !== -1) {
            this.taskQueue.splice(idx, 1);
        }
    }

    private sortReadyQueue(): void {
        this.taskQueue.sort((a, b) => {
            const tcbA = this.tasks.get(a);
            const tcbB = this.tasks.get(b);
            return (tcbB?.priority ?? 0) - (tcbA?.priority ?? 0);
        });
    }

    /**
     * Get the next task to run (highest priority ready task)
     */
    private getNextTask(): TaskHandle | null {
        for (const taskId of this.taskQueue) {
            const tcb = this.tasks.get(taskId);
            if (tcb && tcb.state === TASK_STATE_READY) {
                return taskId;
            }
        }
        return null;
    }

    // ─── Cleanup ─────────────────────────────────────────────────

    /**
     * Stop all timers and clear all state
     */
    destroy(): void {
        for (const cb of this.timers.values()) {
            if (cb.timeoutId !== null) {
                clearTimeout(cb.timeoutId);
            }
        }
        this.tasks.clear();
        this.queues.clear();
        this.eventGroups.clear();
        this.timers.clear();
        this.taskQueue = [];
        this.currentTask = null;
        this.schedulerRunning = false;
    }
}
