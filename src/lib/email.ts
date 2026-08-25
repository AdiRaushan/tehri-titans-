import { Resend } from "resend";
import { type RegistrationRecord } from "@/lib/db";

const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Track sent emails in memory to prevent duplicate emails from webhook + return URL
const sentEmailsSet = new Set<string>();

export interface SendEmailParams {
  registration: RegistrationRecord;
  cashfreePaymentId?: string;
  amount?: number;
}

export async function sendRegistrationConfirmationEmail({
  registration,
  cashfreePaymentId,
  amount = 999,
}: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn("Resend API key missing (RESEND_API_KEY). Email confirmation skipped.");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  // Idempotency check: don't send duplicate emails for the same registration
  const emailKey = `${registration.registrationId}_${registration.status}`;
  if (sentEmailsSet.has(emailKey)) {
    return { success: true, error: "Already sent" };
  }

  const recipientEmail = registration.email.trim();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    return { success: false, error: "Invalid recipient email" };
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://tehrititans.in").replace(/\/$/, "");
  const logoUrl = `${baseUrl}/tehri-titans-logo.png`;

  // Default from address (uses official verified domain tehrititans.in)
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Tehri Titans Trials <trials@tehrititans.in>";

  const latestAttempt =
    registration.paymentAttempts[registration.paymentAttempts.length - 1];
  const isOffline = registration.status === "OFFLINE";
  const payId =
    cashfreePaymentId ||
    latestAttempt?.cashfreePaymentId ||
    latestAttempt?.cashfreeOrderId ||
    (isOffline ? `OFFLINE-${registration.registrationId}` : "CONFIRMED");

  const emailSubject = isOffline
    ? `Tehri Titans Trials Pass (Pay at Center) - Reg ID: ${registration.registrationId}`
    : `Tehri Titans Trials Confirmation - Reg ID: ${registration.registrationId}`;

  const bannerHtml = isOffline
    ? `
      <tr>
        <td style="background-color:#fffbe6; padding: 18px 30px; text-align: center; border-bottom: 1px solid #ffe58f;">
          <span style="display:inline-block; background-color:#d97706; color:#ffffff; font-size:12px; font-weight:800; text-transform:uppercase; padding:7px 18px; border-radius:50px; letter-spacing:1px;">
            ✓ REGISTRATION CONFIRMED · PAY AT TRIAL CENTER
          </span>
        </td>
      </tr>
    `
    : `
      <tr>
        <td style="background-color:#ecfdf5; padding: 18px 30px; text-align: center; border-bottom: 1px solid #a7f3d0;">
          <span style="display:inline-block; background-color:#059669; color:#ffffff; font-size:12px; font-weight:800; text-transform:uppercase; padding:7px 18px; border-radius:50px; letter-spacing:1px;">
            ✓ REGISTRATION &amp; PAYMENT CONFIRMED
          </span>
        </td>
      </tr>
    `;

  const bodyIntroText = isOffline
    ? `Congratulations! Your registration for the official <strong>Tehri Titans Cricket Trials</strong> has been successfully received. Please pay the registration fee of <strong>₹${amount}</strong> in Cash or UPI at the trial center desk on trial day.`
    : `Congratulations! Your registration for the official <strong>Tehri Titans Cricket Trials</strong> has been successfully received. Your payment of <strong>₹${amount}</strong> was confirmed via Cashfree Payments.`;

  const paymentStatusRow = isOffline
    ? `
      <tr>
        <td style="padding: 5px 0; font-size:13px; color:#64748b;">Payment Status:</td>
        <td style="padding: 5px 0; font-size:13px; font-weight:800; color:#d97706; text-align:right;">
          Pay at Trial Center (₹${amount} Due)
        </td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-size:12px; color:#94a3b8;">Payment Reference:</td>
        <td style="padding: 5px 0; font-size:11px; color:#64748b; font-family:monospace; text-align:right;">
          PAY AT CENTER DESK (${escapeHtml(payId)})
        </td>
      </tr>
    `
    : `
      <tr>
        <td style="padding: 5px 0; font-size:13px; color:#64748b;">Payment Status:</td>
        <td style="padding: 5px 0; font-size:13px; font-weight:800; color:#059669; text-align:right;">
          PAID (₹${amount})
        </td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-size:12px; color:#94a3b8;">Payment Reference:</td>
        <td style="padding: 5px 0; font-size:11px; color:#64748b; font-family:monospace; text-align:right;">
          ${escapeHtml(payId)}
        </td>
      </tr>
    `;

  const extraInstruction = isOffline
    ? `<li>Present this pass at the trial center registration desk and pay <strong>₹${amount} (Cash or UPI)</strong> to collect your physical chest number.</li>`
    : ``;

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tehri Titans Trials Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#070b14; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#070b14; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- POLISHED BRAND HEADER -->
          <tr>
            <td style="background-color:#070b14; padding: 36px 30px 28px 30px; text-align: center; border-bottom: 3px solid #38bdf8;">
              <div style="color:#38bdf8; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-bottom:6px;">
                OFFICIAL PLAYER TRIALS PASS
              </div>
              <h1 style="color:#ffffff; font-size:28px; font-weight:900; text-transform:uppercase; letter-spacing:2px; margin:0;">
                TEHRI TITANS
              </h1>
              <div style="color:#94a3b8; font-size:13px; font-weight:600; margin-top:6px; letter-spacing:0.5px;">
                Uttarakhand Premier League (UPL) | Talent Scouting 2026
              </div>
            </td>
          </tr>

          <!-- CONFIRMATION BANNER -->
          ${bannerHtml}

          <!-- CONTENT BODY -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size:16px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">
                Dear ${escapeHtml(registration.name)},
              </p>
              <p style="font-size:14px; line-height:1.6; color:#475569; margin-bottom:24px;">
                ${bodyIntroText}
              </p>

              <!-- OFFICIAL TICKET CARD -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; border: 1px solid #e2e8f0; border-radius:16px; margin-bottom:28px; border-left:6px solid #070b14;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">
                      Official Player Pass Details
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 5px 0; font-size:13px; color:#64748b;">Registration ID:</td>
                        <td style="padding: 5px 0; font-size:15px; font-weight:800; color:#0f172a; font-family:monospace; text-align:right;">
                          ${escapeHtml(registration.registrationId)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size:13px; color:#64748b;">Player Name:</td>
                        <td style="padding: 5px 0; font-size:14px; font-weight:700; color:#0f172a; text-align:right;">
                          ${escapeHtml(registration.name)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size:13px; color:#64748b;">Cricketing Role:</td>
                        <td style="padding: 5px 0; font-size:14px; font-weight:700; color:#0284c7; text-align:right;">
                          ${escapeHtml(registration.proficiency)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size:13px; color:#64748b;">Age &amp; Mobile:</td>
                        <td style="padding: 5px 0; font-size:13px; font-weight:600; color:#334155; text-align:right;">
                          Age: ${escapeHtml(registration.age)} | ${escapeHtml(registration.mobile)}
                        </td>
                      </tr>
                      ${paymentStatusRow}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- EVENT LOCATION & TIMINGS -->
              <div style="background-color:#070b14; color:#ffffff; padding:22px 24px; border-radius:16px; margin-bottom:28px;">
                <div style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:10px;">
                  📍 TRIALS VENUE &amp; SCHEDULE
                </div>
                <div style="font-size:16px; font-weight:700; margin-bottom:6px; color:#ffffff;">
                  Ayush Cricket Academy
                </div>
                <div style="font-size:13px; color:#cbd5e1; line-height:1.5; margin-bottom:12px;">
                  Chidderwala, Kansrao, Uttarakhand 249204
                </div>
                <div style="border-top:1px solid #1e293b; padding-top:12px; margin-top:12px; font-size:13px; color:#e2e8f0;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="color:#e2e8f0; font-size:13px;"><strong>Dates:</strong> 26 &amp; 27 August</td>
                      <td style="color:#e2e8f0; font-size:13px; text-align:right;"><strong>Reporting Time:</strong> 8:00 AM</td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- PLAYER CHECKLIST & INSTRUCTIONS -->
              <div style="margin-bottom:28px;">
                <div style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">
                  Important Instructions for Players:
                </div>
                <ul style="margin:0; padding-left:20px; font-size:13px; color:#475569; line-height:1.7;">
                  <li>Present this confirmation email or your <strong>Registration ID (${escapeHtml(registration.registrationId)})</strong> at the venue entrance desk.</li>
                  ${extraInstruction}
                  <li>Carry valid Government Photo ID proof (Aadhaar / Voter ID / School ID).</li>
                </ul>
              </div>

              <!-- OFFICIAL SUPPORT & QUERY CONTACT BOX -->
              <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:20px 24px;">
                <div style="font-size:12px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">
                  Need Assistance or Have Queries?
                </div>
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#475569;">
                      <strong>Player Support &amp; Verification:</strong>
                    </td>
                    <td style="padding:6px 0; font-size:13px; text-align:right;">
                      <a href="mailto:info@tehrititans.in" style="color:#0284c7; font-weight:700; text-decoration:none;">info@tehrititans.in</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:13px; color:#475569;">
                      <strong>Marketing &amp; Sponsorships:</strong>
                    </td>
                    <td style="padding:6px 0; font-size:13px; text-align:right;">
                      <a href="mailto:marketing@tehrititans.in" style="color:#0284c7; font-weight:700; text-decoration:none;">marketing@tehrititans.in</a>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f1f5f9; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size:12px; font-weight:700; color:#0f172a; margin:0 0 4px 0;">
                Tehri Titans Franchise
              </p>
              <p style="font-size:11px; color:#64748b; margin:0;">
                Uttarakhand Premier League (UPL) | Official Player Trials
              </p>
              <p style="font-size:11px; color:#94a3b8; margin-top:8px;">
                Contact: <a href="mailto:info@tehrititans.in" style="color:#64748b; text-decoration:none;">info@tehrititans.in</a> | <a href="mailto:marketing@tehrititans.in" style="color:#64748b; text-decoration:none;">marketing@tehrititans.in</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: emailSubject,
      html: emailHtml,
    });

    if (response.error) {
      console.error(`Resend API error sending email to ${recipientEmail}:`, response.error);
      return { success: false, error: response.error.message };
    }

    sentEmailsSet.add(emailKey);
    console.log(`Successfully sent confirmation email to ${recipientEmail} (ID: ${response.data?.id})`);
    return { success: true, id: response.data?.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send email";
    console.error(`Error sending email to ${recipientEmail}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
