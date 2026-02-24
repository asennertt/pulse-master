import sql from "@/app/api/utils/sql";
import crypto from "crypto";

// Generate shareable link
export async function POST(request, { params }) {
  try {
    const { id } = params;

    // Check if appraisal exists
    const appraisal = await sql`
      SELECT * FROM appraisals WHERE id = ${id}
    `;

    if (appraisal.length === 0) {
      return Response.json({ error: "Appraisal not found" }, { status: 404 });
    }

    // Check if share link already exists
    const existingShare = await sql`
      SELECT share_token FROM shared_appraisals WHERE appraisal_id = ${id}
    `;

    if (existingShare.length > 0) {
      return Response.json({
        token: existingShare[0].share_token,
        url: `${process.env.APP_URL}/shared/${existingShare[0].share_token}`,
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Create share record
    await sql`
      INSERT INTO shared_appraisals (appraisal_id, share_token)
      VALUES (${id}, ${token})
    `;

    // Update appraisal with token
    await sql`
      UPDATE appraisals
      SET shared_link_token = ${token}
      WHERE id = ${id}
    `;

    return Response.json({
      token: token,
      url: `${process.env.APP_URL}/shared/${token}`,
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return Response.json(
      { error: "Failed to create share link" },
      { status: 500 },
    );
  }
}
