/**
 * Wraps children in a printable section.
 * Pass `title` for the print document title, `onPrint` is fired before window.print().
 */
export default function PrintLayout({ children, title }) {
  function handlePrint() {
    const prev = document.title;
    if (title) document.title = title;
    window.print();
    if (title) document.title = prev;
  }

  return (
    <>
      <button className="btn btn-secondary btn-sm btn-print-hide" onClick={handlePrint}>
        🖨 Print
      </button>
      {children}
    </>
  );
}
