interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends a transactional email using Resend API.
 * In development or if RESEND_API_KEY is unset, logs the email instead of throwing.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || "Orbit <onboarding@resend.dev>";

  const recipients = Array.isArray(to) ? to : [to];

  if (!apiKey) {
    console.log(`📨 [Email Simulated - No RESEND_API_KEY configured]`);
    console.log(`To: ${recipients.join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${fromEmail}`);
    return { success: true, id: "simulated_local" };
  }

  try {
    let response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipients,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // If Resend returns 403 due to testing sandbox domain restriction (onboarding@resend.dev):
      // Retry sending to the verified developer account email so test emails always deliver!
      if (
        response.status === 403 &&
        errorText.includes("only send testing emails to your own email address")
      ) {
        const match = errorText.match(/\(([^)]+@resend\.dev|[^)]+@gmail\.com|[^)]+@[^)]+)\)/);
        const fallbackEmail = match?.[1] || "trevorcjustus@gmail.com";

        console.warn(
          `⚠️ Resend Sandbox: Forwarding test email to registered account (${fallbackEmail}) instead of ${recipients.join(
            ", ",
          )}`,
        );

        response = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [fallbackEmail],
            subject: `[Test for ${recipients.join(", ")}] ${subject}`,
            html: `
              <div style="background:#fef3c7; border:1px solid #fde68a; padding:12px 16px; margin-bottom:20px; border-radius:8px; font-family:sans-serif; font-size:12px; color:#92400e;">
                <strong>Resend Sandbox Notice:</strong> Intended recipient: <code>${recipients.join(
                  ", ",
                )}</code>.<br/>To deliver directly to arbitrary customer emails, verify your custom domain at <a href="https://resend.com/domains">resend.com/domains</a>.
              </div>
              ${html}
            `,
          }),
        });

        if (!response.ok) {
          const secondError = await response.text();
          console.error("Resend sandbox fallback dispatch error:", secondError);
          return { success: false, error: secondError };
        }
      } else {
        console.error("Resend email dispatch error:", response.status, errorText);
        return { success: false, error: errorText };
      }
    }

    const data = await response.json();
    console.log(`✅ Transactional email sent successfully: ${subject} (ID: ${data.id})`);
    return { success: true, id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email failure";
    console.error("Email send exception:", message);
    return { success: false, error: message };
  }
}

/**
 * 1. Customer New Subscription Confirmation Email Template
 */
export function generateCustomerSubscriptionEmail(params: {
  customerName: string;
  productName: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: string;
  nextBillingDate: string;
  portalUrl: string;
  isTrial?: boolean;
  trialDays?: number;
}): string {
  const formattedAmount = `${params.currency === "NGN" ? "₦" : params.currency} ${Number(
    params.amount,
  ).toLocaleString()}`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; background-color: #ffffff; border-radius: 12px; border: 1px solid #f4f4f5;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #0F86EE; letter-spacing: -0.03em;">orbit</span>
      </div>

      <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #09090b;">
        ${params.isTrial ? `Your ${params.trialDays}-day free trial has started!` : `Welcome to ${params.productName}!`}
      </h1>

      <p style="font-size: 15px; line-height: 1.5; color: #52525b; margin-bottom: 24px;">
        Hi ${params.customerName || "there"}, thank you for subscribing to <strong>${params.productName}</strong> (${params.planName}).
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Product & Plan</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.productName} • ${params.planName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Amount</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${formattedAmount} / ${params.billingInterval}</td>
          </tr>
          ${
            params.isTrial
              ? `<tr>
                  <td style="padding: 6px 0; color: #64748b;">Trial Duration</td>
                  <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #059669;">${params.trialDays} Days Free</td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b;">${params.isTrial ? "First Regular Bill Date" : "Next Renewal Date"}</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.nextBillingDate}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #52525b; margin-bottom: 24px;">
        You can manage your subscription, view payment receipts, or update your payment method anytime via your personal customer portal:
      </p>

      <div style="margin-bottom: 32px;">
        <a href="${params.portalUrl}" style="display: inline-block; background-color: #0F86EE; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Manage Subscription
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />

      <p style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">
        Powered by Orbit Billing Infrastructure. If you have any questions, reply to this email or reach out to the merchant.
      </p>
    </div>
  `;
}

/**
 * 2. Merchant New Subscriber Alert Email Template
 */
export function generateMerchantSubscriberAlertEmail(params: {
  merchantName: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  planName: string;
  amount: number;
  currency: string;
}): string {
  const formattedAmount = `${params.currency === "NGN" ? "₦" : params.currency} ${Number(
    params.amount,
  ).toLocaleString()}`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; background-color: #ffffff; border-radius: 12px; border: 1px solid #f4f4f5;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #0F86EE; letter-spacing: -0.03em;">orbit</span>
      </div>

      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #09090b;">
        🎉 New Subscriber for ${params.productName}
      </h1>

      <p style="font-size: 15px; line-height: 1.5; color: #52525b; margin-bottom: 20px;">
        A new customer just subscribed to <strong>${params.planName}</strong> (${formattedAmount}).
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Customer</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Email</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Plan</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.planName} (${formattedAmount})</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">
        Orbit Workspace Real-time Notification.
      </p>
    </div>
  `;
}

/**
 * 3. Renewal Payment Receipt Email Template
 */
export function generateRenewalReceiptEmail(params: {
  customerName: string;
  productName: string;
  planName: string;
  amount: number;
  currency: string;
  nextBillingDate: string;
  reference: string;
  portalUrl: string;
}): string {
  const formattedAmount = `${params.currency === "NGN" ? "₦" : params.currency} ${Number(
    params.amount,
  ).toLocaleString()}`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; background-color: #ffffff; border-radius: 12px; border: 1px solid #f4f4f5;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #0F86EE; letter-spacing: -0.03em;">orbit</span>
      </div>

      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #09090b;">
        Payment Receipt: ${params.productName}
      </h1>

      <p style="font-size: 15px; line-height: 1.5; color: #52525b; margin-bottom: 20px;">
        Hi ${params.customerName || "there"}, your subscription renewal of <strong>${formattedAmount}</strong> has been successfully processed.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Plan</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.productName} • ${params.planName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Amount Charged</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Transaction Reference</td>
            <td style="padding: 6px 0; font-family: monospace; font-size: 12px; text-align: right; color: #0f172a;">${params.reference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Next Billing Date</td>
            <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.nextBillingDate}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 24px;">
        <a href="${params.portalUrl}" style="display: inline-block; background-color: #0F86EE; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          View Portal & Receipts
        </a>
      </div>
    </div>
  `;
}

