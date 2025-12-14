import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getInvoiceById, updateInvoice } from '../lib/supabase'
import { Check, CreditCard, Loader2, AlertCircle, CheckCircle, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import './PaymentPage.css'

export default function PaymentPage() {
  const { invoiceId } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [processing, setProcessing] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  async function loadInvoice() {
    try {
      setLoading(true)
      const data = await getInvoiceById(invoiceId)
      setInvoice(data)
      if (data.status === 'paid') {
        setPaymentComplete(true)
      }
    } catch (err) {
      setError('Invoice not found')
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment(e) {
    e.preventDefault()
    setProcessing(true)

    // Simulate payment processing
    // In production, integrate with Stripe here
    setTimeout(async () => {
      try {
        await updateInvoice(invoiceId, {
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod
        })
        setPaymentComplete(true)
        setInvoice(prev => ({ ...prev, status: 'paid', paid_at: new Date().toISOString() }))
      } catch (err) {
        setError('Payment failed. Please try again.')
      } finally {
        setProcessing(false)
      }
    }, 2000)
  }

  if (loading) {
    return (
      <div className="payment-loading">
        <Loader2 className="spinner" size={32} />
        <p>Loading invoice...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="payment-error">
        <AlertCircle size={48} />
        <h1>Invoice Not Found</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (paymentComplete) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-success">
            <div className="success-icon">
              <CheckCircle size={64} />
            </div>
            <h1>Payment Complete!</h1>
            <p>Thank you for your payment.</p>
            <div className="receipt-summary">
              <div className="receipt-row">
                <span>Invoice</span>
                <span>{invoice.invoice_number}</span>
              </div>
              <div className="receipt-row">
                <span>Amount Paid</span>
                <span className="amount">${(invoice.total || 0).toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>Date</span>
                <span>{format(new Date(invoice.paid_at || new Date()), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isOverdue = new Date(invoice.due_date) < new Date()

  return (
    <div className="payment-page">
      <div className="payment-container">
        {/* Header */}
        <div className="payment-header">
          <img src="https://thedevside.com/logo.png" alt="The Dev Side" className="payment-logo" />
          <span className="invoice-badge">Invoice</span>
        </div>

        {/* Invoice Details */}
        <div className="invoice-details">
          <div className="invoice-row">
            <div className="detail-group">
              <span className="detail-label">Invoice Number</span>
              <span className="detail-value">{invoice.invoice_number}</span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Due Date</span>
              <span className={`detail-value ${isOverdue ? 'overdue' : ''}`}>
                {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                {isOverdue && <span className="overdue-badge">Overdue</span>}
              </span>
            </div>
          </div>
          <div className="invoice-row">
            <div className="detail-group">
              <span className="detail-label">Bill To</span>
              <span className="detail-value">{invoice.client_name}</span>
            </div>
            <div className="detail-group">
              <span className="detail-label">Project</span>
              <span className="detail-value">{invoice.project_name}</span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="line-items-section">
          <h3>Services</h3>
          <div className="line-items-table">
            <div className="line-items-header">
              <span>Description</span>
              <span>Qty</span>
              <span>Rate</span>
              <span>Amount</span>
            </div>
            {invoice.line_items?.map((item, idx) => (
              <div key={idx} className="line-item">
                <span className="item-description">{item.description}</span>
                <span className="item-qty">{item.quantity}</span>
                <span className="item-rate">${item.rate.toFixed(2)}</span>
                <span className="item-amount">${(item.quantity * item.rate).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="payment-total">
          <span>Amount Due</span>
          <span className="total-amount">${(invoice.total || 0).toFixed(2)}</span>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="invoice-notes">
            <h4>Notes</h4>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Payment Form */}
        <div className="payment-form-section">
          <h3>Payment Method</h3>

          <div className="payment-methods">
            <label className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment_method"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <CreditCard size={20} />
              <span>Credit/Debit Card</span>
            </label>
            <label className={`payment-method ${paymentMethod === 'bank' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="payment_method"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <FileText size={20} />
              <span>Bank Transfer</span>
            </label>
          </div>

          {paymentMethod === 'card' && (
            <form onSubmit={handlePayment} className="card-form">
              <div className="form-group">
                <label className="label">Card Number</label>
                <input
                  type="text"
                  className="input"
                  placeholder="4242 4242 4242 4242"
                  maxLength="19"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Expiry Date</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">CVC</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Name on Card</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Smith"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay ${(invoice.total || 0).toFixed(2)}
                  </>
                )}
              </button>
            </form>
          )}

          {paymentMethod === 'bank' && (
            <div className="bank-transfer-info">
              <p>Please transfer the amount to:</p>
              <div className="bank-details">
                <div className="bank-row">
                  <span>Bank Name</span>
                  <span>Chase Bank</span>
                </div>
                <div className="bank-row">
                  <span>Account Name</span>
                  <span>The Dev Side LLC</span>
                </div>
                <div className="bank-row">
                  <span>Routing Number</span>
                  <span>XXXXXX789</span>
                </div>
                <div className="bank-row">
                  <span>Account Number</span>
                  <span>XXXXXX1234</span>
                </div>
                <div className="bank-row">
                  <span>Reference</span>
                  <span>{invoice.invoice_number}</span>
                </div>
              </div>
              <p className="bank-note">
                Please include the invoice number as payment reference.
                Your invoice will be marked as paid once we receive the transfer.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="payment-footer">
          <p>Secure payment powered by The Dev Side</p>
        </div>
      </div>
    </div>
  )
}
