import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resend } from "resend";
import type { Attachment } from "resend";
import { cardEmailImage, closedEnvelopeImage } from "@/lib/card-images";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENDABLE_CARD_IMAGES = new Set([
  "/images/flat_1.webp",
  "/images/flat_2.webp",
  "/images/flat_3.webp",
  "/images/flat_4.webp",
  "/images/flat_5.webp",
  "/images/flat_6.webp",
  "/images/flat_7.webp",
  "/images/flat_8.webp",
  "/images/flat_9.webp",
  "/images/flat_10.webp",
]);

export const runtime = "nodejs";

type SendCardPayload = {
  recipientEmail?: unknown;
  message?: unknown;
  cardTitle?: unknown;
  cardImage?: unknown;
  refNumber?: unknown;
  serviceClass?: unknown;
};

type ServiceClass = "first" | "second";

const REF_NUMBER_PATTERN = /^#[A-F0-9]{10}$/;

function isSendCardPayload(value: unknown): value is SendCardPayload {
  return value !== null && typeof value === "object";
}

function parseServiceClass(value: unknown): ServiceClass | null {
  if (value === "first" || value === "second") {
    return value;
  }
  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function contentTypeForPath(publicPath: string) {
  if (/\.jpe?g$/i.test(publicPath)) {
    return "image/jpeg";
  }

  if (/\.png$/i.test(publicPath)) {
    return "image/png";
  }

  return "image/webp";
}

async function inlineImageAttachment({
  publicPath,
  filename,
  contentId,
}: {
  publicPath: string;
  filename: string;
  contentId: string;
}): Promise<Attachment> {
  const content = await readFile(
    join(process.cwd(), "public", publicPath.replace(/^\//, "")),
  );

  return {
    filename,
    content: content.toString("base64"),
    contentType: contentTypeForPath(publicPath),
    contentId,
  };
}

async function buildConfirmationAttachments(cardImage: string) {
  const envelopeImage = closedEnvelopeImage(cardImage);

  return Promise.all([
    inlineImageAttachment({
      publicPath: envelopeImage,
      filename: envelopeImage.split("/").at(-1) ?? "envelope.webp",
      contentId: "gf-envelope",
    }),
  ]);
}

async function buildCardAttachments(cardImage: string) {
  const image = cardEmailImage(cardImage);

  return Promise.all([
    inlineImageAttachment({
      publicPath: image,
      filename: image.split("/").at(-1) ?? "card.jpg",
      contentId: "gf-card",
    }),
  ]);
}

function getDeliveryWindow(serviceClass: ServiceClass) {
  return serviceClass === "first" ? "1-2" : "3-5";
}

function getLinkDelay(serviceClass: ServiceClass) {
  // Temporary short delays for testing; swap to real post times later.
  return serviceClass === "first" ? "in 1 min" : "in 2 min";
}

function generateRefNumber() {
  return `#${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function parseRefNumber(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return REF_NUMBER_PATTERN.test(normalized) ? normalized : null;
}

function buildConfirmationEmail(serviceClass: ServiceClass) {
  const deliveryWindow = getDeliveryWindow(serviceClass);

  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;background:#F3F9F9;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;background:#F3F9F9;border-collapse:collapse;">
          <tr>
            <td align="center" style="padding:48px 20px;font-family:Arial,sans-serif;color:#222222;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:460px;border-collapse:collapse;">
                <tr>
                  <td align="center" style="text-align:center;">
                    <img src="cid:gf-envelope" alt="Envelope" width="360" style="display:block;margin:0 auto 32px;width:360px;max-width:88%;height:auto;border:0;" />
                    <p style="margin:0 auto 32px;max-width:340px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;font-weight:500;color:#222222;">Someone wrote you a letter and it's on its way.<br />It should arrive in ${deliveryWindow} working days.</p>
                    <a href="https://greetings-folks.vercel.app/" style="display:inline-block;box-sizing:border-box;min-width:144px;background:#ec0000;padding:10px 24px;font-family:'neue-haas-grotesk-display','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;line-height:1.2;letter-spacing:0.05em;text-align:center;text-decoration:none;text-transform:uppercase;color:#ffffff;">More details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildCardEmail({ cardUrl }: { cardUrl: string }) {
  const safeCardUrl = escapeHtml(cardUrl);
  // Button lives in its own row (not position:absolute). Absolute overlays get
  // stripped by Gmail/Outlook; a fluid <img> keeps mobile aspect ratio intact.
  const buttonStyle =
    "display:inline-block;box-sizing:border-box;min-width:144px;background:#ffffff;border:1px solid #171717;padding:10px 24px;font-family:'neue-haas-grotesk-display','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;line-height:1.2;letter-spacing:0.05em;text-align:center;text-decoration:none;text-transform:uppercase;color:#171717;";

  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <style type="text/css">
          @media only screen and (max-width: 620px) {
            .card-email-shell {
              width: 100% !important;
              max-width: 100% !important;
            }
            .card-email-hero {
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;background:#DF0000;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;border-collapse:collapse;background:#DF0000;">
          <tr>
            <td align="center" style="padding:0;background:#DF0000;">
              <table role="presentation" class="card-email-shell" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#DF0000;">
                <tr>
                  <td align="center" style="padding:0;font-size:0;line-height:0;background:#DF0000;">
                    <img
                      class="card-email-hero"
                      src="cid:gf-card"
                      alt="Your card has arrived"
                      width="600"
                      style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;"
                    />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px 16px 28px;background:#DF0000;text-align:center;">
                    <a href="${safeCardUrl}" style="${buttonStyle}">Open your card</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function getSiteOrigin(request: Request) {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProto ||
    (host?.includes("localhost") || host?.startsWith("127.") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CARD_FROM_EMAIL;

  if (
    !apiKey ||
    !fromEmail ||
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return Response.json(
      { error: "Email service or card storage is not configured yet." },
      { status: 500 },
    );
  }

  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isSendCardPayload(json)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const recipientEmail =
    typeof json.recipientEmail === "string" ? json.recipientEmail.trim() : "";
  const message = typeof json.message === "string" ? json.message.trim() : "";
  const cardTitle =
    typeof json.cardTitle === "string" ? json.cardTitle.trim() : "";
  const cardImage =
    typeof json.cardImage === "string" ? json.cardImage.trim() : "";
  const serviceClass = parseServiceClass(json.serviceClass);

  if (!EMAIL_PATTERN.test(recipientEmail)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!message) {
    return Response.json({ error: "Write a message before sending." }, { status: 400 });
  }

  if (!serviceClass) {
    return Response.json(
      { error: "Choose a service type before sending." },
      { status: 400 },
    );
  }

  const selectedServiceClass = serviceClass;

  if (!cardTitle || !SENDABLE_CARD_IMAGES.has(cardImage)) {
    return Response.json({ error: "This card cannot be sent yet." }, { status: 400 });
  }

  const siteOrigin = getSiteOrigin(request);
  const token = crypto.randomUUID().replaceAll("-", "");
  const refNumber = parseRefNumber(json.refNumber) ?? generateRefNumber();
  const linkDelay = getLinkDelay(selectedServiceClass);
  const cardUrl = `${siteOrigin}/card/${token}`;
  const supabase = createSupabaseAdmin();

  const { error: insertError } = await supabase.from("sent_cards").insert({
    token,
    recipient_email: recipientEmail,
    message,
    card_title: cardTitle,
    card_image: cardImage,
    ref_number: refNumber,
  });

  if (insertError) {
    return Response.json(
      { error: "Unable to save your card." },
      { status: 502 },
    );
  }

  const resend = new Resend(apiKey);
  const confirmationAttachments = await buildConfirmationAttachments(cardImage);

  const { data: confirmationData, error: confirmationError } =
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "Keep an eye on the letterbox – a card’s on its way.",
      html: buildConfirmationEmail(selectedServiceClass),
      attachments: confirmationAttachments,
    });

  if (confirmationError) {
    return Response.json(
      { error: confirmationError.message ?? "Unable to send your card." },
      { status: 502 },
    );
  }

  const cardAttachments = await buildCardAttachments(cardImage);

  const { data: scheduledData, error: scheduledError } =
    await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: "The wait is over, your letter has arrived.",
      html: buildCardEmail({ cardUrl }),
      attachments: cardAttachments,
      scheduledAt: linkDelay,
    });

  if (scheduledError) {
    return Response.json(
      {
        error:
          scheduledError.message ??
          "Your card was saved, but the link email could not be scheduled.",
      },
      { status: 502 },
    );
  }

  return Response.json({
    confirmationId: confirmationData?.id,
    scheduledId: scheduledData?.id,
    cardUrl,
  });
}
