import { useState } from 'react';
import { lookupBarcode } from '../../services/openFoodFacts';

/**
 * Simple barcode scanner using the device camera via an <input type="file">.
 * For production, could integrate html5-qrcode or ZXing-js.
 * This lightweight version uses the camera capture attribute + BarcodeDetector API.
 */
export default function BarcodeScanner({ onResult, onError }) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus]     = useState('');

  async function handleCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setStatus('Reading barcode…');

    try {
      // Try BarcodeDetector API first (Chrome on Android)
      if ('BarcodeDetector' in window) {
        const img = await createImageBitmap(file);
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
        const codes = await detector.detect(img);
        if (codes.length > 0) {
          await lookup(codes[0].rawValue);
          return;
        }
      }
      // Fallback: prompt user to enter barcode manually
      setStatus('');
      setScanning(false);
      onError?.('Could not detect barcode automatically. Try entering it manually.');
    } catch (err) {
      setStatus('');
      setScanning(false);
      onError?.(err.message ?? 'Barcode scan failed');
    }
  }

  async function handleManual(barcode) {
    if (!barcode?.trim()) return;
    setScanning(true);
    setStatus('Looking up product…');
    await lookup(barcode.trim());
  }

  async function lookup(barcode) {
    try {
      setStatus('Looking up product…');
      const product = await lookupBarcode(barcode);
      onResult(product);
    } catch (err) {
      onError?.(err.message ?? 'Product not found');
    } finally {
      setScanning(false);
      setStatus('');
    }
  }

  const [manualBarcode, setManualBarcode] = useState('');

  return (
    <div className="barcode-scanner">
      <div className="barcode-capture-row">
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          📷 Scan Barcode
          <input
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleCapture}
          />
        </label>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>or enter manually:</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          type="text"
          inputMode="numeric"
          placeholder="Barcode number…"
          value={manualBarcode}
          onChange={e => setManualBarcode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleManual(manualBarcode)}
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleManual(manualBarcode)}
          disabled={scanning || !manualBarcode}
        >
          {scanning ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🔍'}
        </button>
      </div>
      {status && <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{status}</p>}
    </div>
  );
}
