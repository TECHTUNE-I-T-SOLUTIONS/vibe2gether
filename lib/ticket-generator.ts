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
  const logoPath = path.join(process.cwd(), "public/v2g-logo.png");
  let logoData = "";

  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoData = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }

  // Header Section
  if (logoData) {
    doc.addImage(logoData, "PNG", 85, 8, 40, 18);
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 120);
  doc.text("Vibe2Gether", 105, 34, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50, 50, 150);
  doc.text("Event Ticket", 105, 42, { align: "center" });

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.eventName, 105, 55, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);

  // Fetch and add Thumbnail
  let startY = 75;
  if (data.thumbnailUrl) {
    try {
      const response = await fetch(data.thumbnailUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      doc.addImage(base64, "JPEG", 20, 65, 170, 95);
      startY = 175; // Shift the rest down
    } catch (e) {
      console.error("Failed to load thumbnail for PDF:", e);
    }
  }

  // Content Section
  const leftColX = 20;

  doc.text(`Event: ${data.eventName}`, leftColX, startY);
  doc.text(`Date: ${data.eventDate}`, leftColX, startY + 10);
  doc.text(`Time: ${data.eventTime}`, leftColX, startY + 20);
  doc.text(`Venue: ${data.venue}`, leftColX, startY + 30);
  doc.text(`Address: ${data.address}`, leftColX, startY + 40);
  doc.text(`Ticket Type: ${data.ticketType}`, leftColX, startY + 50);
  doc.text(`Attendee Name: ${data.attendeeName}`, leftColX, startY + 60);
  doc.text(`Barcode: ${data.barcode}`, leftColX, startY + 70);

  // Generate QR Code
  const qrCodeDataUrl = await QRCode.toDataURL(data.barcode);
  doc.addImage(qrCodeDataUrl, "PNG", 20, startY + 80, 50, 50);

  // Generate Barcode using bwip-js
  // Note: bwipjs returns a Buffer in Node.js
  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: "code128", // Barcode type
    text: data.barcode, // Text to encode
    scale: 3, // 3x scaling factor
    height: 10, // Bar height, in millimeters
    includetext: true, // Show human-readable text
    textxalign: "center", // Always good to set this
  });
  
  const barcodeBase64 = `data:image/png;base64,${barcodeBuffer.toString("base64")}`;
  doc.addImage(barcodeBase64, "PNG", 80, startY + 80, 100, 30);

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for your business!", 105, 280, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
