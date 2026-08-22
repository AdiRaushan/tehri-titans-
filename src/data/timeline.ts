export interface Milestone {
  /** Displayed marker — a season label, not a calendar year unless confirmed. */
  marker: string;
  title: string;
  description: string;
  /** Highlight the champions/trophy treatment on this node. */
  isHonour?: boolean;
}

// Append a new entry each season. No calendar years are attached to the
// inaugural season because the brief does not confirm one — see content rules.
export const timeline: Milestone[] = [
  {
    marker: "Inaugural Season",
    title: "UPL Debut",
    description:
      "Tehri Titans enter the Uttarakhand Premier League as a professional T20 franchise representing Tehri Garhwal.",
  },
  {
    marker: "September 26, 2025",
    title: "Tehri Queens — Women's UPL Champions",
    description:
      "Tehri Queens, the franchise's women's team, win the first-ever Women's Uttarakhand Premier League title — beating the Haridwar Stars (Haridwar Storm) by seven wickets at the Rajiv Gandhi International Cricket Stadium, Dehradun.",
    isHonour: true,
  },
  {
    marker: "June 2026",
    title: "Current Campaign",
    description:
      "The Titans return for the next UPL season.",
  },
];
