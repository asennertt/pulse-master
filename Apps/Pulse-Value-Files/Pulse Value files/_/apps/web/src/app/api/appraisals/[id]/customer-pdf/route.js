import sql from "@/app/api/utils/sql";

// Generate Customer-Facing Trade-In PDF
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
      tagline: "Your Trusted Vehicle Appraisal Partner",
      phone: "(555) 123-4567",
      email: "info@pulseappraising.com",
    };

    const vehicle = appraisal[0].vehicle_data;
    const calculation = vehicle.calculation || {};
    const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    // Calculate trade-in value (simplified for customer)
    // Using a default profit of $3000 and reconditioning of $1500
    const pulseValue = vehicle.price || 0;
    const tradeInValue = Math.max(0, pulseValue - 4500);

    // Generate HTML for Customer PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            color: #1a1a1a;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          .header {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          .tagline {
            font-size: 14px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
          }
          .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 15px;
            font-weight: 600;
            position: relative;
            z-index: 1;
          }
          .content {
            padding: 40px;
          }
          .vehicle-title {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1a1a1a;
            text-align: center;
          }
          .vin-display {
            text-align: center;
            color: #64748b;
            font-size: 14px;
            margin-bottom: 40px;
            font-family: monospace;
          }
          .trade-in-banner {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
          }
          .trade-in-label {
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.95;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .trade-in-value {
            font-size: 56px;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .trade-in-subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 10px;
          }
          .info-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            border-left: 5px solid #06b6d4;
          }
          .info-title {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 15px;
          }
          .specs-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .spec-item {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          .spec-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 5px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .spec-value {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
          }
          .highlights {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            padding: 25px;
            border-radius: 12px;
            margin: 20px 0;
          }
          .highlights h3 {
            font-size: 16px;
            color: #92400e;
            margin-bottom: 15px;
            font-weight: bold;
          }
          .highlight-list {
            list-style: none;
          }
          .highlight-item {
            padding: 8px 0;
            color: #78350f;
            font-size: 14px;
            display: flex;
            align-items: center;
          }
          .highlight-item::before {
            content: '✓';
            display: inline-block;
            width: 24px;
            height: 24px;
            background: #10b981;
            color: white;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            margin-right: 12px;
            font-weight: bold;
            font-size: 12px;
          }
          .next-steps {
            background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
          }
          .next-steps h3 {
            color: #5b21b6;
            font-size: 18px;
            margin-bottom: 15px;
            font-weight: bold;
          }
          .next-steps p {
            color: #6b21a8;
            line-height: 1.6;
            margin-bottom: 10px;
          }
          .footer {
            background: #f8fafc;
            padding: 30px 40px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: bold;
            color: #06b6d4;
            margin-bottom: 15px;
          }
          .contact-info {
            color: #64748b;
            font-size: 14px;
            line-height: 1.8;
          }
          .contact-info a {
            color: #06b6d4;
            text-decoration: none;
          }
          .timestamp {
            margin-top: 20px;
            color: #94a3b8;
            font-size: 12px;
          }
          .divider {
            height: 2px;
            background: linear-gradient(to right, transparent, #e2e8f0, transparent);
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">${companySettings.company_name}</div>
            <div class="tagline">${companySettings.tagline}</div>
            <div class="badge">🎯 TRADE-IN APPRAISAL</div>
          </div>

          <div class="content">
            <h1 class="vehicle-title">${vehicleTitle}</h1>
            <div class="vin-display">VIN: ${appraisal[0].vin}</div>

            <div class="trade-in-banner">
              <div class="trade-in-label">Your Trade-In Value</div>
              <div class="trade-in-value">$${tradeInValue.toLocaleString()}</div>
              <div class="trade-in-subtitle">✨ Valid for 7 days from appraisal date</div>
            </div>

            <div class="info-card">
              <div class="info-title">📋 Vehicle Information</div>
              <div class="specs-grid">
                ${
                  vehicle.trim
                    ? `
                  <div class="spec-item">
                    <div class="spec-label">Trim Level</div>
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
                    <div class="spec-value">${vehicle.miles.toLocaleString()} miles</div>
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
                  vehicle.body_type
                    ? `
                  <div class="spec-item">
                    <div class="spec-label">Body Style</div>
                    <div class="spec-value">${vehicle.body_type}</div>
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
                ${
                  vehicle.engine
                    ? `
                  <div class="spec-item">
                    <div class="spec-label">Engine</div>
                    <div class="spec-value">${vehicle.engine}</div>
                  </div>
                `
                    : ""
                }
              </div>
            </div>

            <div class="highlights">
              <h3>🌟 Vehicle Highlights</h3>
              <ul class="highlight-list">
                <li class="highlight-item">Professionally appraised using real-time market data</li>
                <li class="highlight-item">Competitive valuation based on current inventory</li>
                <li class="highlight-item">Fair assessment of vehicle condition and features</li>
                <li class="highlight-item">Transparent and straightforward trade-in process</li>
              </ul>
            </div>

            <div class="divider"></div>

            <div class="next-steps">
              <h3>🚀 Next Steps</h3>
              <p><strong>Ready to move forward?</strong> Contact us to complete your trade-in and explore our current inventory.</p>
              <p>This appraisal is valid for 7 days. Market conditions may affect pricing after this period.</p>
              <p>Questions? Our team is here to help make your trade-in experience smooth and hassle-free!</p>
            </div>
          </div>

          <div class="footer">
            <div class="footer-logo">${companySettings.company_name}</div>
            <div class="contact-info">
              ${companySettings.phone ? `<div>📞 ${companySettings.phone}</div>` : ""}
              ${companySettings.email ? `<div>📧 <a href="mailto:${companySettings.email}">${companySettings.email}</a></div>` : ""}
              ${companySettings.address ? `<div>📍 ${companySettings.address}</div>` : ""}
              ${companySettings.website ? `<div>🌐 <a href="${companySettings.website}">${companySettings.website}</a></div>` : ""}
            </div>
            <div class="timestamp">
              Appraisal generated on ${new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="trade-in-appraisal-${vehicleTitle.replace(/\s+/g, "-")}.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating customer PDF:", error);
    return Response.json(
      { error: "Failed to generate customer PDF" },
      { status: 500 },
    );
  }
}