/**
 * 4. Cancellation Notice Email Template (Access remains till period end)
 */
export function generateCancellationNoticeEmail(params: {
  customerName: string;
  productName: string;
  planName: string;
  accessEndsAt: string;
  portalUrl: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; background-color: #ffffff; border-radius: 12px; border: 1px solid #f4f4f5;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #0F86EE; letter-spacing: -0.03em;">orbit</span>
      </div>

      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #09090b;">
        Subscription Cancellation Scheduled
      </h1>

      <p style="font-size: 15px; line-height: 1.5; color: #52525b; margin-bottom: 20px;">
        Hi ${params.customerName || "there"}, we received your request to cancel your subscription to <strong>${params.productName}</strong> (${params.planName}).
      </p>

      <div style="background-color: #fffbeb; border-radius: 8px; padding: 18px; border: 1px solid #fef3c7; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #92400e; margin: 0; font-weight: 600;">
          Your access will remain active until <strong>${params.accessEndsAt}</strong>.
        </p>
        <p style="font-size: 13px; color: #b45309; margin: 6px 0 0 0;">
          You will not be billed again. If you change your mind, you can reactivate your subscription anytime before this date.
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <a href="${params.portalUrl}" style="display: inline-block; background-color: #0F86EE; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Manage Subscription
        </a>
      </div>
    </div>
  `;
}

/**
 * 5. Payment Failed Notice Email Template
 */
export function generatePaymentFailedEmail(params: {
  customerName: string;
  productName: string;
  planName: string;
  amount: number;
  currency: string;
  portalUrl: string;
}): string {
  const formattedAmount = `${params.currency === "NGN" ? "₦" : params.currency} ${Number(
    params.amount,
  ).toLocaleString()}`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #18181b; background-color: #ffffff; border-radius: 12px; border: 1px solid #f4f4f5;">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 800; color: #0F86EE; letter-spacing: -0.03em;">orbit</span>
      </div>

      <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #dc2626;">
        Payment Failed for ${params.productName}
      </h1>

      <p style="font-size: 15px; line-height: 1.5; color: #52525b; margin-bottom: 20px;">
        Hi ${params.customerName || "there"}, we attempted to charge your card <strong>${formattedAmount}</strong> for your recurring subscription to <strong>${params.planName}</strong>, but the charge was declined.
      </p>

      <div style="background-color: #fef2f2; border-radius: 8px; padding: 18px; border: 1px solid #fee2e2; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #991b1b; margin: 0;">
          Please update your payment method in your Customer Portal to maintain uninterrupted access.
        </p>
      </div>

      <div style="margin-bottom: 24px;">
        <a href="${params.portalUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Update Payment Method
        </a>
      </div>
    </div>
  `;
}
