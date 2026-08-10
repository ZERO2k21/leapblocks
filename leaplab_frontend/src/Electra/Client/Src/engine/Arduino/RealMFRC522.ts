/**
 * RealMFRC522 — Simulated MFRC522 RFID library for Electra.
 *
 * Uses a STATIC shared card state so the instance created by user sketch code
 * and the CircuitEngine can communicate. CircuitEngine calls static methods
 * to update card state; user sketch instances read from the same static state.
 */
import { useForgeStore } from '../../../utlis/store/useForgeStore';

/** PICC types */
export const PICC_TYPE_UNKNOWN   = 0x00;
export const PICC_TYPE_MIFARE_1K = 0x08;
export const PICC_TYPE_MIFARE_4K = 0x18;
export const PICC_TYPE_MIFARE_UL = 0x00;
export const PICC_TYPE_TNP3XXX   = 0x01;

/**
 * RealMFRC522 — Drop-in replacement for the MFRC522 Arduino library.
 * All instances share the same static card state.
 */
export class RealMFRC522 {
  // ── Static shared card state ────────────────────────────────────────────
  // CircuitEngine updates these via static methods.
  // All instances (created by user sketch) read from these.
  private static _cardPresent = false;
  private static _uid: number[] = [];
  private static _cardName = '';
  private static _cardType = PICC_TYPE_MIFARE_1K;
  private static _newCard = false;

  // Track all created instances so CircuitEngine can update them
  private static _allInstances: RealMFRC522[] = [];

  // Per-instance uid sub-object (each MFRC522 instance has its own uid accessor)
  public uid = {
    size: 0,
    uidByte: [] as number[],
  };

  private _ssPin: number;
  private _rstPin: number;

  constructor(ssPin: number = 10, rstPin: number = 9) {
    this._ssPin = ssPin;
    this._rstPin = rstPin;
    RealMFRC522._allInstances.push(this);
    console.log(`[MFRC522] Instance created — SS=${ssPin}, RST=${rstPin}`);
  }

  // ── Static methods called by CircuitEngine ─────────────────────────────

  /** Present a card — called by CircuitEngine when user clicks "PRESENT CARD" */
  static presentCard(uid: number[], cardName: string, cardType: number = PICC_TYPE_MIFARE_1K) {
    RealMFRC522._cardPresent = true;
    RealMFRC522._uid = [...uid];
    RealMFRC522._cardName = cardName;
    RealMFRC522._cardType = cardType;
    RealMFRC522._newCard = true;
    console.log(`[MFRC522] Card presented: ${cardName} UID=${uid.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
  }

  /** Remove card — called by CircuitEngine when user clicks "REMOVE CARD" */
  static removeCard() {
    RealMFRC522._cardPresent = false;
    RealMFRC522._uid = [];
    RealMFRC522._cardName = '';
    RealMFRC522._newCard = false;
    console.log('[MFRC522] Card removed');
  }

  /** Check if any card is present */
  static isCardPresent(): boolean {
    return RealMFRC522._cardPresent;
  }

  /** Get the current UID */
  static getUid(): number[] {
    return [...RealMFRC522._uid];
  }

  // ── Arduino MFRC522 Library API (instance methods) ─────────────────────

  PCD_Init(): void {
    console.log(`[MFRC522] PCD_Init() — SS=${this._ssPin}, RST=${this._rstPin}`);
  }

  PCD_Reset(): void {}

  PCD_ReadRegister(_reg: number): number {
    return 0x92;
  }

  PICC_IsNewCardPresent(): boolean {
    return RealMFRC522._newCard && RealMFRC522._cardPresent;
  }

  PICC_ReadCardSerial(): boolean {
    if (!RealMFRC522._cardPresent || RealMFRC522._uid.length === 0) {
      return false;
    }
    RealMFRC522._newCard = false;
    this.uid.uidByte = [...RealMFRC522._uid];
    this.uid.size = RealMFRC522._uid.length;
    return true;
  }

  PICC_HaltA(): void {
    RealMFRC522._newCard = false;
  }

  PICC_GetType(_piccType?: number): number {
    return RealMFRC522._cardType;
  }

  PICC_GetTypeName(piccType: number): string {
    switch (piccType) {
      case PICC_TYPE_MIFARE_1K:  return 'MIFARE 1K';
      case PICC_TYPE_MIFARE_4K:  return 'MIFARE 4K';
      case PICC_TYPE_MIFARE_UL:  return 'MIFARE Ultralight';
      case PICC_TYPE_TNP3XXX:    return 'Not complete';
      default:                   return 'Unknown';
    }
  }

  PCD_GetVersionName(_version: number): string {
    return 'MFRC522 v2.0';
  }

  PICC_DumpToSerial(): void {
    if (!RealMFRC522._cardPresent) {
      console.log('[MFRC522] No card present');
      return;
    }
    console.log(`[MFRC522] Card: ${RealMFRC522._cardName}`);
    console.log(`[MFRC522] UID: ${RealMFRC522._uid.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}`);
    console.log(`[MFRC522] Type: ${this.PICC_GetTypeName(RealMFRC522._cardType)}`);
  }

  PICC_DumpDetailsToSerial(): void {
    this.PICC_DumpToSerial();
  }

  PICC_DumpMifareClassicToSerial(_sectorCount: number, _keyA: number[], _keyB: number[]): void {
    console.log('[MFRC522] MIFARE Classic dump (simulated)');
  }

  PCD_Authenticate(_command: number, _blockAddr: number, _key: number[], _uid: any): boolean {
    return RealMFRC522._cardPresent;
  }

  MIFARE_Read(blockAddr: number, _buffer: Uint8Array, _bufferSize: number): boolean {
    if (!RealMFRC522._cardPresent) return false;
    console.log(`[MFRC522] MIFARE_Read block ${blockAddr} (simulated)`);
    return true;
  }

  MIFARE_Write(blockAddr: number, _data: Uint8Array, _dataSize: number): boolean {
    if (!RealMFRC522._cardPresent) return false;
    console.log(`[MFRC522] MIFARE_Write block ${blockAddr} (simulated)`);
    return true;
  }

  MIFARE_DumpClassic1K(_keyA: number[], _uid?: any): boolean {
    if (!RealMFRC522._cardPresent) return false;
    console.log('[MFRC522] MIFARE_DumpClassic1K (simulated)');
    return true;
  }

  PCD_StopCrypto1(): void {}

  PCD_CalculateCRC(_data: Uint8Array, _length: number, _result: Uint8Array): boolean {
    return true;
  }

  PICC_GetUid(): { size: number; uidByte: number[] } {
    return { size: this.uid.size, uidByte: [...this.uid.uidByte] };
  }
}
