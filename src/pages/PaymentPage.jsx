import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getInvoiceById } from '../lib/supabase'
import { CreditCard, Loader2, AlertCircle, CheckCircle, FileText, Lock } from 'lucide-react'
import { format } from 'date-fns'
import StripeProvider from '../components/StripeProvider'
import PaymentForm from '../components/PaymentForm'
import './PaymentPage.css'

export default function PaymentPage() {
  const { invoiceId } = useParams()
  const [searchParams] = useSearchParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [clientSecret, setClientSecret] = useState(null)
  const [creatingIntent, setCreatingIntent] = useState(false)

  // Check if redirected back from Stripe with success
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setPaymentComplete(true)
    }
  }, [searchParams])

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

  async function createPaymentIntent() {
    if (clientSecret || creatingIntent) return

    setCreatingIntent(true)
    setError(null)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            customerEmail: invoice.client_email,
            customerName: invoice.client_name
          })
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create payment intent')
      }

      setClientSecret(result.clientSecret)
    } catch (err) {
      console.error('Error creating payment intent:', err)
      setError(err.message || 'Failed to initialize payment. Please try again.')
    } finally {
      setCreatingIntent(false)
    }
  }

  // Create payment intent when card payment is selected
  useEffect(() => {
    if (invoice && paymentMethod === 'card' && !paymentComplete && invoice.status !== 'paid') {
      createPaymentIntent()
    }
  }, [invoice, paymentMethod, paymentComplete])

  function handlePaymentSuccess(paymentIntent) {
    console.log('Payment successful:', paymentIntent)
    setPaymentComplete(true)
    setInvoice(prev => ({
      ...prev,
      status: 'paid',
      paid_at: new Date().toISOString()
    }))
  }

  function handlePaymentError(error) {
    console.error('Payment error:', error)
    // Error is handled in PaymentForm component
  }

  if (loading) {
    return (
      <div className="payment-loading">
        <Loader2 className="spinner" size={32} />
        <p>Loading invoice...</p>
      </div>
    )
  }

  if (error && !invoice) {
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
      <div className="payment-page payment-page-success">
        <div className="success-container">
          {/* Animated Background */}
          <div className="success-bg-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>

          {/* Success Card */}
          <div className="success-card">
            <div className="success-icon-wrapper">
              <div className="success-icon-ring"></div>
              <div className="success-icon">
                <CheckCircle size={48} strokeWidth={2.5} />
              </div>
            </div>

            <h1 className="success-title">Payment Successful</h1>
            <p className="success-subtitle">Thank you for your payment, {invoice.client_name}!</p>

            {/* Amount Display */}
            <div className="success-amount-card">
              <span className="amount-label">Amount Paid</span>
              <span className="amount-value">${(invoice.total || 0).toFixed(2)}</span>
            </div>

            {/* Details */}
            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Invoice</span>
                <span className="detail-value">{invoice.invoice_number}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Project</span>
                <span className="detail-value">{invoice.project_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{format(new Date(invoice.paid_at || new Date()), 'MMMM d, yyyy')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value detail-badge">
                  <CreditCard size={14} />
                  Card
                </span>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="success-email-notice">
              <div className="email-icon">
                <FileText size={18} />
              </div>
              <p>A confirmation email has been sent to <strong>{invoice.client_email}</strong></p>
            </div>

            {/* Footer */}
            <div className="success-footer">
              <Lock size={14} />
              <span>Secured by Stripe</span>
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
            <div className="stripe-payment-section">
              {error && (
                <div className="payment-error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {creatingIntent && (
                <div className="payment-loading-inline">
                  <Loader2 className="spinner" size={20} />
                  <span>Initializing secure payment...</span>
                </div>
              )}

              {clientSecret && (
                <StripeProvider clientSecret={clientSecret}>
                  <PaymentForm
                    invoice={invoice}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </StripeProvider>
              )}
            </div>
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
          <p>
            <Lock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
