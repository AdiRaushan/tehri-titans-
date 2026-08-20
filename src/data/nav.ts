export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: "instagram" | "twitter" | "youtube" | "facebook";
}

// Section anchors live on the home page; sub-routes are absolute paths.
export const navLinks: NavLink[] = [
  { label: "Franchise", href: "/#about" },
  { label: "The Club", href: "/#journey" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Academy", href: "/#academy" },
  { label: "Trials", href: "/#trials" },
];

export const primaryCta: NavLink = { label: "Register for Trials", href: "/#trials" };

export const socialLinks: SocialLink[] = [
  { label: "Instagram", href: "#", icon: "instagram" },
  { label: "X", href: "#", icon: "twitter" },
  { label: "YouTube", href: "#", icon: "youtube" },
  { label: "Facebook", href: "#", icon: "facebook" },
];

export const footerLinks: NavLink[] = [
  { label: "Franchise", href: "/#about" },
  { label: "The Club", href: "/#journey" },
  { label: "Academy", href: "/#academy" },
  { label: "Trials", href: "/#trials" },
];

export const contactEmail = "info@tehrititans.com";
