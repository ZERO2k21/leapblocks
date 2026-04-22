/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * NetworkBridge — intercepts ESP32 ROM WiFi/TCP/HTTP calls and
 * fulfils them using the browser's real network stack (fetch + WebSocket).
 */

import { ADDR_TO_HOOK } from './ROMHooks';
import { WASMMemoryHelper } from './WASMMemoryHelper';

// ESP-IDF error codes
const ESP_OK = 0;
const ESP_FAIL = -1;

// WiFi event IDs
const WIFI_EVENT_STA_CONNECTED = 4;
const IP_EVENT_STA_GOT_IP = 0;

interface ActiveSocket {
    fd: number;
    ws: WebSocket | null;
    recvBuffer: Uint8Array[];
    connected: boolean;
}

export interface NetworkBridgeOptions {
    /**
     * URL of your Railway TCP proxy (for MQTT, raw TCP, etc.)
     * e.g. "wss://leapforge-tcp-proxy.railway.app"
     */
    tcpProxyUrl: string;

    /**
     * Simulated IP address assigned to the virtual ESP32.
     * Default: "192.168.1.100"
     */
    simulatedIP?: string;

    /**
     * Called when the firmware logs WiFi events (for the serial monitor tab).
     */
    onWiFiLog?: (msg: string) => void;
}

export class NetworkBridge {
    private mem!: WASMMemoryHelper;
    private exports: any;

    // WiFi state
    private wifiInitialized = false;
    private wifiConnected = false;
    private ssid = '';
    private readonly simulatedIP: string;
    private readonly simulatedMAC = 'DE:AD:BE:EF:12:34';

    // TCP socket table: fd → ActiveSocket
    private sockets = new Map<number, ActiveSocket>();
    private nextFd = 10;

    // HTTP state machine (per-handle)
    private httpHandles = new Map<number, {
        url: string;
        method: string;
        headers: Record<string, string>;
        postData: string;
        response?: { status: number; body: Uint8Array; headers: Record<string, string> };
        readOffset: number;
    }>();
    private nextHttpHandle = 1;

    private tcpProxyUrl: string;
    private onWiFiLog: (msg: string) => void;

    constructor(opts: NetworkBridgeOptions) {
        this.tcpProxyUrl = opts.tcpProxyUrl;
        this.simulatedIP = opts.simulatedIP ?? '192.168.1.100';
        this.onWiFiLog = opts.onWiFiLog ?? (() => { });
    }

