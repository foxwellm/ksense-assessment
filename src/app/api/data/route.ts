import { NextResponse } from "next/server";

export async function GET() {
  const response = await fetch("https://assessment.ksensetech.com/api/patients", {
    headers: {
      "x-api-key": "ak_594ab648d6ce66cd9c5611ae512eda1cf2a0b4aab5c5c173",
      "Content-Type": "application/json",
    },
  });
  const result = await response.json();
  return NextResponse.json(result);
}
