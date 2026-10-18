'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Printer, Save, FileText } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  status: 'Draft' | 'Unpaid' | 'Paid';
  taxRate: number;
}

export default function BillingSystem() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load saved invoices from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('billing_invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInvoices(parsed);
        if (parsed.length > 0) setSelectedInvoice(parsed[0]);
      } catch (e) {
        console.error('Failed to parse invoices from storage', e);
      }
    } else {
      handleCreateNew();
    }
  }, []);

  // Save invoices to localStorage
  const saveInvoicesToStorage = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    localStorage.setItem('billing_invoices', JSON.stringify(updatedInvoices));
  };

  // Create a new blank invoice
  const handleCreateNew = () => {
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: '',
      clientEmail: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ id: Date.now().toString(), description: 'Web Development Services', quantity: 1, unitPrice: 100 }],
      status: 'Draft',
      taxRate: 10,
    };

    setSelectedInvoice(newInvoice);
  };

  // Update selected invoice field
  const updateInvoiceField = (field: keyof Invoice, value: any) => {
    if (!selectedInvoice) return;
    setSelectedInvoice({ ...selectedInvoice, [field]: value });
  };

  // Update line item
  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    if (!selectedInvoice) return;
    const updatedItems = selectedInvoice.items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setSelectedInvoice({ ...selectedInvoice, items: updatedItems });
  };

  const addItem = () => {
    if (!selectedInvoice) return;
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
    };
    setSelectedInvoice({ ...selectedInvoice, items: [...selectedInvoice.items, newItem] });
  };

  const removeItem = (id: string) => {
    if (!selectedInvoice || selectedInvoice.items.length <= 1) return;
    const updatedItems = selectedInvoice.items.filter((item) => item.id !== id);
    setSelectedInvoice({ ...selectedInvoice, items: updatedItems });
  };

  // Performance-cached calculations (useMemo)
  const subtotal = useMemo(() => {
    if (!selectedInvoice) return 0;
    return selectedInvoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [selectedInvoice?.items]);

  const tax = useMemo(() => {
    return (subtotal * (selectedInvoice?.taxRate || 0)) / 100;
  }, [subtotal, selectedInvoice?.taxRate]);

  const total = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  // Save current invoice into list
  const handleSaveInvoice = () => {
    if (!selectedInvoice) return;
    const existingIndex = invoices.findIndex((i) => i.id === selectedInvoice.id);
    let updated: Invoice[];

    if (existingIndex >= 0) {
      updated = [...invoices];
      updated[existingIndex] = selectedInvoice;
    } else {
      updated = [selectedInvoice, ...invoices];
    }

    saveInvoicesToStorage(updated);
    alert('Invoice saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedInvoice) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; color: black; }
          .print-area { box-shadow: none !important; border: none !important; margin: 0; padding: 0; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Action Bar */}
        <header className="no-print flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">GG Billing System</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </button>
            <button
              onClick={handleSaveInvoice}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Saved Invoices Sidebar */}
          <aside className="no-print bg-white p-4 rounded-xl shadow-sm lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-slate-600 text-sm tracking-wider uppercase">Saved Invoices</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {invoices.length === 0 ? (
                <p className="text-xs text-slate-400">No saved invoices yet.</p>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      selectedInvoice.id === inv.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>{inv.invoiceNumber}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : inv.status === 'Unpaid'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{inv.clientName || 'Unnamed Client'}</p>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Invoice Area */}
          <main className="print-area bg-white p-8 rounded-xl shadow-sm lg:col-span-3 space-y-8">
            <div className="flex flex-col md:flex-row justify-between gap-6 border-b pb-6">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800">INVOICE</h2>
                <div className="mt-2 text-sm text-slate-500">
                  <label className="block text-xs text-slate-400 no-print">Invoice #</label>
                  <input
                    type="text"
                    value={selectedInvoice.invoiceNumber}
                    onChange={(e) => updateInvoiceField('invoiceNumber', e.target.value)}
                    className="font-mono border-b border-dashed border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm md:text-right">
                <div className="no-print">
                  <label className="text-xs text-slate-400 block">Status</label>
                  <select
                    value={selectedInvoice.status}
                    onChange={(e) => updateInvoiceField('status', e.target.value)}
                    className="p-1 border rounded text-sm bg-slate-50"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Issue Date</span>
                  <input
                    type="date"
                    value={selectedInvoice.date}
                    onChange={(e) => updateInvoiceField('date', e.target.value)}
                    className="border-b border-dashed border-slate-300 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Due Date</span>
                  <input
                    type="date"
                    value={selectedInvoice.dueDate}
                    onChange={(e) => updateInvoiceField('dueDate', e.target.value)}
                    className="border-b border-dashed border-slate-300 outline-none text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billed To</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client / Company Name"
                  value={selectedInvoice.clientName}
                  onChange={(e) => updateInvoiceField('clientName', e.target.value)}
                  className="w-full text-base font-medium border-b border-slate-300 focus:border-blue-500 outline-none pb-1"
                />
                <input
                  type="email"
                  placeholder="Client Email"
                  value={selectedInvoice.clientEmail}
                  onChange={(e) => updateInvoiceField('clientEmail', e.target.value)}
                  className="w-full text-sm border-b border-slate-300 focus:border-blue-500 outline-none pb-1"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase">
                    <th className="py-2">Description</th>
                    <th className="py-2 w-20 text-center">Qty</th>
                    <th className="py-2 w-28 text-right">Price</th>
                    <th className="py-2 w-28 text-right">Amount</th>
                    <th className="py-2 w-10 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-2">
                        <input
                          type="text"
                          placeholder="Item or service description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-16 text-center border rounded p-1 outline-none"
                        />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          className="w-24 text-right border rounded p-1 outline-none"
                        />
                      </td>
                      <td className="py-3 pl-2 text-right font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="py-3 text-right no-print">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={addItem}
                className="no-print flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium pt-2"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {/* Total Calculation Area */}
            <div className="flex flex-col md:flex-row justify-end border-t pt-6">
              <div className="w-full md:w-64 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    Tax Rate (%)
                    <input
                      type="number"
                      value={selectedInvoice.taxRate}
                      onChange={(e) => updateInvoiceField('taxRate', Number(e.target.value))}
                      className="w-12 border rounded text-center text-xs p-0.5 no-print"
                    />
                  </span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-800 border-t pt-3">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}