import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

interface TicketData {
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  ticketType: string;
  attendeeName: string;
  barcode: string;
  thumbnailUrl?: string;
}

export async function generateTicketPDF(data: TicketData): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();   // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const contentWidth = pageWidth - margin * 2; // 170mm

  const logoPath = path.join(process.cwd(), "public/v2g-logo.png");
  let logoData = "";

  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoData = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }

  // ── Header Section ──
  if (logoData) {
    doc.addImage(logoData, "PNG", 85, 8, 40, 18);
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 120);
  doc.text("Vibe2Gether", pageWidth / 2, 34, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 150);
  doc.text("Event Ticket", pageWidth / 2, 42, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  // Wrap long event names
  const titleLines = doc.splitTextToSize(data.eventName, contentWidth);
  doc.text(titleLines, pageWidth / 2, 54, { align: "center" });

  const titleHeight = titleLines.length * 7;

  // ── Thumbnail Section (aspect-ratio preserved) ──
  let cursorY = 54 + titleHeight + 4;
  const maxImgWidth = 120;  // max width in mm
  const maxImgHeight = 65;  // max height in mm

  if (data.thumbnailUrl) {
    try {
      const response = await fetch(data.thumbnailUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const imgFormat = contentType.includes("png") ? "PNG" : "JPEG";
      const base64 = `data:${contentType};base64,${buffer.toString("base64")}`;

      // Decode image dimensions from the buffer to compute aspect ratio
      let imgWidth = maxImgWidth;
      let imgHeight = maxImgHeight;
      try {
        const props = doc.getImageProperties(base64);
        const aspect = props.width / props.height;
        // Fit within maxImgWidth × maxImgHeight keeping aspect ratio
        if (aspect >= maxImgWidth / maxImgHeight) {
          // Image is wider — constrain by width
          imgWidth = maxImgWidth;
          imgHeight = maxImgWidth / aspect;
        } else {
          // Image is taller — constrain by height
          imgHeight = maxImgHeight;
          imgWidth = maxImgHeight * aspect;
        }
      } catch {
        // Fallback: use max dimensions if we can't detect aspect ratio
        imgWidth = maxImgWidth;
        imgHeight = maxImgHeight;
      }

      const imgX = (pageWidth - imgWidth) / 2; // center horizontally
      doc.addImage(base64, imgFormat, imgX, cursorY, imgWidth, imgHeight);
      cursorY += imgHeight + 8;
    } catch (e) {
      console.error("Failed to load thumbnail for PDF:", e);
    }
  }

  // ── Separator line ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // ── Event Details Section ──
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const details = [
    { label: "Event", value: data.eventName },
    { label: "Date", value: data.eventDate },
    { label: "Time", value: data.eventTime },
    { label: "Venue", value: data.venue },
    { label: "Ticket Type", value: data.ticketType },
    { label: "Attendee", value: data.attendeeName },
    { label: "Ticket #", value: data.barcode },
  ];

  for (const detail of details) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(`${detail.label}:`, margin, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(detail.value, margin + 35, cursorY);
    cursorY += 7;
  }

  cursorY += 4;

  // ── Separator line ──
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // ── QR Code & Barcode Section ──
  // Check if we have enough space, otherwise add a new page
  if (cursorY + 45 > pageHeight - 15) {
    doc.addPage();
    cursorY = 20;
  }

  // QR Code (left)
  const qrCodeDataUrl = await QRCode.toDataURL(data.barcode);
  doc.addImage(qrCodeDataUrl, "PNG", margin, cursorY, 40, 40);

  // Barcode (right, vertically centered with QR)
  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: "code128",
    text: data.barcode,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });

  const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString("base64")}`;
  doc.addImage(barcodeBase64, "PNG", margin + 50, cursorY + 5, 100, 28);

  // ── Footer ──
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 160);
  doc.text("Thank you for choosing Vibe2Gether!", pageWidth / 2, pageHeight - 10, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
