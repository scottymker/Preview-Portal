import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
  rules: {
    '.Input': {
      border: '1px solid #d1d5db',
      boxShadow: 'none',
      padding: '12px',
    },
    '.Input:focus': {
      border: '1px solid #2563eb',
      boxShadow: '0 0 0 1px #2563eb',
    },
    '.Input--invalid': {
      border: '1px solid #ef4444',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '8px',
    },
    '.Error': {
      fontSize: '14px',
      marginTop: '8px',
    },
  },
};

export default function StripeProvider({ children, clientSecret }) {
  const options = clientSecret
    ? {
        clientSecret,
        appearance,
      }
    : {
        appearance,
      };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
