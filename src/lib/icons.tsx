// shared inline-SVG icon set (kebab paths from the prototype)
export const P = {
  dashboard: 'M3 3h7.6v8.4H3zM13.4 3H21v5.4h-7.6zM13.4 10.9H21V21h-7.6zM3 13.9h7.6V21H3z',
  activity: 'M3 12.2h3.6l2.6 7 4-15.4 2.6 8.4H21',
  calendar: 'M3 5h18v16H3zM8 3v4M16 3v4M3 10.2h18',
  tag: 'M12.7 3.2H19a1.8 1.8 0 0 1 1.8 1.8v6.3a1.6 1.6 0 0 1-.47 1.13l-7.1 7.1a1.6 1.6 0 0 1-2.26 0l-6.3-6.3a1.6 1.6 0 0 1 0-2.26l7.1-7.1a1.6 1.6 0 0 1 1.13-.47Z',
  building: 'M4 21V5.2A2.2 2.2 0 0 1 6.2 3h7.6A2.2 2.2 0 0 1 16 5.2V21M16 9.4h1.8A2.2 2.2 0 0 1 20 11.6V21M2.4 21h19.2',
  users: 'M9.2 8a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6ZM3 20a6.2 6.2 0 0 1 12.4 0M15.8 5.1a3.3 3.3 0 0 1 0 5.8M17.4 14.3A6.2 6.2 0 0 1 21 20',
  contact: 'M3 4h18v16H3zM12 12.9a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM7.6 16.8a4.9 4.9 0 0 1 8.8 0',
  trend: 'M3 17.6 9.4 11.2l3.8 3.8L21 7.2M15.4 7.2H21v5.6',
  car: 'M4 17.5v-4.2a2 2 0 0 1 .17-.8l1.63-3.7A2 2 0 0 1 7.63 7.6h8.74a2 2 0 0 1 1.83 1.2l1.63 3.7c.11.25.17.52.17.8v4.2M4.5 13.2h15',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 6.8v5.4l3.4 2',
  check: 'm5 12.6 4.6 4.6L19 7.4',
  chevronL: 'm14.4 5.6-6.4 6.4 6.4 6.4',
  chevronR: 'm9.6 5.6 6.4 6.4-6.4 6.4',
  plus: 'M12 5.5v13M5.5 12h13',
  spray: 'M9.2 8.6h4.6a2.2 2.2 0 0 1 2.2 2.2v8a2.2 2.2 0 0 1-2.2 2.2H9.2A2.2 2.2 0 0 1 7 18.8v-8a2.2 2.2 0 0 1 2.2-2.2ZM10 8.6V5.4h3.2M7 12.4h9',
  wallet: 'M3 8V6.6A1.6 1.6 0 0 1 4.6 5h12.2a1.6 1.6 0 0 1 1.6 1.6V8M3 8h18v11.6H3zM16.6 13.8a1.15 1.15 0 1 0 0 .01',
  alert: 'M12 3.6 2.6 20.4h18.8zM12 10v4.2M12 17.2v.01',
  camera: 'M4 8.2h2.8L8.3 6h7.4l1.5 2.2H20a1.4 1.4 0 0 1 1.4 1.4v8.6a1.4 1.4 0 0 1-1.4 1.4H4a1.4 1.4 0 0 1-1.4-1.4V9.6A1.4 1.4 0 0 1 4 8.2ZM12 16.9a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z',
};

export function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
