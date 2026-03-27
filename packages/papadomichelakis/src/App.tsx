// @ts-expect-error importing jsx file as module (no types)
import InvoiceApp from '../final_invoice_app.jsx';

export default function App() {
  return (
    <div className="w-full h-full">
      <InvoiceApp />
    </div>
  );
}
