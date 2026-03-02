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

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    await new Promise((resolve) => {
      doc.on("end", resolve);

      // Header
      doc
        .rect(0, 0, doc.page.width, 80)
        .fill("#0F172A");

      doc
        .fillColor("#06b6d4")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("PULSE APPRAISING", 50, 25);

      doc
        .fillColor("#94a3b8")
        .fontSize(10)
        .font("Helvetica")
        .text("Vehicle Appraisal Report", 50, 52);

      doc
        .fillColor("#94a3b8")
        .fontSize(10)
        .text(
          `Generated: ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          doc.page.width - 200,
          52,
        );

      doc.moveDown(3);

      // Vehicle Info
      doc
        .fillColor("#1e293b")
        .rect(50, doc.y, doc.page.width - 100, 30)
        .fill();

      doc
        .fillColor("#06b6d4")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("VEHICLE INFORMATION", 60, doc.y - 22);

      doc.moveDown(1.5);

      const vehicleFields = [
        ["Year", vehicle_data?.year],
        ["Make", vehicle_data?.make],
        ["Model", vehicle_data?.model],
        ["Trim", vehicle_data?.trim],
        ["Mileage", vehicle_data?.mileage ? `${Number(vehicle_data.mileage).toLocaleString()} miles` : "N/A"],
        ["Color", vehicle_data?.color],
        ["Condition", vehicle_data?.condition],
        ["VIN", vehicle_data?.vin],
      ];

      let col = 0;
      let startY = doc.y;
      vehicleFields.forEach(([label, value], idx) => {
        const x = col === 0 ? 60 : doc.page.width / 2 + 10;
        const y = startY + Math.floor(idx / 2) * 28;
        doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(label.toUpperCase(), x, y);
        doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text(value || "N/A", x, y + 12);
        col = col === 0 ? 1 : 0;
      });

      doc.moveDown(vehicleFields.length / 2 * 1.5 + 1);

      // Appraisal Value
      doc
        .fillColor("#1e293b")
        .rect(50, doc.y, doc.page.width - 100, 30)
        .fill();

      doc
        .fillColor("#06b6d4")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("APPRAISAL VALUE", 60, doc.y - 22);

      doc.moveDown(1.5);

      const values = [
        { label: "Trade-In Value", value: appraisal_result?.tradeInValue, color: "#06b6d4" },
        { label: "Retail Value", value: appraisal_result?.retailValue, color: "#10b981" },
        { label: "Private Party", value: appraisal_result?.privatePartyValue, color: "#f59e0b" },
      ];

      const boxWidth = (doc.page.width - 140) / 3;
      let boxX = 50;
      const boxY = doc.y;

      values.forEach(({ label, value, color }) => {
        doc.rect(boxX, boxY, boxWidth - 10, 60).fill("#f8fafc");
        doc.fillColor(color).fontSize(9).font("Helvetica-Bold").text(label.toUpperCase(), boxX + 10, boxY + 10, { width: boxWidth - 30 });
        doc
          .fillColor("#0f172a")
          .fontSize(18)
          .font("Helvetica-Bold")
          .text(
            value ? `$${Number(value).toLocaleString()}` : "N/A",
            boxX + 10,
            boxY + 28,
          );
        boxX += boxWidth;
      });

      doc.moveDown(4);

      // Market Analysis
      if (market_data) {
        doc
          .fillColor("#1e293b")
          .rect(50, doc.y, doc.page.width - 100, 30)
          .fill();

        doc
          .fillColor("#06b6d4")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("MARKET ANALYSIS", 60, doc.y - 22);

        doc.moveDown(1.5);

        const marketFields = [
          ["Market Average", market_data?.averagePrice ? `$${Number(market_data.averagePrice).toLocaleString()}` : "N/A"],
          ["Price Range", market_data?.priceRange || "N/A"],
          ["Days on Market", market_data?.daysOnMarket ? `${market_data.daysOnMarket} days` : "N/A"],
          ["Market Demand", market_data?.demand || "N/A"],
        ];

        marketFields.forEach(([label, value]) => {
          doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(label.toUpperCase());
          doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text(value);
          doc.moveDown(0.5);
        });
      }

      // Notes
      if (appraisal_result?.notes) {
        doc.moveDown(1);
        doc
          .fillColor("#1e293b")
          .rect(50, doc.y, doc.page.width - 100, 30)
          .fill();

        doc
          .fillColor("#06b6d4")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("APPRAISER NOTES", 60, doc.y - 22);

        doc.moveDown(1.5);
        doc
          .fillColor("#334155")
          .fontSize(10)
          .font("Helvetica")
          .text(appraisal_result.notes, { width: doc.page.width - 100 });
      }

      // Footer
      doc
        .rect(0, doc.page.height - 50, doc.page.width, 50)
        .fill("#0F172A");

      doc
        .fillColor("#475569")
        .fontSize(8)
        .text(
          "This appraisal is valid for 30 days from the date of issue. Pulse Appraising © 2024",
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
        "Content-Disposition": `attachment; filename="appraisal-${params.id}-customer.pdf"`,
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
