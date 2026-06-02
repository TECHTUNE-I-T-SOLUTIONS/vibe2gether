import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

const host = process.env.EMAIL_HOST || 'smtp.vibe2gether.com'
const port = Number(process.env.EMAIL_PORT || 587)
const secure = process.env.EMAIL_SECURE === 'true'
const user = process.env.EMAIL_USER || 'events@vibe2gether.com'
const primaryPass = process.env.EMAIL_PASS_II || process.env.EMAIL_PASS || ''
const fallbackPass = process.env.EMAIL_PASS || ''

const createTransporter = (authPass?: string) =>
  nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && authPass ? { user, pass: authPass } : undefined,
    tls: {
      rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  })

const transporter = createTransporter(primaryPass)

async function sendMailWithFallback(message: Mail.Options) {
  try {
    return await transporter.sendMail(message)
  } catch (error) {
    const errorCode = (error as { code?: string })?.code
    if (errorCode === "EAUTH" && fallbackPass && fallbackPass !== primaryPass) {
      const fallbackTransporter = createTransporter(fallbackPass)
      return fallbackTransporter.sendMail(message)
    }

    throw error
  }
}

export async function sendEmail(opts: {
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: Mail.Attachment[]
}) {
  const from = process.env.EMAIL_FROM || user
  const message = {
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  }

  return sendMailWithFallback(message)
}

export default transporter

export async function sendTicketEmail(params: {
  to: string
  subject: string
  html: string
  attachments?: Mail.Attachment[]
}) {
  const from = process.env.EMAIL_FROM || `"Vibe2Gether Events" <${user}>`
  try {
    const info = await sendMailWithFallback({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments,
    })
    console.log("Ticket email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending ticket email:", error)
    return { success: false, error }
  }
}
