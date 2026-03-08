export function validateVinRequest(body) {
  if (!body.vin) {
    return {
      valid: false,
      error: "VIN is required",
      status: 400,
    };
  }

  if (!body.mileage) {
    return {
      valid: false,
      error: "Mileage is required",
      status: 400,
    };
  }

  return {
    valid: true,
    data: {
      vin: body.vin,
      mileage: body.mileage,
      condition: body.condition || "good",
    },
  };
}