    /** Called by ESP32Engine after WASM instantiation */
    init(memory: WebAssembly.Memory, exports: any): void {
        this.mem = new WASMMemoryHelper(memory);
        this.exports = exports;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Main dispatch — called when QEMU PC hits a ROM address
    // registers: Xtensa register file (a2–a5 are function args)
    // Returns: value to place in a2 (return register)
    // ─────────────────────────────────────────────────────────────────────────
    handleROMCall(address: number, a2: number, a3: number, a4: number, a5: number): number {
        const hook = ADDR_TO_HOOK.get(address);
        if (!hook) return 0;

        switch (hook) {
            // ── WiFi ──────────────────────────────────────────────────────
            case 'esp_wifi_init':
                this.wifiInitialized = true;
                this.log('[WiFi] esp_wifi_init — OK');
                return ESP_OK;

            case 'esp_wifi_set_mode':
                this.log(`[WiFi] set_mode(${a2})`);
                return ESP_OK;

            case 'esp_wifi_set_config': {
                // a3 = pointer to wifi_config_t struct; SSID at offset 0
                this.ssid = this.mem.readCString(a3, 32);
                this.log(`[WiFi] set_config SSID="${this.ssid}"`);
                return ESP_OK;
            }

            case 'esp_wifi_start':
                this.log('[WiFi] esp_wifi_start — OK');
                return ESP_OK;

            case 'esp_wifi_connect':
                // Simulate association delay (~300ms), then fire connected + IP events
                setTimeout(() => {
                    this.wifiConnected = true;
                    this.log(`[WiFi] Connected to "${this.ssid}" IP=${this.simulatedIP}`);
                    this.postWiFiEvent(WIFI_EVENT_STA_CONNECTED);
                    setTimeout(() => this.postIPEvent(), 100);
                }, 300);
                return ESP_OK;

            case 'esp_wifi_disconnect':
                this.wifiConnected = false;
                this.log('[WiFi] Disconnected');
                return ESP_OK;

            case 'esp_wifi_get_mac': {
                // a2 = interface (0=STA), a3 = uint8_t[6] output buffer
                const macBytes = this.simulatedMAC.split(':').map(h => parseInt(h, 16));
                this.mem.writeBytes(a3, new Uint8Array(macBytes));
                return ESP_OK;
            }

            case 'esp_wifi_sta_get_ap_info': {
                // Fill wifi_ap_record_t at a2 with dummy AP info
                this.mem.writeCString(a2, this.ssid);  // SSID at offset 0
                this.mem.writeU8(a2 + 33, 196);        // rssi = -60 dBm (as u8 two's complement)
                this.mem.writeU8(a2 + 34, 1);          // channel = 1
                return ESP_OK;
            }

            // ── lwIP sockets ──────────────────────────────────────────────
            case 'lwip_socket': {
                const fd = this.nextFd++;
                this.sockets.set(fd, { fd, ws: null, recvBuffer: [], connected: false });
                return fd;
            }

            case 'lwip_connect': {
                // a2=fd, a3=sockaddr* (host+port), a4=addrlen
                const fd = a2;
                const sock = this.sockets.get(fd);
                if (!sock) return -1;

                // Read sockaddr_in: port at offset 2 (big-endian u16), addr at offset 4
                const portBE = (this.mem.u8(a3 + 2) << 8) | this.mem.u8(a3 + 3);
                const ip = [
                    this.mem.u8(a3 + 4),
                    this.mem.u8(a3 + 5),
                    this.mem.u8(a3 + 6),
                    this.mem.u8(a3 + 7),
                ].join('.');

                this.log(`[TCP] connect fd=${fd} → ${ip}:${portBE}`);

                const ws = new WebSocket(`${this.tcpProxyUrl}?host=${ip}&port=${portBE}`);
                sock.ws = ws;
                ws.binaryType = 'arraybuffer';
                ws.onopen = () => { sock.connected = true; };
                ws.onmessage = (e) => { sock.recvBuffer.push(new Uint8Array(e.data as ArrayBuffer)); };
                ws.onerror = () => { sock.connected = false; };
                ws.onclose = () => { sock.connected = false; };

                return ESP_OK;
            }

            case 'lwip_send': {
                // a2=fd, a3=buf*, a4=len, a5=flags
                const sock = this.sockets.get(a2);
                if (!sock || !sock.ws) return -1;
                sock.ws.send(this.mem.readBytes(a3, a4));
                return a4;
            }

            case 'lwip_recv': {
                // a2=fd, a3=buf*, a4=len, a5=flags
                const sock = this.sockets.get(a2);
                if (!sock) return -1;
                if (sock.recvBuffer.length === 0) return 0; // EAGAIN

                const chunk = sock.recvBuffer.shift()!;
                const toRead = Math.min(chunk.length, a4);
                this.mem.writeBytes(a3, chunk.slice(0, toRead));
                if (chunk.length > toRead) sock.recvBuffer.unshift(chunk.slice(toRead));
                return toRead;
            }

            case 'lwip_close': {
                const sock = this.sockets.get(a2);
                sock?.ws?.close();
                this.sockets.delete(a2);
                return ESP_OK;
            }

            case 'lwip_getaddrinfo': {
                const hostname = this.mem.readCString(a2);
                this.log(`[DNS] getaddrinfo("${hostname}") → proxy handles resolution`);
                return ESP_OK;
            }

            case 'lwip_setsockopt':
            case 'lwip_getsockopt':
            case 'lwip_fcntl':
            case 'lwip_select':
            case 'lwip_bind':
            case 'lwip_listen':
            case 'lwip_accept':
            case 'lwip_freeaddrinfo':
                return ESP_OK;

            // ── HTTP client ───────────────────────────────────────────────
            case 'esp_http_client_init': {
                // a2 = esp_http_client_config_t*; url is a string pointer at offset 0
                const urlPtr = this.mem.u32(a2);
                const url = this.mem.readCString(urlPtr);
                const handle = this.nextHttpHandle++;
                this.httpHandles.set(handle, {
                    url, method: 'GET', headers: {}, postData: '', readOffset: 0,
                });
                this.log(`[HTTP] init handle=${handle} url="${url}"`);
                return handle;
            }

            case 'esp_http_client_set_url': {
                const h = this.httpHandles.get(a2);
                if (h) h.url = this.mem.readCString(a3);
                return ESP_OK;
            }

            case 'esp_http_client_set_method': {
                const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
                const h = this.httpHandles.get(a2);
                if (h) h.method = METHODS[a3] ?? 'GET';
                return ESP_OK;
            }

            case 'esp_http_client_set_header': {
                const h = this.httpHandles.get(a2);
                if (h) {
                    h.headers[this.mem.readCString(a3)] = this.mem.readCString(a4);
                }
                return ESP_OK;
            }

            case 'esp_http_client_set_post_field': {
                const h = this.httpHandles.get(a2);
                if (h) h.postData = new TextDecoder().decode(this.mem.readBytes(a3, a4));
                return ESP_OK;
            }

            case 'esp_http_client_open':
                return ESP_OK;

            case 'esp_http_client_perform': {
                const h = this.httpHandles.get(a2);
                if (!h) return ESP_FAIL;
                this.log(`[HTTP] ${h.method} ${h.url}`);
                this.doHTTPFetch(a2, h.url, h.method, h.headers, h.postData);
                return ESP_OK;
            }

            case 'esp_http_client_read': {
                // a2=handle, a3=buf*, a4=len
                const h = this.httpHandles.get(a2);
                if (!h || !h.response) return -1;
                const { body } = h.response;
                if (h.readOffset >= body.length) return 0; // EOF
                const toRead = Math.min(a4, body.length - h.readOffset);
                this.mem.writeBytes(a3, body.slice(h.readOffset, h.readOffset + toRead));
                h.readOffset += toRead;
                return toRead;
            }

            case 'esp_http_client_get_status_code':
                return this.httpHandles.get(a2)?.response?.status ?? 0;

            case 'esp_http_client_get_content_length':
                return this.httpHandles.get(a2)?.response?.body.length ?? -1;

            case 'esp_http_client_cleanup':
                this.httpHandles.delete(a2);
                return ESP_OK;

            // ── TLS (mbedTLS) — HTTPS is handled by fetch() above ─────────
            case 'mbedtls_ssl_init':
            case 'mbedtls_ssl_handshake':
            case 'mbedtls_net_connect':
            case 'mbedtls_ssl_write':
            case 'mbedtls_ssl_read':
            case 'mbedtls_ssl_close_notify':
            case 'mbedtls_ssl_free':
            case 'mbedtls_net_free':
            case 'mbedtls_net_send':
            case 'mbedtls_net_recv':
                return ESP_OK;

            default:
                return 0;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Real HTTP fetch
    // ─────────────────────────────────────────────────────────────────────────
    private async doHTTPFetch(
        handle: number,
        url: string,
        method: string,
        headers: Record<string, string>,
        body: string
    ): Promise<void> {
        const h = this.httpHandles.get(handle);
        if (!h) return;

        try {
            const res = await fetch(url, {
                method,
                headers,
                body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
            });

            const bodyBytes = new Uint8Array(await res.arrayBuffer());
            const respHeaders: Record<string, string> = {};
            res.headers.forEach((v, k) => { respHeaders[k] = v; });

            h.response = { status: res.status, body: bodyBytes, headers: respHeaders };
            h.readOffset = 0;

            this.log(`[HTTP] ← ${res.status} ${url} (${bodyBytes.length} bytes)`);
            this.exports?.esp32_http_response_ready?.(handle, res.status, bodyBytes.length);
        } catch (err) {
            this.log(`[HTTP] ERROR ${url}: ${err}`);
            h.response = { status: 0, body: new Uint8Array(), headers: {} };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Post WiFi / IP events back into the firmware's event loop
    // ─────────────────────────────────────────────────────────────────────────
    private postWiFiEvent(eventId: number): void {
        this.exports?.esp32_post_wifi_event?.(eventId);
    }

    private postIPEvent(): void {
        const ptr = this.exports?.malloc?.(16) ?? 0;
        if (ptr) {
            const octets = this.simulatedIP.split('.').map(Number);
            octets.forEach((b, i) => this.mem.writeU8(ptr + i, b));
        }
        this.exports?.esp32_post_ip_event?.(IP_EVENT_STA_GOT_IP, ptr);
        this.log(`[WiFi] Got IP: ${this.simulatedIP}`);
    }

    /** Close all open sockets (called on simulation stop) */
    cleanup(): void {
        this.sockets.forEach(s => s.ws?.close());
        this.sockets.clear();
        this.httpHandles.clear();
        this.wifiConnected = false;
        this.wifiInitialized = false;
    }

    private log(msg: string): void {
        console.log('[NetworkBridge]', msg);
        this.onWiFiLog(msg);
    }

    get isConnected(): boolean { return this.wifiConnected; }
    get ipAddress(): string { return this.simulatedIP; }
}
