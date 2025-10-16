"use client";
import { Patient, PatientRisk } from "@/types/patient";
import { useEffect, useState } from "react";

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [processed, setProcessed] = useState<PatientRisk | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getPatients = async () => {
      const response = await fetch("/api/data");
      const result = await response.json();

      if (result?.error) {
        setHasError(true);
      } else {
        setProcessed(result.processedPatients);
        setPatients(result.allPatients);
      }
      setIsLoading(false);
    };
    getPatients();
  }, []);

  if (isLoading) {
    return (
      <main className="p-6 space-y-6 min-h-screen">
        <h1>Loading</h1>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="p-6 space-y-6 min-h-screen">
        <h1>{hasError.toString()}</h1>
      </main>
    );
  }
  return (
    <main className="p-6 space-y-6 min-h-screen">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2 text-left">Patient ID</th>
            <th className="border px-4 py-2 text-left">Name</th>
            <th className="border px-4 py-2 text-left">Age</th>
            <th className="border px-4 py-2 text-left">Temperature</th>
            <th className="border px-4 py-2 text-left">Blood Pressure</th>
            <th className="border px-4 py-2 text-left">Is HIGH RISK</th>
            <th className="border px-4 py-2 text-left">Is FEVER</th>
            <th className="border px-4 py-2 text-left">Is DATA QUALITY</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(({ patient_id, name, age, temperature, blood_pressure }) => (
            <tr key={patient_id}>
              <td className="border px-4 py-2">{patient_id}</td>
              <td className="border px-4 py-2">{name}</td>
              <td className="border px-4 py-2">{age}</td>
              <td className="border px-4 py-2">{temperature}</td>
              <td className="border px-4 py-2">{blood_pressure}</td>
              <td className="border px-4 py-2">
                {processed?.high_risk_patients.includes(patient_id) ? "Yes" : "no"}
              </td>
              <td className="border px-4 py-2">
                {processed?.fever_patients.includes(patient_id) ? "Yes" : "no"}
              </td>
              <td className="border px-4 py-2">
                {processed?.data_quality_issues.includes(patient_id) ? "Yes" : "no"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
