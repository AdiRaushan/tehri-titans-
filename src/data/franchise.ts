export const franchise = {
  name: "Tehri Titans",
  tagline: "A professional T20 franchise carrying Tehri Garhwal into the Uttarakhand Premier League.",
  location: "Tehri Garhwal · Uttarakhand",
  homeGround: "Rajiv Gandhi International Cricket Stadium, Dehradun",
  league: "Uttarakhand Premier League (UPL)",
  format: "Twenty20",
  region: "Tehri Garhwal, Uttarakhand",
} as const;

// About-the-franchise narrative. Kept out of components per the content rules.
export const aboutCopy: string[] = [
  "Tehri Titans are a professional Twenty20 franchise carrying the name of Tehri Garhwal into the Uttarakhand Premier League — competing at the top of Uttarakhand's fastest-growing cricket property.",
  "The crest tells the story. The Spartan helmet stands for discipline and resilience; the mountains are the Garhwal Himalaya the region calls home; the ice blue is the Tehri lake and the snowline above it. It is an identity rooted in place, built to compete.",
];

export interface QuickFact {
  label: string;
  value: string;
}

export const quickFacts: QuickFact[] = [
  { label: "Home Ground", value: "Rajiv Gandhi International Cricket Stadium, Dehradun" },
  { label: "League", value: "Uttarakhand Premier League (UPL)" },
  { label: "Format", value: "Twenty20" },
  { label: "Region", value: "Tehri Garhwal, Uttarakhand" },
  { label: "Status", value: "Professional UPL franchise" },
  { label: "Sister Teams", value: "Tehri Queens (women's — inaugural Women's UPL champions) · Uttarakhand Table Tennis League franchise" },
];

// UPL highlight cards for the Journey section — the league sits front and
// centre alongside the franchise.
export interface LeagueHighlight {
  label: string;
  value: string;
  detail: string;
}

export const leagueHighlights: LeagueHighlight[] = [
  {
    label: "The League",
    value: "Uttarakhand Premier League",
    detail:
      "A state-first T20 league governed by the Cricket Association of Uttarakhand, with a proven pathway to the IPL and WPL.",
  },
  {
    label: "Home",
    value: "Rajiv Gandhi International Stadium",
    detail:
      "The Titans play their UPL cricket at Uttarakhand's international venue in Dehradun.",
  },
  {
    label: "Next Season",
    value: "UPL returns June 2026",
    detail:
      "Eight men's and four women's teams, day and night matches, broadcast on TV and OTT.",
  },
];

