import sql from "@/app/api/utils/sql";

// GET single appraisal by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      SELECT * FROM appraisals 
      WHERE id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Appraisal not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error fetching appraisal:", error);
    return Response.json(
      { error: "Failed to fetch appraisal" },
      { status: 500 },
    );
  }
}
