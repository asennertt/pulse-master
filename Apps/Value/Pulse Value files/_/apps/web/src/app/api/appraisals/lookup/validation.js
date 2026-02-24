export function validateVinRequest(body) {
  const { vin, mileage, condition = "good" } = body;

  if (!vin || vin.length !== 17) {
    return {
      valid: false,
      error: "Valid 17-character VIN is required",
      status: 400,
    };
  }

  if (!mileage || mileage <= 0) {
    return {
      valid: false,
      error: "Valid mileage is required",
      status: 400,
    };
  }

  return {
    valid: true,
    data: { vin, mileage, condition },
  };
}
