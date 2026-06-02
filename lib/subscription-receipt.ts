const logoUrl = "https://www.vibe2gether.com/v2g-logo.png"
const brandColor = "#ff3f86"
const accentColor = "#ff914d"
const darkColor = "#18181b"

export type SubscriptionReceiptDetails = {
  receiptNumber: string
  serviceName: string
  amount: string
  userEmail: string
  paidAt: string
  expiresAt: string
  company?: string
  customerName?: string
  location?: string
  reference?: string
}

function escapeHtml(value?: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function text(value: string, x: number, y: number, size = 11, color = "0 0 0", font = "F1") {
  return [
    "BT",
    `${color} rg`,
    `/${font} ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(value)}) Tj`,
    "ET",
  ].join("\n")
}

function rect(x: number, y: number, width: number, height: number, color: string) {
  return `${color} rg\n${x} ${y} ${width} ${height} re\nf`
}

function line(x1: number, y1: number, x2: number, y2: number, color = "0.9 0.9 0.9") {
  return `${color} RG\n1 w\n${x1} ${y1} m\n${x2} ${y2} l\nS`
}

export function buildSubscriptionReceiptPdf(params: SubscriptionReceiptDetails) {
  const pink = "1 0.247 0.525"
  const orange = "1 0.569 0.302"
  const black = "0.094 0.094 0.106"
  const gray = "0.42 0.42 0.45"
  const light = "0.98 0.94 0.96"

  const content = [
    rect(0, 730, 612, 62, pink),
    rect(0, 710, 612, 20, orange),
    text("Vibe2Gether", 50, 754, 24, "1 1 1", "F2"),
    text("Subscription Receipt", 50, 736, 12, "1 1 1"),
    text("PAID", 505, 750, 13, "1 1 1", "F2"),

    text("Receipt No.", 50, 665, 10, gray),
    text(params.receiptNumber, 50, 646, 16, black, "F2"),
    text("Amount Paid", 382, 665, 10, gray),
    text(params.amount, 382, 644, 20, black, "F2"),
    line(50, 620, 562, 620),

    rect(50, 445, 245, 145, light),
    rect(317, 445, 245, 145, "0.97 0.97 0.98"),
    text("Customer", 70, 560, 10, gray),
    text(params.customerName || params.userEmail, 70, 540, 14, black, "F2"),
    text(params.userEmail, 70, 520, 10, gray),
    text("Payment reference", 70, 490, 10, gray),
    text(params.reference || "Not provided", 70, 472, 10, black),

    text("Service", 337, 560, 10, gray),
    text(params.serviceName, 337, 540, 14, black, "F2"),
    text(params.company || "Vibe2Gether partner", 337, 520, 10, gray),
    text("Location", 337, 490, 10, gray),
    text(params.location || "Online / not specified", 337, 472, 10, black),

    text("Subscription Timeline", 50, 395, 15, black, "F2"),
    line(50, 382, 562, 382),
    text("Paid on", 70, 350, 10, gray),
    text(params.paidAt, 70, 330, 12, black, "F2"),
    text("Valid until", 337, 350, 10, gray),
    text(params.expiresAt, 337, 330, 12, black, "F2"),

    rect(50, 230, 512, 52, "0.99 0.95 0.97"),
    text("Thank you for subscribing.", 70, 258, 14, black, "F2"),
    text("Keep this receipt for your records. Your access is visible in your Vibe2Gether dashboard.", 70, 239, 10, gray),

    text("Vibe2Gether", 50, 90, 12, pink, "F2"),
    text("Learn. Connect. Earn.", 50, 74, 9, gray),
    text("Support: support@vibe2gether.com", 382, 90, 9, gray),
    text("Logo: vibe2gether.com/v2g-logo.png", 382, 74, 8, gray),
  ].join("\n")

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, "utf8")
}

