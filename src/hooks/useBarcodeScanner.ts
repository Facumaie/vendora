import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

/** Lector USB (keyboard wedge): ráfaga rápida de teclas terminada en Enter. */
export function useUsbScanner(onScan: (code: string) => void, enabled = true) {
  const buffer = useRef('');
  const last = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const now = Date.now();
      if (now - last.current > 80) buffer.current = '';
      last.current = now;
      if (e.key === 'Enter') {
        if (buffer.current.length >= 6) onScan(buffer.current);
        buffer.current = '';
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onScan, enabled]);
}

/** Escáner por cámara con ZXing. Devuelve ref de <video>, estado y control. */
export function useCameraScanner(onScan: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const start = async () => {
    setError('');
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E, BarcodeFormat.CODE_128,
      ]);
      const reader = new BrowserMultiFormatReader(hints);
      setActive(true);
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result) onScan(result.getText());
      });
      controlsRef.current = controls;
    } catch (e) {
      setError('No se pudo acceder a la cámara. Verificá los permisos.');
      setActive(false);
    }
  };

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  };

  useEffect(() => () => controlsRef.current?.stop(), []);
  return { videoRef, active, error, start, stop };
}
