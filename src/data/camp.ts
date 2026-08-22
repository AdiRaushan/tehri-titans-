// Collaboration + camp content. Edit the placeholder values (marked TODO) with
// the real camp details as they are confirmed.

export interface Collaboration {
  academyName: string;
  /** Path under /public. Set to null to show an initials badge instead. */
  academyLogo: string | null;
  website: string;
  partnerLabel: string;
  lede: string;
  body: string[];
  points: string[];
}

export const collaboration: Collaboration = {
  academyName: "Ayush Cricket Academy",
  academyLogo: "/ayush-academy-logo.png",
  website: "https://ayushcricketacademy.com/",
  partnerLabel: "Official Training Partner",
  lede: "Tehri Titans have joined hands with Ayush Cricket Academy to bring professional coaching to the mountains.",
  body: [
    "Tehri Titans and Ayush Cricket Academy are partnering to build a serious grassroots pathway for Uttarakhand's young cricketers — combining the franchise's professional standards with the academy's on-ground coaching expertise.",
    "The collaboration puts structured training, qualified coaches and a real route toward competitive cricket within reach of players across the Tehri Garhwal region.",
  ],
  points: [
    "Professional coaching led by Ayush Cricket Academy",
    "Franchise-standard training methods and facilities",
    "A clear pathway toward the UPL and beyond",
  ],
};

export interface CampDetail {
  label: string;
  value: string;
}

export interface Camp {
  name: string;
  tagline: string;
  intro: string;
  // Headline facts shown as a details grid. Update with confirmed specifics.
  details: CampDetail[];
  inclusions: string[];
}

export const camp: Camp = {
  name: "Tehri Titans Trials",
  tagline: "Earn your place in the squad.",
  intro:
    "Open trials for Tehri Titans, held on 24 & 25 August. Register to put your game in front of the franchise's selectors and coaches, and make your case for a place in the squad.",
  details: [
    { label: "Dates", value: "24 & 25 August" },
    {
      label: "Venue",
      value: "Ayush Cricket Academy, Chidderwala, Kansrao, Uttarakhand 249204",
    },
    { label: "Eligibility", value: "16 years & above" },
    { label: "Fee", value: "₹999" },
  ],
  inclusions: [
    "Skills assessment — batting, bowling & fielding",
    "Match-scenario evaluation",
    "Shortlisting by Tehri Titans coaches",
  ],
};

// Trials registration fee
export const feeAmountPaise = 99900; // ₹999 (in paise)
export const feeAmountRupees = 999; // ₹999 (in Rupees)
export const feeLabel = "₹999";

// Cricketing role options offered in the registration form.
export const proficiencyOptions = [
  "Batsman",
  "Bowler",
  "All-rounder",
  "Wicket-keeper",
] as const;
