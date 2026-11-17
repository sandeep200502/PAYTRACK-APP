import { LoaderCircle } from 'lucide-react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
};

export default function Button({ variant = 'primary', size, icon: Icon, loading = false, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`btn ${VARIANTS[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : Icon ? <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} /> : null}
      {children}
    </button>
  );
}
