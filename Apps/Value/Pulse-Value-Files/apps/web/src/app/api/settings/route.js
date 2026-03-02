import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// GET company settings and user settings
export async function GET() {
  try {
    const session = await auth();

    // Get company settings
    const companySettings = await sql`
      SELECT * FROM company_settings ORDER BY id DESC LIMIT 1
    `;

    let userSettings = { zip_code: "" };

    // If user is logged in, get their ZIP code
    if (session?.user?.id) {
      const userResult = await sql`
        SELECT zip_code FROM auth_users WHERE id = ${session.user.id}
      `;
      if (userResult.length > 0) {
        userSettings.zip_code = userResult[0].zip_code || "";
      }
    }

    if (companySettings.length === 0) {
      return Response.json({
        company_name: "Pulse Appraising",
        tagline: "Real-Time Market Intelligence",
        email: "",
        phone: "",
        address: "",
        website: "",
        logo_url: "",
        zip_code: userSettings.zip_code,
        market_search_radius: 100, // Default
      });
    }

    return Response.json({
      ...companySettings[0],
      zip_code: userSettings.zip_code,
      market_search_radius: companySettings[0].market_search_radius || 100,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// UPDATE company settings and user settings
export async function PUT(request) {
  try {
    const session = await auth();
    const body = await request.json();
    const {
      company_name,
      phone,
      email,
      address,
      website,
      tagline,
      logo_url,
      zip_code,
      market_search_radius,
    } = body;

    // Update user's ZIP code if logged in
    if (session?.user?.id && zip_code !== undefined) {
      await sql`
        UPDATE auth_users
        SET zip_code = ${zip_code}
        WHERE id = ${session.user.id}
      `;
    }

    // Get existing company settings
    const existing = await sql`
      SELECT id FROM company_settings ORDER BY id DESC LIMIT 1
    `;

    if (existing.length === 0) {
      // Insert new settings
      const result = await sql`
        INSERT INTO company_settings (
          company_name, phone, email, address, website, tagline, logo_url, market_search_radius, updated_at
        ) VALUES (
          ${company_name}, ${phone}, ${email}, ${address}, ${website}, ${tagline}, ${logo_url}, ${market_search_radius || 100}, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;
      return Response.json({ ...result[0], zip_code });
    } else {
      // Update existing settings
      const result = await sql`
        UPDATE company_settings
        SET 
          company_name = ${company_name},
          phone = ${phone},
          email = ${email},
          address = ${address},
          website = ${website},
          tagline = ${tagline},
          logo_url = ${logo_url},
          market_search_radius = ${market_search_radius || 100},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
      return Response.json({ ...result[0], zip_code });
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
