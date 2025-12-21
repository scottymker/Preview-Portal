import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PreviewPage from './pages/PreviewPage'
import AdminPage from './pages/AdminPage'
import BillingPage from './pages/BillingPage'
import EmailPage from './pages/EmailPage'
import PaymentPage from './pages/PaymentPage'
import './styles/index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:token" element={<PreviewPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/billing" element={<BillingPage />} />
        <Route path="/admin/email" element={<EmailPage />} />
        <Route path="/pay/:invoiceId" element={<PaymentPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
