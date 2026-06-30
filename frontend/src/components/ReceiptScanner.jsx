import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { createTransaction } from '../services/api';

const CATEGORIES = ['Rent', 'Groceries', 'Dining', 'Subscriptions', 'Travel', 'Education', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other'];
const PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Net Banking', 'Other'];

export default function ReceiptScanner({ onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // upload -> scanning -> review -> saving
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ merchant: '', amount: '', date: '', category: '', paymentMethod: 'Other' });
  const [ocrRawText, setOcrRawText] = useState('');
  const [showRawText, setShowRawText] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleScan = async () => {
    if (!imageFile) return;
    setStep('scanning');
    setError('');
    try {
      const formData = new FormData();
      formData.append('receipt', imageFile);
      const res = await api.post('/receipt/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm({
        merchant: res.data.merchant || '',
        amount: res.data.amount || '',
        date: res.data.date || new Date().toISOString().split('T')[0],
        category: res.data.category || '',
        paymentMethod: 'Other',
      });
      setOcrRawText(res.data.rawText || '');
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to scan receipt. Try a clearer photo.');
      setStep('upload');
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!form.merchant.trim() || !form.amount || parseFloat(form.amount) <= 0 || !form.category || !form.date) {
      setError('Please fill in all fields correctly before saving.');
      return;
    }
    setStep('saving');
    try {
      await createTransaction({
        merchant: form.merchant.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        type: 'expense',
        paymentMethod: form.paymentMethod,
        date: form.date,
        notes: 'Added via receipt scan',
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction.');
      setStep('review');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      {/* Mobile: full-width bottom sheet. Desktop (sm:): centered modal. */}
      <div className="bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto animate-modal-in">
        <div className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant p-4 flex justify-between items-center z-10">
          <h3 className="text-[16px] sm:text-[18px] font-semibold text-on-surface">Scan Receipt</h3>
          <button onClick={onClose} className="text-on-surface-variant p-1"><X size={20} /></button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-error-container text-on-error-container rounded-lg text-[13px]">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {step === 'upload' && (
            <>
              {/* Two separate inputs are required here, not one: capture="environment"
                  forces mobile browsers straight into the camera with no fallback UI,
                  so it cannot also serve as a gallery picker. Splitting into two
                  inputs + two buttons is the standard pattern for offering both. */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Receipt preview" className="w-full max-h-64 object-contain rounded-lg border border-outline-variant" />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-1.5"
                    >
                      <Camera size={15} /> Retake
                    </button>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-3 py-2.5 bg-surface-container-low text-on-surface rounded-lg text-[12px] sm:text-[13px] font-medium flex items-center justify-center gap-1.5"
                    >
                      <Upload size={15} /> Choose Different
                    </button>
                  </div>
                  <button
                    onClick={handleScan}
                    className="w-full px-4 py-2.5 bg-primary text-on-primary rounded-lg text-[13px] sm:text-[14px] font-medium"
                  >
                    Scan This Receipt
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant rounded-xl py-8 sm:py-10 flex flex-col items-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <Camera size={28} />
                    <span className="text-[13px] sm:text-[14px] font-medium">Take a Photo</span>
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant rounded-xl py-8 sm:py-10 flex flex-col items-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    <Upload size={28} />
                    <span className="text-[13px] sm:text-[14px] font-medium">Upload from Gallery</span>
                  </button>
                  <p className="col-span-1 sm:col-span-2 text-[11px] sm:text-[12px] text-center text-on-surface-variant mt-1">
                    Restaurant bill, grocery bill, medical bill
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'scanning' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-[13px] sm:text-[14px] text-on-surface-variant">Reading receipt... this can take a few seconds.</p>
            </div>
          )}

          {step === 'review' && (
            <form onSubmit={handleConfirm} className="space-y-3">
              <p className="text-[12px] sm:text-[13px] text-on-surface-variant bg-anomaly-bg/40 p-2.5 rounded-lg">
                Review the details below — OCR isn't perfect. Fix anything that looks wrong before saving.
              </p>

              {ocrRawText && (
                <div className="border border-outline-variant rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowRawText((p) => !p)}
                    className="w-full px-3 py-2 text-[11px] sm:text-[12px] font-medium text-on-surface-variant bg-surface-container-low text-left"
                  >
                    {showRawText ? '▾' : '▸'} What OCR actually read (tap if a field looks wrong)
                  </button>
                  {showRawText && (
                    <pre className="px-3 py-2 text-[11px] text-on-surface-variant whitespace-pre-wrap max-h-32 overflow-y-auto bg-surface-container-lowest">
                      {ocrRawText}
                    </pre>
                  )}
                </div>
              )}
              <div>
                <label className="text-[12px] sm:text-[13px] font-medium text-on-surface-variant">Merchant</label>
                <input
                  value={form.merchant}
                  onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] sm:text-[13px] font-medium text-on-surface-variant">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
                  />
                </div>
                <div>
                  <label className="text-[12px] sm:text-[13px] font-medium text-on-surface-variant">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] sm:text-[13px] font-medium text-on-surface-variant">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] sm:text-[13px] font-medium text-on-surface-variant">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
                >
                  {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button
                type="submit"
                className="w-full mt-2 px-4 py-3 bg-primary text-on-primary rounded-lg text-[14px] font-medium"
              >
                Confirm & Add Transaction
              </button>
            </form>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-[13px] sm:text-[14px] text-on-surface-variant">Saving transaction...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
