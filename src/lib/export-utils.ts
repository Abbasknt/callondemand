'use client';

/**
 * @fileOverview Utility functions for production data exports and receipt sharing.
 */

/**
 * Generates and triggers a download for a CSV file.
 * Supports both exportToCsv(filename, rows) and exportToCsv(rows, filename).
 */
export function exportToCsv(arg1: string | any[], arg2: string | any[]) {
  const filename = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : 'export.csv');
  const rows = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);

  if (!rows || !rows.length) return;

  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Triggers a specialized print view for digital receipts.
 * On most modern browsers/mobile devices, this allows "Save as PDF".
 */
export function triggerReceiptPrint() {
  if (typeof window !== 'undefined') {
    window.focus();
    window.print();
  }
}

/**
 * Uses the Web Share API to share transaction details if available.
 * Enhanced to include a more professional text summary.
 */
export async function shareReceipt(details: { title: string, text: string }) {
  const shareData = {
    title: details.title,
    text: details.text,
    url: window.location.origin
  };

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      console.log('Native sharing cancelled or failed', e);
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(details.text);
      alert('Transaction details copied to clipboard! You can now paste them in any app.');
    } catch (e) {
      console.error('Copy to clipboard failed', e);
    }
  }
}
