import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import bwipjs from 'bwip-js'
import path from 'path'
import fs from 'fs'

interface TicketData {
  eventName: string
  eventDate: string
  eventTime: string
  venue: string
  address: string
  ticketType: string
  attendeeName: string
  barcode: string
  thumbnailUrl?: string
}

export async function generateTicketPDF(data: TicketData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate required fields
      if (!data.barcode) {
        throw new Error('Barcode is required for ticket generation')
      }

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width
      const pageHeight = doc.page.height
      const margin = 50
      const contentWidth = pageWidth - margin * 2

      // Load logo
      const logoPath = path.join(process.cwd(), 'public/v2g-logo.png')
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 20, { width: 80, align: 'center' })
      }

      // Header
      doc.fontSize(24)
        .fillColor('#1e3a8a')
        .text('Vibe2Gether', margin, 70, { align: 'center' })

      doc.fontSize(16)
        .fillColor('#4b5563')
        .text('Event Ticket', margin, 95, { align: 'center' })

      // Event Title
      doc.fontSize(20)
        .fillColor('#111827')
        .text(data.eventName || 'Event', margin, 120, {
          align: 'center',
          width: contentWidth
        })

      let cursorY = 160

      // Separator
      doc.moveTo(margin, cursorY)
        .lineTo(pageWidth - margin, cursorY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke()

      cursorY += 20

      // Event Details
      doc.fontSize(12)
        .fillColor('#374151')

      const details = [
        { label: 'Event', value: data.eventName || 'N/A' },
        { label: 'Date', value: data.eventDate || 'N/A' },
        { label: 'Time', value: data.eventTime || 'N/A' },
        { label: 'Venue', value: data.venue || 'N/A' },
        { label: 'Ticket Type', value: data.ticketType || 'Standard' },
        { label: 'Attendee', value: data.attendeeName || 'N/A' },
        { label: 'Ticket #', value: data.barcode },
      ]

      for (const detail of details) {
        doc.fontSize(11)
          .fillColor('#6b7280')
          .text(`${detail.label}:`, margin, cursorY)

        doc.fontSize(11)
          .fillColor('#111827')
          .text(detail.value, margin + 80, cursorY)

        cursorY += 20
      }

      cursorY += 10

      // Separator
      doc.moveTo(margin, cursorY)
        .lineTo(pageWidth - margin, cursorY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke()

      cursorY += 20

      // QR Code
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(data.barcode, {
          errorCorrectionLevel: 'M'
        })
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
        doc.image(qrBuffer, margin, cursorY, { width: 100 })
      } catch (qrError) {
        console.error('Failed to generate QR code:', qrError)
        // Continue without QR code if it fails
      }

      // Barcode
      try {
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: data.barcode,
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        })
        doc.image(barcodeBuffer, margin + 120, cursorY + 10, { width: 250 })
      } catch (barcodeError) {
        console.error('Failed to generate barcode:', barcodeError)
        // Continue without barcode if it fails
      }

      // Footer
      doc.fontSize(10)
        .fillColor('#9ca3af')
        .text('Thank you for choosing Vibe2Gether!', margin, pageHeight - 30, {
          align: 'center'
        })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
