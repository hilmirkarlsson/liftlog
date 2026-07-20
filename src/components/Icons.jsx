const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const DumbbellIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
  </svg>
);

export const CoachIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" />
  </svg>
);

export const StatsIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="5" r="2.5" />
    <path d="M12 7.5v6M12 13.5l-3.5 6M12 13.5l3.5 6M7 10l5 1.5L17 10" />
  </svg>
);

export const HistoryIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2.5" />
  </svg>
);

export const SettingsIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 7.5h16M4 12h16M4 16.5h16" />
    <circle cx="9" cy="7.5" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="7" cy="16.5" r="1.8" fill="currentColor" stroke="none" />
  </svg>
);
