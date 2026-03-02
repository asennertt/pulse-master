import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: appraisal, error } = await supabase
      .from("appraisals")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !appraisal) {
      return Response.json(
        { error: "Appraisal not found" },
        { status: 404 },
      );
    }

    const { vehicle_data, market_data, appraisal_result } = appraisal;

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    await new Promise((resolve) => {
      doc.on("end", resolve);

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill("#0F172A");
      doc
        .fillColor("#06b6d4")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("PULSE APPRAISING", 50, 25);
      doc
        .fillColor("#94a3b8")
        .fontSize(10)
        .font("Helvetica")
        .text("Internal Appraisal Report", 50, 52);
      doc
        .fillColor("#94a3b8")
        .fontSize(10)
        .text(
          `Generated: ${new Date().toLocaleDateString()}`,
          doc.page.width - 180,
          52,
        );

      doc.moveDown(3);

      // Vehicle Information Section
      doc.fillColor("#1e293b").rect(50, doc.y, doc.page.width - 100, 30).fill();
      doc
        .fillColor("#06b6d4")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("VEHICLE INFORMATION", 60, doc.y - 22);
      doc.moveDown(1.5);

      const fields = [
        ["Year", vehicle_data?.year],
        ["Make", vehicle_data?.make],
        ["Model", vehicle_data?.model],
        ["Trim", vehicle_data?.trim],
        ["Mileage", vehicle_data?.mileage ? `${Number(vehicle_data.mileage).toLocaleString()} miles` : "N/A"],
        ["VIN", vehicle_data?.vin],
        ["Color", vehicle_data?.color],
        ["Condition", vehicle_data?.condition],
      ];

      let col = 0;
      let startY = doc.y;
      fields.forEach(([label, value], idx) => {
        const x = col === 0 ? 60 : doc.page.width / 2 + 10;
        const y = startY + Math.floor(idx / 2) * 28;
        doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(label.toUpperCase(), x, y);
        doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text(String(value || "N/A"), x, y + 12);
        col = col === 0 ? 1 : 0;
      });

      doc.moveDown(fields.length / 2 * 1.5 + 1);

      // Appraisal Values Section
      doc.fillColor("#1e293b").rect(50, doc.y, doc.page.width - 100, 30).fill();
      doc
        .fillColor("#06b6d4")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("APPRAISAL VALUES", 60, doc.y - 22);
      doc.moveDown(1.5);

      const values = [
        ["Trade-In Value", appraisal_result?.tradeInValue],
        ["Retail Value", appraisal_result?.retailValue],
        ["Private Party Value", appraisal_result?.privatePartyValue],
        ["Wholesale Value", appraisal_result?.wholesaleValue],
      ];

      values.forEach(([label, value]) => {
        doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(label.toUpperCase());
        doc
          .fillColor("#1e293b")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(value ? `$${Number(value).toLocaleString()}` : "N/A");
        doc.moveDown(0.5);
      });

      // Market Data Section
      if (market_data) {
        doc.moveDown(1);
        doc.fillColor("#1e293b").rect(50, doc.y, doc.page.width - 100, 30).fill();
        doc
          .fillColor("#06b6d4")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("MARKET DATA", 60, doc.y - 22);
        doc.moveDown(1.5);

        Object.entries(market_data).forEach(([key, value]) => {
          doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(key.toUpperCase());
          doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text(String(value || "N/A"));
          doc.moveDown(0.3);
        });
      }

      // Footer
      doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill("#0F172A");
      doc
        .fillColor("#475569")
        .fontSize(8)
        .text(
          "Pulse Appraising Internal Report — Confidential © 2024",
          50,
          doc.page.height - 30,
          { align: "center" },
        );

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="appraisal-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return Response.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
