import sql from "@/app/api/utils/sql";

// Get shared appraisal by token
export async function GET(request, { params }) {
  try {
    const { token } = params;

    // Find the shared appraisal
    const shared = await sql`
      SELECT appraisal_id FROM shared_appraisals
      WHERE share_token = ${token}
    `;

    if (shared.length === 0) {
      return Response.json(
        { error: "Shared appraisal not found" },
        { status: 404 },
      );
    }

    // Get the appraisal
    const appraisal = await sql`
      SELECT * FROM appraisals
      WHERE id = ${shared[0].appraisal_id}
    `;

    if (appraisal.length === 0) {
      return Response.json({ error: "Appraisal not found" }, { status: 404 });
    }

    // Get company settings
    const settings = await sql`
      SELECT * FROM company_settings ORDER BY id DESC LIMIT 1
    `;

    // Increment view count
    await sql`
      UPDATE shared_appraisals
      SET view_count = view_count + 1
      WHERE share_token = ${token}
    `;

    return Response.json({
      appraisal: appraisal[0],
      company: settings[0] || {
        company_name: "Pulse Appraising",
        tagline: "Real-Time Market Intelligence",
      },
    });
  } catch (error) {
    console.error("Error fetching shared appraisal:", error);
    return Response.json(
      { error: "Failed to fetch shared appraisal" },
      { status: 500 },
    );
  }
}
