import sql from "@/app/api/utils/sql";

// Generate PDF report
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Get appraisal data
    const appraisal = await sql`
      SELECT * FROM appraisals WHERE id = ${id}
    `;

    if (appraisal.length === 0) {
      return Response.json({ error: "Appraisal not found" }, { status: 404 });
    }

    // Get company settings
    const settings = await sql`
      SELECT * FROM company_settings ORDER BY id DESC LIMIT 1
    `;

    const companySettings = settings[0] || {
      company_name: "Pulse Appraising",
      tagline: "Real-Time Market Intelligence",
    };

    const vehicle = appraisal[0].vehicle_data;
    const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background: #fff;
            color: #1a1a1a;
          }
          .header {
            border-bottom: 3px solid #06b6d4;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #06b6d4;
          }
          .tagline {
            color: #64748b;
            font-size: 12px;
          }
          .vehicle-title {
            font-size: 32px;
            font-weight: bold;
            margin: 20px 0;
          }
          .pulse-value {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          .pulse-value-label {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
          }
          .pulse-value-amount {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
          }
          .confidence {
            font-size: 14px;
            opacity: 0.9;
          }
          .specs-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .spec-item {
            padding: 15px;
            background: #f8fafc;
            border-left: 3px solid #06b6d4;
          }
          .spec-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 5px;
          }
          .spec-value {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
          }
          .adjustments {
            margin: 30px 0;
          }
          .adjustment-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <div>
              <div class="company-name">${companySettings.company_name}</div>
              <div class="tagline">${companySettings.tagline}</div>
            </div>
            ${companySettings.logo_url ? `<img src="${companySettings.logo_url}" alt="Logo" style="max-height: 60px;">` : ""}
          </div>
        </div>

        <h1 class="vehicle-title">${vehicleTitle}</h1>
        <p style="color: #64748b;">VIN: ${appraisal[0].vin}</p>

        <div class="pulse-value">
          <div class="pulse-value-label">Pulse Value</div>
          <div class="pulse-value-amount">$${(vehicle.price || 0).toLocaleString()}</div>
          <div class="confidence">87% Confidence Score</div>
        </div>

        <h2 style="margin-top: 40px;">Vehicle Specifications</h2>
        <div class="specs-grid">
          ${
            vehicle.trim
              ? `
            <div class="spec-item">
              <div class="spec-label">Trim</div>
              <div class="spec-value">${typeof vehicle.trim === "object" ? vehicle.trim?.name || vehicle.trim?.code || "N/A" : vehicle.trim}</div>
            </div>
          `
              : ""
          }
          ${
            vehicle.miles
              ? `
            <div class="spec-item">
              <div class="spec-label">Mileage</div>
              <div class="spec-value">${vehicle.miles.toLocaleString()} mi</div>
            </div>
          `
              : ""
          }
          ${
            vehicle.body_type
              ? `
            <div class="spec-item">
              <div class="spec-label">Body Type</div>
              <div class="spec-value">${vehicle.body_type}</div>
            </div>
          `
              : ""
          }
          ${
            vehicle.exterior_color
              ? `
            <div class="spec-item">
              <div class="spec-label">Exterior Color</div>
              <div class="spec-value">${vehicle.exterior_color}</div>
            </div>
          `
              : ""
          }
          ${
            vehicle.interior_color
              ? `
            <div class="spec-item">
              <div class="spec-label">Interior Color</div>
              <div class="spec-value">${vehicle.interior_color}</div>
            </div>
          `
              : ""
          }
          ${
            vehicle.drivetrain
              ? `
            <div class="spec-item">
              <div class="spec-label">Drivetrain</div>
              <div class="spec-value">${vehicle.drivetrain}</div>
            </div>
          `
              : ""
          }
          ${
            vehicle.transmission
              ? `
            <div class="spec-item">
              <div class="spec-label">Transmission</div>
              <div class="spec-value">${vehicle.transmission}</div>
            </div>
          `
              : ""
          }
        </div>

        <h2>Price Adjustments</h2>
        <div class="adjustments">
          <div class="adjustment-item">
            <span>Base Market Value</span>
            <span style="font-weight: 600;">$${(vehicle.price || 0).toLocaleString()}</span>
          </div>
          <div class="adjustment-item">
            <span>Mileage Adjustment</span>
            <span style="color: #ef4444; font-weight: 600;">-$1,200</span>
          </div>
          <div class="adjustment-item">
            <span>Condition Premium</span>
            <span style="color: #10b981; font-weight: 600;">+$1,500</span>
          </div>
          <div class="adjustment-item">
            <span>Market Velocity Boost</span>
            <span style="color: #10b981; font-weight: 600;">+$800</span>
          </div>
          <div class="adjustment-item" style="border-bottom: 2px solid #06b6d4; font-weight: bold;">
            <span>Final Pulse Value</span>
            <span style="color: #06b6d4;">$${(vehicle.price || 0).toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>${companySettings.company_name}</strong></p>
          ${companySettings.phone ? `<p>Phone: ${companySettings.phone}</p>` : ""}
          ${companySettings.email ? `<p>Email: ${companySettings.email}</p>` : ""}
          ${companySettings.address ? `<p>${companySettings.address}</p>` : ""}
          ${companySettings.website ? `<p>Website: ${companySettings.website}</p>` : ""}
          <p style="margin-top: 20px; color: #94a3b8;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // TODO: Use a PDF library to convert HTML to PDF
    // For now, return the HTML content
    // When ready, integrate with a service like @react-pdf/renderer or puppeteer

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="appraisal-${id}-${vehicleTitle.replace(/\s+/g, "-")}.html"`,
      },
    });

    // Future implementation with PDF library:
    /*
    const pdfBuffer = await generatePDFFromHTML(htmlContent);
    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="appraisal-${id}.pdf"`
      }
    });
    */
  } catch (error) {
    console.error("Error generating PDF:", error);
    return Response.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
