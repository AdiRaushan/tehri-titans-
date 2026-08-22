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

  // Default from address (uses custom verified domain if set, fallback to Resend onboarding)
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Tehri Titans Trials <onboarding@resend.dev>";

  const latestAttempt =
    registration.paymentAttempts[registration.paymentAttempts.length - 1];
  const payId =
    cashfreePaymentId ||
    latestAttempt?.cashfreePaymentId ||
    latestAttempt?.cashfreeOrderId ||
    "CONFIRMED";

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tehri Titans Trials Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#0f172a; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f172a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.3);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background-color:#090d16; padding: 32px 30px; text-align: center; border-bottom: 3px solid #38bdf8;">
              <div style="color:#38bdf8; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:3px; margin-bottom:6px;">
                Official Player Trials Pass
              </div>
              <h1 style="color:#ffffff; font-size:26px; font-weight:900; text-transform:uppercase; tracking:1px; margin:0; letter-spacing:1px;">
                TEHRI TITANS
              </h1>
              <div style="color:#cbd5e1; font-size:13px; font-weight:600; margin-top:4px;">
                Cricket Trials &amp; Talent Scouting 2026
              </div>
            </td>
          </tr>

          <!-- CONFIRMATION BANNER -->
          <tr>
            <td style="background-color:#ecfdf5; padding: 18px 30px; text-align: center; border-bottom: 1px solid #a7f3d0;">
              <span style="display:inline-block; background-color:#059669; color:#ffffff; font-size:12px; font-weight:800; text-transform:uppercase; padding:6px 16px; border-radius:50px; letter-spacing:1px;">
                ✓ REGISTRATION &amp; PAYMENT CONFIRMED
              </span>
            </td>
          </tr>

          <!-- CONTENT BODY -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size:16px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">
                Dear ${escapeHtml(registration.name)},
              </p>
              <p style="font-size:14px; line-height:1.6; color:#475569; margin-bottom:24px;">
                Congratulations! Your registration for the official <strong>Tehri Titans Cricket Trials</strong> has been successfully received. Your payment of <strong>₹${amount}</strong> was confirmed via Cashfree Payments.
              </p>

              <!-- OFFICIAL TICKET CARD -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; border: 2px stroke #e2e8f0; border-radius:16px; margin-bottom:28px; border-left:6px solid #090d16;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                      Official Player Pass Details
                    </div>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size:13px; color:#64748b;">Registration ID:</td>
                        <td style="padding: 4px 0; font-size:15px; font-weight:800; color:#0f172a; font-family:monospace; text-align:right;">
                          ${escapeHtml(registration.registrationId)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size:13px; color:#64748b;">Player Name:</td>
                        <td style="padding: 4px 0; font-size:14px; font-weight:700; color:#0f172a; text-align:right;">
                          ${escapeHtml(registration.name)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size:13px; color:#64748b;">Cricketing Role:</td>
                        <td style="padding: 4px 0; font-size:14px; font-weight:700; color:#0284c7; text-align:right;">
                          ${escapeHtml(registration.proficiency)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size:13px; color:#64748b;">Age &amp; Mobile:</td>
                        <td style="padding: 4px 0; font-size:13px; font-weight:600; color:#334155; text-align:right;">
                          Age: ${escapeHtml(registration.age)} | ${escapeHtml(registration.mobile)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size:13px; color:#64748b;">Payment Status:</td>
                        <td style="padding: 4px 0; font-size:13px; font-weight:800; color:#059669; text-align:right;">
                          PAID (₹${amount})
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size:12px; color:#94a3b8;">Payment Reference:</td>
                        <td style="padding: 4px 0; font-size:11px; color:#64748b; font-family:monospace; text-align:right;">
                          ${escapeHtml(payId)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- EVENT LOCATION & TIMINGS -->
              <div style="background-color:#0f172a; color:#ffffff; padding:20px 24px; border-radius:16px; margin-bottom:28px;">
                <div style="font-size:11px; font-weight:800; color:#38bdf8; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:10px;">
                  📍 TRIALS VENUE &amp; SCHEDULE
                </div>
                <div style="font-size:15px; font-weight:700; margin-bottom:6px; color:#ffffff;">
                  Ayush Cricket Academy
                </div>
                <div style="font-size:13px; color:#cbd5e1; line-height:1.5; margin-bottom:12px;">
                  Chidderwala, Kansrao, Uttarakhand 249204
                </div>
                <div style="border-top:1px solid #1e293b; pt:12px; margin-top:10px; font-size:13px; color:#e2e8f0; display:flex; justify-content:space-between;">
                  <span><strong>Dates:</strong> 24 &amp; 25 August</span> | 
                  <span><strong>Reporting Time:</strong> 8:30 AM</span>
                </div>
              </div>

              <!-- PLAYER CHECKLIST -->
              <div style="margin-bottom:28px;">
                <div style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; tracking:1px; margin-bottom:12px;">
                  Important Instructions for Players:
                </div>
                <ul style="margin:0; padding-left:20px; font-size:13px; color:#475569; line-height:1.7;">
                  <li>Present this confirmation email or your <strong>Registration ID (${escapeHtml(registration.registrationId)})</strong> at the venue entrance desk.</li>
                  <li>Carry valid Government Photo ID proof (Aadhaar / Voter ID / School ID).</li>
                  <li>Bring your own personal cricket gear kit (Bat, Pads, Gloves, Helmet).</li>
                  <li>Wear white cricket apparel/whites during the trial sessions.</li>
                </ul>
              </div>

              <p style="font-size:13px; color:#64748b; line-height:1.6; margin-bottom:0;">
                If you have any questions or require assistance, feel free to reply directly to this email or reach out to our team at the venue.
              </p>
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
      subject: `Tehri Titans Trials Confirmation - Reg ID: ${registration.registrationId}`,
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
