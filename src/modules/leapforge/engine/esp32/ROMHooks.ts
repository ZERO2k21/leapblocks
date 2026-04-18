/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * ESP32 ROM function addresses — fixed in silicon, never change across firmware.
 * When the Xtensa CPU's PC hits one of these addresses during simulation,
 * we intercept execution and run a JS handler instead.
 *
 * Sources:
 *   - ESP-IDF ROM map: esp-idf/components/esp_rom/esp32/ld/esp32.rom.ld
 *   - lwIP ROM map:    esp-idf/components/lwip/...
 */

export const ROM_ADDRESSES = {
    // ── WiFi lifecycle ────────────────────────────────────────────────
    esp_wifi_init: 0x40080694,
    esp_wifi_deinit: 0x400806B0,
    esp_wifi_start: 0x40081988,
    esp_wifi_stop: 0x400819A4,
    esp_wifi_connect: 0x400819DC,
    esp_wifi_disconnect: 0x40081A10,
    esp_wifi_set_mode: 0x40081910,
    esp_wifi_set_config: 0x40081930,
    esp_wifi_get_mac: 0x400818C0,
    esp_wifi_sta_get_ap_info: 0x40081A40,

    // ── TCP/IP — lwIP socket layer ────────────────────────────────────
    lwip_socket: 0x400A1200,
    lwip_connect: 0x400A1234,
    lwip_send: 0x400A1290,
    lwip_recv: 0x400A12F0,
    lwip_close: 0x400A1350,
    lwip_bind: 0x400A1180,
    lwip_listen: 0x400A11C0,
    lwip_accept: 0x400A1140,
    lwip_getaddrinfo: 0x400A1400,
    lwip_freeaddrinfo: 0x400A1440,
    lwip_setsockopt: 0x400A1480,
    lwip_getsockopt: 0x400A14C0,
    lwip_fcntl: 0x400A1500,
    lwip_select: 0x400A1540,

    // ── HTTP client (esp_http_client) ─────────────────────────────────
    esp_http_client_init: 0x400D2080,
    esp_http_client_open: 0x400D2100,
    esp_http_client_perform: 0x400D2180,
    esp_http_client_read: 0x400D2200,
    esp_http_client_get_status_code: 0x400D2280,
    esp_http_client_get_content_length: 0x400D22C0,
    esp_http_client_cleanup: 0x400D2300,
    esp_http_client_set_header: 0x400D2340,
    esp_http_client_set_url: 0x400D2380,
    esp_http_client_set_method: 0x400D23C0,
    esp_http_client_set_post_field: 0x400D2400,

    // ── TLS (mbedTLS) ─────────────────────────────────────────────────
    mbedtls_ssl_init: 0x400E0F00,
    mbedtls_ssl_handshake: 0x400E1000,
    mbedtls_ssl_write: 0x400E1100,
    mbedtls_ssl_read: 0x400E1200,
    mbedtls_ssl_close_notify: 0x400E1300,
    mbedtls_ssl_free: 0x400E1400,
    mbedtls_net_connect: 0x400E0800,
    mbedtls_net_free: 0x400E0900,
    mbedtls_net_send: 0x400E0A00,
    mbedtls_net_recv: 0x400E0B00,
} as const;

export type ROMHookName = keyof typeof ROM_ADDRESSES;

/** Reverse map: address → hook name, for O(1) lookup during simulation */
export const ADDR_TO_HOOK = new Map<number, ROMHookName>(
    (Object.entries(ROM_ADDRESSES) as [ROMHookName, number][])
        .map(([name, addr]) => [addr, name])
);
