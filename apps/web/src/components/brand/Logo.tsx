import './logo.scss';

export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span className="logo">
      <svg className="logo__mark" viewBox="0 0 40 44" aria-hidden="true">
        <path d="M20 2 4 8v12c0 10.5 6.8 19.2 16 22 9.2-2.8 16-11.5 16-22V8z" fill="#7cb342" />
        <path d="M20 2v40c9.2-2.8 16-11.5 16-22V8z" fill="#689f38" />
        <circle cx="20" cy="17.5" r="5.5" fill="#fff" />
        <path
          d="M10.5 32.5c1.7-4.6 5.3-7 9.5-7s7.8 2.4 9.5 7c-2.5 2.9-5.7 5-9.5 6.3-3.8-1.3-7-3.4-9.5-6.3z"
          fill="#fff"
        />
      </svg>
      {withText && <span className="logo__text">Inventory</span>}
    </span>
  );
}
