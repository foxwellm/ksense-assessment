import { Patient, PatientRisk } from "@/types/patient";
import { NextResponse } from "next/server";

const defaultRefetchTime = 5;

const processPatients = (patients: Patient[]): PatientRisk => {
  const high_risk_patients: PatientRisk["high_risk_patients"] = [];
  const fever_patients: PatientRisk["fever_patients"] = [];
  const data_quality_issues: PatientRisk["data_quality_issues"] = [];

  for (const patient of patients) {
    let totalRiskScore = 0;
    let hasDataIssues = false;

    if (typeof patient?.temperature === "number") {
      if (patient.temperature >= 99.6) {
        fever_patients.push(patient.patient_id);
        totalRiskScore++;
      }
      if (patient.temperature >= 101) {
        totalRiskScore++;
      }
    } else {
      hasDataIssues = true;
    }

    if (typeof patient?.age === "number") {
      if (patient.age >= 40) {
        totalRiskScore++;
      }
      if (patient.age > 65) {
        totalRiskScore++;
      }
    } else {
      hasDataIssues = true;
    }

    if (typeof patient?.blood_pressure === "string") {
      const bloodPressure = patient.blood_pressure.split("/");

      const [systolicStr, diastolicStr] = bloodPressure;
      const systolic = Number(systolicStr);
      const diastolic = Number(diastolicStr);
      const trueSystolic = Number.isFinite(systolic) && systolicStr.length;
      const trueDiastolic = Number.isFinite(diastolic) && diastolicStr.length;

      if (!trueSystolic || !trueDiastolic || bloodPressure.length !== 2) {
        hasDataIssues = true;
      } else {
        if (systolic >= 140 || diastolic >= 90) {
          totalRiskScore = totalRiskScore + 3;
        } else if (systolic >= 130 || diastolic >= 80) {
          totalRiskScore = totalRiskScore + 2;
        } else if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
          totalRiskScore++;
        }
      }
    } else {
      hasDataIssues = true;
    }

    if (hasDataIssues) {
      data_quality_issues.push(patient.patient_id);
    }

    if (totalRiskScore >= 4) {
      high_risk_patients.push(patient.patient_id);
    }
  }

  return {
    high_risk_patients,
    fever_patients,
    data_quality_issues,
  };
};

const getPatients = async (page: number) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(
      `https://assessment.ksensetech.com/api/patients?page=${page}&limit=10`,
      {
        headers: {
          "x-api-key": process.env.X_API_KEY!,
          "Content-Type": "application/json",
        },
      }
    );
    const result = await response.json();

    if (result?.error === "Rate limit exceeded") {
      const waitTime = result.retry_after;
      console.log(`Rate limit exceeded, trying again after ${waitTime} seconds`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
      continue;
    }

    // Generic errors: "Service temporarily unavailable" || "Bad gateway"
    if (result?.error || !result?.data) {
      console.log(
        `Service temporarily unavailable, trying again after ${defaultRefetchTime} seconds`
      );
      await new Promise((resolve) => setTimeout(resolve, defaultRefetchTime * 1000));
      continue;
    }

    if (page === 1 && !result.pagination.totalPages) {
      console.log(`No pagination provided, trying again after ${defaultRefetchTime} seconds`);
      await new Promise((resolve) => setTimeout(resolve, defaultRefetchTime * 1000));
      continue;
    }

    // Ensure all patients are gathered
    if (
      result.data.every((patient: Patient) => {
        return !!patient.patient_id;
      }) === false
    ) {
      console.log(
        `Not every patient in page returned, trying again after ${defaultRefetchTime} seconds`
      );
      await new Promise((resolve) => setTimeout(resolve, defaultRefetchTime * 1000));
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

    const allPatients = [...firstPage.data, ...results.flatMap((result) => result.data)];
    const processedPatients = processPatients(allPatients);
    console.log("🚀 ~ route.ts:143 ~ GET ~ processedPatients:", processedPatients);
    return NextResponse.json({ allPatients, processedPatients });
  } catch (err) {
    console.error("Error fetching patients:", err);
    return NextResponse.json({ error: "Unable to resolve all patients" });
  }
}
