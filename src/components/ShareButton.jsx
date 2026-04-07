import { useState } from 'react';

/**
 * Share content as text via Web Share API, falling back to clipboard copy.
 * Props:
 *   title   – share dialog title
 *   getText – function (or string) that returns the text to share
 *   style   – optional inline styles
 */
export default function ShareButton({ title, getText, style }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = typeof getText === 'function' ? getText() : getText;
    if (!text) return;

    // Native share sheet (Android / iOS)
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? 'Mama\'s Kitchen', text });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled — don't fall through
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Last resort: prompt
      window.prompt('Copy this text:', text);
    }
  }

  return (
    <button className="btn btn-secondary btn-sm" onClick={handleShare} style={style}>
      {copied ? '✓ Copied!' : '↗ Share'}
    </button>
  );
}