function emailShell(content: string) {
  return `
    <div style="margin:0;padding:0;background:#f8f5f7;font-family:Inter,Segoe UI,Arial,sans-serif;color:${darkColor};">
      <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #f3dbe5;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(24,24,27,0.08);">
          <div style="padding:26px 28px;background:linear-gradient(135deg,${brandColor},${accentColor});color:#ffffff;">
            <img src="${logoUrl}" alt="Vibe2Gether" style="height:42px;width:auto;display:block;margin-bottom:18px;" />
            <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Subscription services</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;">Vibe2Gether Receipt</h1>
          </div>
          ${content}
          <div style="padding:18px 28px;background:#fbf7f9;border-top:1px solid #f3dbe5;color:#71717a;font-size:12px;line-height:1.6;">
            Vibe2Gether - Learn, Connect, and Earn. Need help? Contact support@vibe2gether.com.
          </div>
        </div>
      </div>
    </div>
  `
}

export function buildSubscriptionReceiptEmail(params: SubscriptionReceiptDetails) {
  return emailShell(`
    <div style="padding:28px;">
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${escapeHtml(params.customerName || "there")},</p>
      <p style="margin:0 0 22px;font-size:16px;line-height:1.6;">Your subscription purchase was successful. Your access is now active on Vibe2Gether.</p>

      <div style="border:1px solid #f3dbe5;border-radius:14px;overflow:hidden;margin:0 0 22px;">
        <div style="display:flex;justify-content:space-between;gap:16px;padding:18px 20px;background:#fff5f9;">
          <div>
            <div style="font-size:12px;color:#71717a;">Service</div>
            <div style="font-size:18px;font-weight:800;">${escapeHtml(params.serviceName)}</div>
            <div style="font-size:13px;color:#71717a;">${escapeHtml(params.company || "Vibe2Gether partner")}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:#71717a;">Amount paid</div>
            <div style="font-size:22px;font-weight:900;color:${brandColor};">${escapeHtml(params.amount)}</div>
          </div>
        </div>
        <div style="padding:18px 20px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#71717a;">Receipt number</td><td style="padding:8px 0;text-align:right;font-weight:700;">${escapeHtml(params.receiptNumber)}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;">Paid on</td><td style="padding:8px 0;text-align:right;">${escapeHtml(params.paidAt)}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;">Valid until</td><td style="padding:8px 0;text-align:right;">${escapeHtml(params.expiresAt)}</td></tr>
            <tr><td style="padding:8px 0;color:#71717a;">Location</td><td style="padding:8px 0;text-align:right;">${escapeHtml(params.location || "Not specified")}</td></tr>
          </table>
        </div>
      </div>

      <p style="margin:0;font-size:14px;line-height:1.6;color:#52525b;">A PDF copy of this receipt is attached. You can also view the subscription in your dashboard anytime.</p>
    </div>
  `)
}

export function buildAdminSubscriptionPurchaseEmail(params: SubscriptionReceiptDetails) {
  return emailShell(`
    <div style="padding:28px;">
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">A user just purchased a subscription service.</p>
      <div style="border:1px solid #f3dbe5;border-radius:14px;padding:18px 20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#71717a;">Subscriber</td><td style="padding:8px 0;text-align:right;font-weight:700;">${escapeHtml(params.customerName || params.userEmail)}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Email</td><td style="padding:8px 0;text-align:right;">${escapeHtml(params.userEmail)}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Service</td><td style="padding:8px 0;text-align:right;font-weight:700;">${escapeHtml(params.serviceName)}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Amount</td><td style="padding:8px 0;text-align:right;color:${brandColor};font-weight:900;">${escapeHtml(params.amount)}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Receipt</td><td style="padding:8px 0;text-align:right;">${escapeHtml(params.receiptNumber)}</td></tr>
          <tr><td style="padding:8px 0;color:#71717a;">Valid until</td><td style="padding:8px 0;text-align:right;">${escapeHtml(params.expiresAt)}</td></tr>
        </table>
      </div>
    </div>
  `)
}
