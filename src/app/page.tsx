"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [patients, setPatients] = useState([]);
  useEffect(() => {
    const getPatients = async () => {
      const response = await fetch("/api/data");
      const result = await response.json();
      setPatients(result.data);
    };
    getPatients();
  }, []);
  return (
    <main className="p-6 space-y-6 min-h-screen">
      {patients.map((patient) => (
        <p key={patient.patient_id}>{patient.name}</p>
      ))}
    </main>
  );
}
