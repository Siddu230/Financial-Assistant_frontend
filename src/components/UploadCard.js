// frontend/src/components/UploadCard.js
import React, { useState } from 'react';
import API from '../api';

/**
 * UploadCard
 * - Uploads file to backend (/api/upload/receipt)
 * - Shows extracted text preview and parsed transaction list
 * - Saves parsed transactions to /api/transactions
 *
 * Expects optional prop onSaved(): called after successful save to refresh parent list.
 */
export default function UploadCard({ onSaved }) {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [parsed, setParsed] = useState([]); // array of lines or objects returned by backend
  const [message, setMessage] = useState('');

  // Upload file and call backend OCR/parser endpoint
  async function handleUploadAndProcess(e) {
    e && e.preventDefault();
    setMessage('');
    setParsed([]);
    setExtractedText('');
    if (!file) {
      setMessage('Choose a file first.');
      return;
    }

    setProcessing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await API.post('/upload/receipt', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });

      // expecting { text: '...', parsed: [...] }
      const { text, parsed: backendParsed } = res.data || {};
      setExtractedText(text || '');
      setParsed(Array.isArray(backendParsed) ? backendParsed : (text ? text.split(/\r?\n/).filter(Boolean) : []));
      setMessage('Processed. Review parsed preview below.');
    } catch (err) {
      console.error('Upload/process error', err);
      setMessage(err?.response?.data?.message || 'Upload or processing failed. Check console.');
    } finally {
      setProcessing(false);
    }
  }

  // Improved parsing + saving
  async function handleSaveParsed() {
    setMessage('');
    if (!parsed || parsed.length === 0) {
      setMessage('No parsed transactions to save.');
      return;
    }

    // Helper: determine if a line is obviously non-transaction (header, footer, separator)
    const isNoiseLine = (line) => {
      if (!line) return true;
      const lower = line.toLowerCase();
      const noiseWords = [
        'bank', 'account holder', 'account number', 'statement period', 'opening balance',
        'closing balance', 'balance', 'date description', 'debit credit', '---', 'page'
      ];
      // if line too short
      if (line.trim().length < 3) return true;
      // contains any noise phrases
      for (const w of noiseWords) {
        if (lower.includes(w)) return true;
      }
      // if line mostly non-digit/non-letter (like table separators)
      const alphaNumCount = (line.match(/[A-Za-z0-9]/g) || []).length;
      if (alphaNumCount / Math.max(1, line.length) < 0.2) return true;
      return false;
    };

    // Normalize backend parsed items into array of strings
    const parsedLines = parsed.map(p => (typeof p === 'object' ? (p.description || JSON.stringify(p)) : String(p)));

    // Heuristic parse for each meaningful line
    const cleaned = parsedLines
      .map(l => l.trim())
      .filter(l => !isNoiseLine(l))
      .filter(Boolean);

    if (cleaned.length === 0) {
      setMessage('No valid transaction lines detected after filtering headers/footers.');
      return;
    }

    // Parse a single line into transaction object
    function parseLineToTx(line) {
      const lower = line.toLowerCase();

      // Income indicator words
      const incomeWords = ['credit', 'deposit', 'salary', 'interest', 'refund', 'cashback', 'received'];
      const isIncomeWord = incomeWords.some(w => lower.includes(w));

      // Extract all numbers (could be date-like or amounts). We'll use money-like numbers with decimals.
      // Matches 1,234.56 or 1234.56 or 1000 or 1000.00
      const numMatches = line.match(/(\d{1,3}(?:[,\d]*)(?:\.\d{1,2})?)/g) || [];

      // Strategy for amount:
      let amount = 0;
      if (numMatches.length > 0) {
        // Convert matches to numbers (strip commas)
        const numbers = numMatches.map(s => Number(s.replace(/,/g, '')));
        if (isIncomeWord && numbers.length >= 2) {
          amount = numbers[numbers.length - 2];
        } else if (numbers.length >= 2) {
          amount = numbers[0];
        } else {
          amount = numbers[0];
        }
      }

      if (!amount || isNaN(amount)) amount = 0;

      // Determine type using improved heuristic: keywords OR pattern of Credit value position
      const type = isIncomeWord ? 'income' : 'expense';

      // Extract date if present (formats: 01-Jul-25, 01/07/2025, 2025-07-01, etc)
      let dateIso = new Date().toISOString();
      const dateMatch = line.match(/(\d{1,2}[\/-][A-Za-z]{3}[\/-]\d{2,4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const ds = dateMatch[0].replace(/\s+/g, '-');
        const parsedDate = new Date(ds);
        if (!isNaN(parsedDate.getTime())) dateIso = parsedDate.toISOString();
      }

      // Category: take short snippet of description between date and numbers
      let desc = line;
      if (dateMatch) desc = desc.replace(dateMatch[0], '');
      // remove number tokens
      desc = desc.replace(/(\d{1,3}(?:[,\d]*)(?:\.\d{1,2})?)/g, ' ');
      // replace separators (use RegExp constructor to avoid escaping issues in literal)
      desc = desc.replace(new RegExp('[-_/]+', 'g'), ' ').replace(/\s+/g, ' ').trim();

      let category = 'auto';
      if (desc) {
        const parts = desc.split(/\s+/).filter(Boolean);
        category = (parts.slice(0, 2).join(' ') || 'auto').substring(0, 40);
      }

      return {
        amount: Number(amount),
        type,
        category,
        date: dateIso,
        description: line
      };
    }

    // Convert cleaned lines to txs
    const txs = cleaned.map(parseLineToTx)
      .filter(tx => tx.amount && !isNaN(tx.amount) && tx.amount > 0 && tx.type);

    if (txs.length === 0) {
      setMessage('No valid transaction amounts found to save.');
      return;
    }

    // Save to backend (parallel)
    setProcessing(true);
    setMessage('Saving parsed transactions...');
    try {
      const saves = txs.map(item => API.post('/transactions', item));
      const results = await Promise.allSettled(saves);

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        console.error('Some saves failed', failed);
        setMessage(`Saved ${succeeded} of ${txs.length}. See console for errors.`);
      } else {
        setMessage(`Saved ${succeeded} transactions.`);
      }

      // Callback to parent (dashboard) to refresh list
      if (onSaved) onSaved();

    } catch (err) {
      console.error('Save parsed error', err);
      setMessage(err?.response?.data?.message || 'Save failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="card">
      <h3>Upload a Receipt / Bank Statement</h3>
      <div style={{marginBottom:8, color:'#cbd5e1'}}>Upload an image or PDF to automatically create transactions.</div>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            setFile(e.target.files && e.target.files[0]);
            setExtractedText('');
            setParsed([]);
            setMessage('');
          }}
        />
        <button className="btn" onClick={handleUploadAndProcess} disabled={processing}>
          {processing ? 'Processing...' : 'Upload and Process'}
        </button>
      </div>

      {message && <div style={{marginTop:8, color: message.toLowerCase().includes('failed') ? 'tomato' : '#a5f3fc'}}>{message}</div>}

      {extractedText && (
        <>
          <h4 style={{marginTop:18}}>Extracted text (preview)</h4>
          <div style={{background:'#0f1724', padding:12, borderRadius:8, color:'#e6eef6', maxHeight:220, overflow:'auto', fontFamily:'monospace', fontSize:13}}>
            <pre style={{whiteSpace:'pre-wrap', margin:0}}>{extractedText}</pre>
          </div>
        </>
      )}

      {parsed && parsed.length > 0 && (
        <>
          <h4 style={{marginTop:18}}>Parsed transactions (preview)</h4>
          <ul style={{color:'#e6eef6'}}>
            {parsed.map((p, i) => {
              if (typeof p === 'object') {
                return <li key={i}>{p.type || 'auto'} - ₹{Number(p.amount || 0)} - {p.category || 'auto'} - {p.description || JSON.stringify(p)}</li>;
              }
              return <li key={i}>{p}</li>;
            })}
          </ul>

          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="btn" onClick={handleSaveParsed} disabled={processing}>
              {processing ? 'Saving...' : `Save Parsed Transactions`}
            </button>

            <button
              className="btn"
              onClick={() => { setParsed([]); setExtractedText(''); setMessage('Preview cleared'); }}
              disabled={processing}
            >
              Clear Preview
            </button>
          </div>
        </>
      )}
    </div>
  );
}
