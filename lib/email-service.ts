import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

const host = process.env.EMAIL_HOST || 'smtp.vibe2gether.com'
const port = Number(process.env.EMAIL_PORT || 587)
const secure = process.env.EMAIL_SECURE === 'true'
const user = process.env.EMAIL_USER || 'events@vibe2gether.com'
const pass = process.env.EMAIL_PASS || ''
const passFallback = process.env.EMAIL_PASS_II || ''

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

const transporter = createTransporter(pass)

export async function sendEmail(opts: {
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: Mail.Attachment[]
}) {
  const from = process.env.EMAIL_FROM || user
  const info = await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  })

  return info
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
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.attachments,
    })
    console.log("Ticket email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
      const errorCode = (error as { code?: string })?.code
      if (errorCode === "EAUTH" && passFallback) {
      try {
        const fallbackTransporter = createTransporter(passFallback)
        const info = await fallbackTransporter.sendMail({
          from,
          to: params.to,
          subject: params.subject,
          html: params.html,
          attachments: params.attachments,
        })
        console.log("Ticket email sent with fallback auth: %s", info.messageId)
        return { success: true, messageId: info.messageId }
      } catch (fallbackError) {
        console.error("Error sending ticket email with fallback auth:", fallbackError)
        return { success: false, error: fallbackError }
      }
    }

    console.error("Error sending ticket email:", error)
    return { success: false, error }
  }
}

