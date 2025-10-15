import { NextResponse } from "next/server";

const defaultRefetchTime = 5;

const getPatients = async (page: number) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(
      `https://assessment.ksensetech.com/api/patients?page=${page}&limit=10`,
      {
        headers: {
          "x-api-key": "ak_594ab648d6ce66cd9c5611ae512eda1cf2a0b4aab5c5c173",
          "Content-Type": "application/json",
        },
      }
    );
    const result = await response.json();

    if (page === 1 && !result.pagination.totalPages) {
      console.log(`No pagination provided, trying again after ${defaultRefetchTime} seconds`);
      await new Promise((resolve) => setTimeout(resolve, defaultRefetchTime * 1000));
      continue;
    }

    if (result?.error === "Service temporarily unavailable") {
      console.log(
        `Service temporarily unavailable, trying again after ${defaultRefetchTime} seconds`
      );
      await new Promise((resolve) => setTimeout(resolve, defaultRefetchTime * 1000));
      continue;
    }
    if (result?.error === "Rate limit exceeded") {
      const waitTime = result.retry_after;
      console.log(`Rate limit exceeded, trying again after ${waitTime} seconds`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
      continue;
    }

    return result;
  }
  throw new Error("Unable to resolve all patients");
};

export async function GET() {
  try {
    const firstPage = await getPatients(1);
    const totalPages = firstPage.pagination.totalPages;
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    const results = await Promise.all(remainingPages.map(getPatients));

    const allRecords = [...firstPage.data, ...results.flatMap((result) => result.data)];
    return NextResponse.json(allRecords);
  } catch {
    return NextResponse.json({ error: "Unable to resolve all patients" });
  }
}
