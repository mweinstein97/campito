export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-card rounded-card border-[1.5px] border-border px-5 py-4 mx-4 mb-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
