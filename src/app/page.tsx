"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [patients, setPatients] = useState([]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const getPatients = async () => {
      const response = await fetch("/api/data");
      const result = await response.json();
      
      if (result?.error) {
        setHasError(true);
      } else {
        setPatients(result);
      }
    };
    getPatients();
  }, []);

  if (hasError) {
    return (
      <main className="p-6 space-y-6 min-h-screen">
        <h1>{hasError.toString()}</h1>
      </main>
    );
  }
  return (
    <main className="p-6 space-y-6 min-h-screen">
      {patients.map((patient) => (
        <p key={patient.patient_id}>{patient.name}</p>
      ))}
    </main>
  );
}
