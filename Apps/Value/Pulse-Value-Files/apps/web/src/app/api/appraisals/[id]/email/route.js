import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request, { params }) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerEmail, customerName } = await request.json();

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

    const { vehicle_data, appraisal_result } = appraisal;

    await resend.emails.send({
      from: "Pulse Appraising <appraisals@pulseappraising.com>",
      to: customerEmail,
      subject: `Your Vehicle Appraisal - ${vehicle_data?.year} ${vehicle_data?.make} ${vehicle_data?.model}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B1120; color: #e2e8f0; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #06b6d4; font-size: 28px; margin: 0;">PULSE APPRAISING</h1>
            <p style="color: #64748b; margin: 8px 0 0;">Vehicle Appraisal Report</p>
          </div>
          
          <p style="color: #94a3b8;">Dear ${customerName || "Valued Customer"},</p>
          <p style="color: #94a3b8;">Thank you for choosing Pulse Appraising. Here is your vehicle appraisal summary:</p>
          
          <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #06b6d4; font-size: 16px; margin: 0 0 16px;">VEHICLE DETAILS</h2>
            <p style="margin: 8px 0; color: #e2e8f0;"><strong>${vehicle_data?.year} ${vehicle_data?.make} ${vehicle_data?.model} ${vehicle_data?.trim || ""}</strong></p>
            <p style="margin: 4px 0; color: #94a3b8;">Mileage: ${vehicle_data?.mileage ? Number(vehicle_data.mileage).toLocaleString() : "N/A"} miles</p>
            <p style="margin: 4px 0; color: #94a3b8;">Condition: ${vehicle_data?.condition || "N/A"}</p>
          </div>
          
          <div style="background: #1e293b; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <h2 style="color: #06b6d4; font-size: 16px; margin: 0 0 16px;">APPRAISAL VALUES</h2>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 150px; background: #0f172a; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">TRADE-IN VALUE</p>
                <p style="color: #06b6d4; font-size: 24px; font-weight: bold; margin: 0;">$${appraisal_result?.tradeInValue ? Number(appraisal_result.tradeInValue).toLocaleString() : "N/A"}</p>
              </div>
              <div style="flex: 1; min-width: 150px; background: #0f172a; border-radius: 8px; padding: 16px; text-align: center;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 8px;">RETAIL VALUE</p>
                <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0;">$${appraisal_result?.retailValue ? Number(appraisal_result.retailValue).toLocaleString() : "N/A"}</p>
              </div>
            </div>
          </div>
          
          <p style="color: #475569; font-size: 12px; text-align: center; margin-top: 32px;">This appraisal is valid for 30 days. Pulse Appraising © 2024</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
