const STEPS = ["Ticket Selection", "Customer & Booking Details", "Payment & Confirmation"] as const;

export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-8 text-sm font-medium flex-wrap">
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const active = stepNumber <= current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${active ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
              {stepNumber}
            </div>
            <span className={active ? "text-gray-900" : "text-gray-400"}>{label}</span>
            {stepNumber < STEPS.length && <span className="w-6 h-px bg-gray-300 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
