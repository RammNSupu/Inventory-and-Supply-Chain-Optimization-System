import { useState, useEffect } from "react";
import api from "../api/axios";

const AIReports = () => {

  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState("Company");
  const [reportMonth, setReportMonth] = useState("");
  const [branchId, setBranchId] = useState("");

  // =========================
  // GENERATE AI REPORT
  // =========================
  const generateReport = async () => {

    try {

      const res = await fetch("http://127.0.0.1:5000/generate-ai-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          report_type: reportType,
          report_month: reportMonth,
          branch_id: reportType === "Branch" ? branchId : null
        })
      });

      const data = await res.json();

      alert(data.message);

      fetchReports();

    } catch (error) {

      console.error("Error generating report");

    }

  };

  // =========================
  // FETCH REPORTS
  // =========================
  const fetchReports = async () => {

    try {

      const res = await fetch(
        "http://127.0.0.1:5000/ai-reports?role=admin"
      );

      const data = await res.json();

      setReports(data.reports);

    } catch (error) {

      console.error("Error fetching reports");

    }

  };

  useEffect(() => {

    fetchReports();

  }, []);

  // =========================
  // EXPORT PDF
  // =========================
  const exportPDF = async (reportId) => {

    try {

      const res = await fetch(
        "http://127.0.0.1:5000/export-report-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            report_id: reportId
          })
        }
      );

      const data = await res.json();

      alert("PDF created at: " + data.pdf_path);

    } catch (error) {

      console.error("Error exporting PDF");

    }

  };

  return (

    <div className="p-8">

      <h1 className="mb-6 text-3xl font-bold">
        AI Monthly Reports
      </h1>

      {/* ====================== */}
      {/* REPORT GENERATOR */}
      {/* ====================== */}

      <div className="p-6 mb-8 bg-white rounded shadow">

        <h2 className="mb-4 text-xl font-semibold">
          Generate AI Report
        </h2>

        <div className="flex gap-4">

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="p-2 border rounded"
          >

            <option value="Company">Company</option>
            <option value="Branch">Branch</option>

          </select>

          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="p-2 border rounded"
          />

          {reportType === "Branch" && (

            <input
              type="number"
              placeholder="Branch ID"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="p-2 border rounded"
            />

          )}

          <button
            onClick={generateReport}
            className="px-4 py-2 text-white bg-blue-600 rounded"
          >
            Generate
          </button>

        </div>

      </div>

      {/* ====================== */}
      {/* REPORT TABLE */}
      {/* ====================== */}

      <div className="bg-white rounded shadow">

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-200">

              <th className="p-2 border">ID</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Month</th>
              <th className="p-2 border">Branch</th>
              <th className="p-2 border">KPI Summary</th>
              <th className="p-2 border">Action</th>

            </tr>

          </thead>

          <tbody>

            {reports.map((r) => (

              <tr key={r.report_id}>

                <td className="p-2 border">
                  {r.report_id}
                </td>

                <td className="p-2 border">
                  {r.report_type}
                </td>

                <td className="p-2 border">
                  {r.report_month}
                </td>

                <td className="p-2 border">
                  {r.branch_id || "All"}
                </td>

                <td className="p-2 border">
                  {r.kpi_summary}
                </td>

                <td className="p-2 border">

                  <button
                    onClick={() => exportPDF(r.report_id)}
                    className="px-3 py-1 text-white bg-green-600 rounded"
                  >
                    Download PDF
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

};

export default AIReports;