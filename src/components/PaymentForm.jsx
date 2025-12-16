import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, Lock } from 'lucide-react';

export default function PaymentForm({ invoice, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pay/${invoice.id}?success=true`,
          receipt_email: invoice.client_email,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to customer
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('An unexpected error occurred. Please try again.');
        }
        onError?.(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful
        onSuccess?.(paymentIntent);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        // Payment is processing
        setErrorMessage('Your payment is processing. You will receive confirmation shortly.');
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Additional authentication required (3D Secure, etc.)
        // Stripe will handle this automatically
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('Failed to process payment. Please try again.');
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card'],
        }}
      />

      {errorMessage && (
        <div className="payment-error">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn btn-primary btn-lg payment-submit"
      >
        {isProcessing ? (
          <>
            <Loader2 className="spinner" size={20} />
            Processing...
          </>
        ) : (
          <>
            <Lock size={18} />
            Pay ${invoice.total.toFixed(2)}
          </>
        )}
      </button>

      <div className="payment-security">
        <Lock size={14} />
        <span>Secured by Stripe. Your payment information is encrypted.</span>
      </div>
    </form>
  );
}
