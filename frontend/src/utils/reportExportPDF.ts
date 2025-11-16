import type { ReportExportPayload } from "./assessmentMetrics";

const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatDate = (value?: string): string => {
  if (!value) {
    return "Not provided";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }
  return escapeHtml(date.toLocaleDateString());
};

const classifyRisk = (trustScore: number) => {
  if (trustScore >= 80) {
    return { label: "Low Risk", note: "Risk posture aligns with acceptable thresholds." };
  }
  if (trustScore >= 60) {
    return { label: "Moderate Risk", note: "Targeted remediation required to reduce exposure." };
  }
  return { label: "High Risk", note: "Immediate action required to mitigate systemic vulnerabilities." };
};

const severityClass = (severity: string) => {
  const normalized = severity?.toLowerCase() || "";
  if (normalized.includes("critical")) {
    return "critical";
  }
  if (normalized.includes("high")) {
    return "high";
  }
  if (normalized.includes("medium")) {
    return "medium";
  }
  if (normalized.includes("low")) {
    return "low";
  }
  return "info";
};

const yesNoBadge = (value: boolean | null, yesText: string, noText: string) => {
  if (value === true) {
    return `<span class="badge badge-positive">${escapeHtml(yesText)}</span>`;
  }
  if (value === false) {
    return `<span class="badge badge-negative">${escapeHtml(noText)}</span>`;
  }
  return `<span class="badge badge-neutral">Not reported</span>`;
};

const patchResponseLabel = (patchResponse: string) => {
  if (!patchResponse || patchResponse.trim() === "" || patchResponse === "N/A") {
    return "Not reported";
  }
  return patchResponse;
};

export function generateConsultantPDFReport(data: ReportExportPayload): string {
  const totalVulns = data.vulnerabilityData.reduce((sum, v) => sum + Math.max(0, v.count), 0);
  const criticalCount = data.vulnerabilityData.find((item) => item.name === "Critical")?.count ?? 0;
  const highCount = data.vulnerabilityData.find((item) => item.name === "High")?.count ?? 0;
  const risk = classifyRisk(data.trustScore);
  const topFindings = data.recentCves.slice(0, 5);
  const remainingCves = data.recentCves.slice(0, 12);
  const patchLabel = patchResponseLabel(data.patchResponse);
  const complianceFlags = data.complianceDetails;

  const findingsHtml =
    topFindings.length > 0
      ? topFindings
          .map((finding) => {
            const sevClass = severityClass(finding.severity);
            const sevLabel = escapeHtml(finding.severity || "Unknown");
            const cvss = typeof finding.cvss === "number" ? finding.cvss.toFixed(1) : "N/A";
            return `<div class="finding finding-${sevClass}">
        <div class="finding-title">
          <span class="finding-severity finding-${sevClass}-badge">${sevLabel}</span>
          ${escapeHtml(finding.id)}
        </div>
        <div class="finding-meta">
          <span class="finding-cvss">CVSS ${escapeHtml(cvss)}</span>
          ${finding.inCisaKev ? '<span class="badge badge-outline">CISA KEV</span>' : ""}
          ${finding.publishedDate ? `<span class="badge badge-muted">Published ${formatDate(finding.publishedDate)}</span>` : ""}
        </div>
        <p class="finding-text">${escapeHtml(finding.description || "No public description provided.")}</p>
      </div>`;
          })
          .join("")
      : `<p class="no-data">No high priority CVEs were returned for this assessment.</p>`;

  const vulnerabilityRows =
    totalVulns > 0
      ? data.vulnerabilityData
          .map((vuln) => {
            const percentage = totalVulns ? Math.round((Math.max(0, vuln.count) / totalVulns) * 100) : 0;
            return `<tr>
          <td><strong>${escapeHtml(vuln.name)}</strong></td>
          <td>${escapeHtml(vuln.count)}</td>
          <td>${percentage}%</td>
          <td>${escapeHtml(
            vuln.name === "Critical"
              ? "Immediate remediation (24–48 hrs)"
              : vuln.name === "High"
              ? "Remediate within 30 days"
              : vuln.name === "Medium"
              ? "Address within 90 days"
              : "Monitor within normal patch cadence",
          )}</td>
        </tr>`;
          })
          .join("")
      : `<tr>
        <td colspan="4">No vulnerabilities were reported for this vendor at the time of assessment.</td>
      </tr>`;

  const securityRows = data.securityScoreData
    .map(
      (item) => `<tr>
        <td><strong>${escapeHtml(item.category)}</strong></td>
        <td>${escapeHtml(item.score)}</td>
        <td>${escapeHtml(
          item.score >= 80
            ? "Strong performance with minimal gaps observed."
            : item.score >= 70
            ? "Adequate controls – monitor and improve."
            : item.score >= 60
            ? "Moderate concerns – prioritize remediation."
            : "Significant weaknesses detected – urgent action required.",
        )}</td>
      </tr>`,
    )
    .join("");

  const cveRows =
    remainingCves.length > 0
      ? remainingCves
          .map(
            (cve) => `<tr>
          <td><strong>${escapeHtml(cve.id)}</strong></td>
          <td>${typeof cve.cvss === "number" ? escapeHtml(cve.cvss.toFixed(1)) : "N/A"}</td>
          <td><span class="finding-severity finding-${severityClass(cve.severity)}-badge">${escapeHtml(
              cve.severity || "Unknown",
            )}</span></td>
          <td>${escapeHtml(cve.description || "Description not published.")}</td>
          <td>${cve.inCisaKev ? "Yes" : "No"}</td>
        </tr>`,
          )
          .join("")
      : `<tr>
        <td colspan="5">No CVE inventory was returned for this vendor.</td>
      </tr>`;

  const incidentRows =
    data.incidents.length > 0
      ? data.incidents
          .map(
            (incident) => `<tr>
          <td>${formatDate(incident.date)}</td>
          <td>${escapeHtml(incident.type)}</td>
          <td>${escapeHtml(incident.severity)}</td>
          <td>${escapeHtml(incident.description)}</td>
          <td>${incident.sourceUrl ? `<a href="${escapeHtml(incident.sourceUrl)}">${escapeHtml(incident.sourceUrl)}</a>` : "—"}</td>
        </tr>`,
          )
          .join("")
      : `<tr>
        <td colspan="5">No historical security incidents were reported.</td>
      </tr>`;

  const certificationRows =
    complianceFlags.isoCertifications.length > 0
      ? complianceFlags.isoCertifications
          .map(
            (cert) => `<tr>
          <td>${escapeHtml(cert.certificationType)}</td>
          <td>${escapeHtml(cert.status)}</td>
          <td>${cert.dateIssued ? formatDate(cert.dateIssued) : "Not provided"}</td>
          <td>${cert.expiryDate ? formatDate(cert.expiryDate) : "Not provided"}</td>
        </tr>`,
          )
          .join("")
      : `<tr>
        <td colspan="4">No ISO or equivalent certifications were disclosed.</td>
      </tr>`;

  const alternativesList =
    data.saferAlternatives.length > 0
      ? data.saferAlternatives
          .map(
            (alt, index) => `<li>
          <span class="alt-index">${index + 1}.</span>
          <div class="alt-content">
            <div class="alt-title">${escapeHtml(alt.productName)}${alt.vendorName ? ` · ${escapeHtml(alt.vendorName)}` : ""}</div>
            ${alt.category ? `<div class="alt-meta badge badge-muted">Category: ${escapeHtml(alt.category)}</div>` : ""}
            <p>${escapeHtml(alt.rationale)}</p>
          </div>
        </li>`,
          )
          .join("")
      : `<li>No safer alternative recommendations were generated for this vendor.</li>`;

  const citationsList =
    data.citations.length > 0
      ? data.citations
          .map(
            (citation, index) => `<li>
          <strong>[${index + 1}] ${escapeHtml(citation.claim)}</strong><br />
          <span class="citation-meta">${escapeHtml(citation.sourceType)} · ${escapeHtml(citation.sourceLabel)} · Accessed ${
              citation.accessedDate ? escapeHtml(new Date(citation.accessedDate).toLocaleDateString()) : "Not provided"
            }</span><br />
          <a href="${escapeHtml(citation.sourceUrl)}">${escapeHtml(citation.sourceUrl)}</a>
        </li>`,
          )
          .join("")
      : `<li>No supporting citations were supplied by the assessment.</li>`;

  const complianceBadges = [
    yesNoBadge(complianceFlags.gdprCompliant, "GDPR aligned", "Not GDPR aligned"),
    yesNoBadge(complianceFlags.ccpaCompliant, "CCPA aligned", "Not CCPA aligned"),
    yesNoBadge(complianceFlags.hipaaCompliant, "HIPAA aligned", "Not HIPAA aligned"),
  ].join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report - ${escapeHtml(data.productName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 2cm 2.5cm 3.5cm 2.5cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding-bottom: 160px;
    }

    /* Page structure */
    .page {
      page-break-after: always;
      padding: 0 0 140px 0;
      position: relative;
      min-height: calc(297mm - 5.5cm);
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header styling */
    .report-header {
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .report-title {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 24pt;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .report-subtitle {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 14pt;
      font-weight: 400;
      color: #333;
      margin-bottom: 20px;
    }

    .report-meta {
      display: flex;
      justify-content: space-between;
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 9pt;
      color: #666;
      padding-top: 10px;
      border-top: 1px solid #ccc;
    }

    /* Executive summary box */
    .exec-summary {
      background: #f5f5f5;
      border-left: 4px solid #000;
      padding: 20px;
      margin-bottom: 25px;
    }

    .exec-summary-title {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 13pt;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .exec-summary-text {
      font-size: 10pt;
      line-height: 1.6;
      margin-bottom: 15px;
    }

    /* Key metrics grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }

    .metric-box {
      border: 2px solid #000;
      padding: 15px;
      text-align: center;
    }

    .metric-label {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .metric-value {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 26pt;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 5px;
    }

    .metric-note {
      font-size: 8pt;
      color: #555;
      font-style: italic;
    }

    /* Section headings */
    h2 {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 13pt;
      font-weight: 700;
      margin-top: 25px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #000;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    h3 {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      margin-top: 15px;
      margin-bottom: 8px;
    }

    /* Text content */
    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    .finding {
      margin-bottom: 15px;
      padding: 12px;
      border-left: 3px solid #000;
      background: #fafafa;
    }

    .finding-critical {
      border-left-color: #b91c1c;
    }

    .finding-high {
      border-left-color: #c2410c;
    }

    .finding-medium {
      border-left-color: #a16207;
    }

    .finding-low {
      border-left-color: #15803d;
    }

    .finding-title {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 10pt;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .finding-severity {
      display: inline-block;
      padding: 2px 8px;
      font-size: 8pt;
      font-weight: 700;
      margin-right: 8px;
      border: 1px solid #000;
    }

    .finding-critical-badge {
      background: #fee2e2;
      border-color: #b91c1c;
      color: #7f1d1d;
    }

    .finding-high-badge {
      background: #ffedd5;
      border-color: #c2410c;
      color: #7c2d12;
    }

    .finding-medium-badge {
      background: #fef3c7;
      border-color: #a16207;
      color: #78350f;
    }

    .finding-low-badge {
      background: #dcfce7;
      border-color: #15803d;
      color: #14532d;
    }

    .finding-info-badge {
      background: #e0f2fe;
      border-color: #0369a1;
      color: #0c4a6e;
    }

    .finding-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 8pt;
      color: #555;
      margin-bottom: 6px;
    }

    .finding-cvss {
      font-weight: 600;
    }

    .finding-text {
      font-size: 9pt;
      line-height: 1.5;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 20px 0;
      font-size: 9pt;
    }

    thead {
      background: #000;
      color: #fff;
    }

    th {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-weight: 700;
      text-align: left;
      padding: 8px;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 8px;
      border-bottom: 1px solid #ddd;
    }

    tr:nth-child(even) {
      background: #f9f9f9;
    }

    /* Recommendations */
    .recommendation {
      margin-bottom: 12px;
      padding-left: 25px;
      position: relative;
    }

    .recommendation::before {
      content: "▪";
      position: absolute;
      left: 10px;
      font-weight: 700;
      font-size: 12pt;
    }

    .recommendation-priority {
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #999;
      font-size: 8pt;
      letter-spacing: 0.4px;
    }

    .badge-outline {
      border-color: #2563eb;
      color: #1d4ed8;
    }

    .badge-muted {
      border-color: #b1b1b1;
      color: #555;
      background: #f5f5f5;
    }

    .badge-positive {
      border-color: #15803d;
      color: #166534;
      background: #dcfce7;
    }

    .badge-negative {
      border-color: #b91c1c;
      color: #7f1d1d;
      background: #fee2e2;
    }

    .badge-neutral {
      border-color: #6b7280;
      color: #4b5563;
      background: #f3f4f6;
    }

    /* Footnotes */
    .footnotes {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      line-height: 1.4;
      color: #555;
      page-break-inside: avoid;
      clear: both;
    }

    .footnote-item {
      margin-bottom: 8px;
    }

    .footnote-ref {
      vertical-align: super;
      font-size: 7pt;
      font-weight: 700;
    }

    /* Footer */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 15px 2.5cm;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #666;
      display: flex;
      justify-content: space-between;
      background: #fff;
      gap: 12px;
    }

    .page-footer span {
      max-width: 50%;
    }

    /* Data sources grid */
    .sources-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 15px 0;
      font-size: 8pt;
    }

    .source-item {
      padding: 8px;
      border: 1px solid #ddd;
      background: #fafafa;
    }

    .source-name {
      font-weight: 700;
      margin-bottom: 2px;
    }

    /* Confidential watermark */
    .confidential {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt;
      font-weight: 700;
      color: rgba(0, 0, 0, 0.03);
      z-index: -1;
      font-family: 'Arial', 'Helvetica', sans-serif;
      pointer-events: none;
    }

    .no-data {
      font-style: italic;
      color: #555;
    }

    .compliance-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0 16px;
    }

    .compliance-table td {
      vertical-align: top;
    }

    .data-points {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 15px 0;
      font-size: 9pt;
    }

    .data-point {
      border: 1px solid #ddd;
      padding: 10px;
      background: #fafafa;
    }

    .data-point-title {
      font-weight: 700;
      margin-bottom: 6px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      font-size: 8pt;
    }

    .alternatives-list {
      list-style: none;
      padding-left: 0;
    }

    .alternatives-list li {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e5e5;
    }

    .alternate-list li:last-child {
      border-bottom: none;
    }

    .alt-index {
      font-weight: 700;
    }

    .alt-title {
      font-weight: 700;
      margin-bottom: 4px;
    }

    .alt-meta {
      margin-bottom: 4px;
    }

    .citations-list {
      list-style: none;
      padding-left: 0;
      font-size: 8pt;
    }

    .citations-list li {
      margin-bottom: 10px;
    }

    .citation-meta {
      color: #555;
    }

    .summary-highlight {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      margin-top: 5px;
    }

    .summary-text-block {
      margin-bottom: 12px;
    }

    .summary-text-block strong {
      font-family: 'Arial', 'Helvetica', sans-serif;
    }

    /* Print specific */
    @media print {
      body {
        background: white;
      }

      .page-footer {
        position: fixed;
        bottom: 0;
      }
    }
  </style>
</head>
<body>
  <div class="confidential">CONFIDENTIAL</div>

  <!-- PAGE 1 -->
  <div class="page">
    <!-- Header -->
    <div class="report-header">
      <div class="report-title">Cybersecurity Risk Assessment</div>
      <div class="report-subtitle">Third-Party Vendor Security Evaluation: ${escapeHtml(data.productName)}</div>
      <div class="report-meta">
        <span>Assessment Date: ${escapeHtml(data.generatedDate)}</span>
        <span>Vendor: ${escapeHtml(data.vendorName)}</span>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="exec-summary">
      <div class="exec-summary-title">Executive Summary</div>
      <p class="exec-summary-text summary-text-block">
        This assessment evaluates <strong>${escapeHtml(data.productName)}</strong> (${escapeHtml(
    data.vendorName,
  )}) using authoritative data sources delivered by WithSecure. The report examines vulnerability exposure, incident history, compliance maturity, and vendor transparency to inform procurement and risk governance decisions.
      </p>
      <p class="exec-summary-text summary-text-block">
        <strong>${escapeHtml(risk.label)}</strong> posture identified. ${escapeHtml(
    risk.note,
  )} ${data.criticalCVEs} critical vulnerabilities were detected across ${escapeHtml(
    data.totalCves,
  )} total CVE records with a current trend of "${escapeHtml(data.cveTrend)}" and ${escapeHtml(
    data.cisaKevCount,
  )} CISA Known Exploited Vulnerabilities. Average patch response is ${escapeHtml(
    patchLabel,
  )}, indicating ${patchLabel === "Not reported" ? "insufficient visibility into vendor remediation timelines" : "the current vendor response cadence"}.
      </p>
      <p class="exec-summary-text summary-text-block">
        ${escapeHtml(data.description || "No executive summary description was provided.")} ${escapeHtml(
    data.usage || "",
  )}
      </p>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Trust Score</div>
        <div class="metric-value">${escapeHtml(data.trustScore)}</div>
        <div class="metric-note">${escapeHtml(risk.label)}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Critical CVEs</div>
        <div class="metric-value">${escapeHtml(data.criticalCVEs)}</div>
        <div class="metric-note">Immediate Action</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Compliance</div>
        <div class="metric-value">${escapeHtml(data.compliance)}%</div>
        <div class="metric-note">${escapeHtml(complianceFlags.soc2Status || "SOC 2 status unknown")}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Patch Response</div>
        <div class="metric-value">${escapeHtml(patchLabel)}</div>
        <div class="metric-note">Average Time</div>
      </div>
    </div>

    <!-- Critical Findings -->
    <h2>Priority Security Findings</h2>
    ${findingsHtml}

    <h2>Vulnerability Distribution Analysis</h2>
    <!-- Vulnerability Distribution -->
    <table>
      <thead>
        <tr>
          <th>Severity Level</th>
          <th>Count</th>
          <th>Percentage</th>
          <th>Remediation Timeline</th>
        </tr>
      </thead>
      <tbody>
        ${vulnerabilityRows}
        <tr style="border-top: 2px solid #000; font-weight: 700;">
          <td>TOTAL</td>
          <td>${escapeHtml(totalVulns)}</td>
          <td>100%</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
    <p>
      ${
        totalVulns > 0
          ? `Assessment identified ${escapeHtml(totalVulns)} open vulnerabilities with ${escapeHtml(
              criticalCount,
            )} critical and ${escapeHtml(highCount)} high-severity exposures.`
          : "No vulnerability distribution data was reported by the upstream sources at the time of assessment."
      }
    </p>

    <h2>Compliance & Governance Overview</h2>
    <div class="compliance-summary">
      ${complianceBadges}
    </div>
    <table class="compliance-table">
      <thead>
        <tr>
          <th>Framework / Control</th>
          <th>Status</th>
          <th>Evidence</th>
          <th>Expiry</th>
        </tr>
      </thead>
      <tbody>
        ${certificationRows}
      </tbody>
    </table>

    <div class="data-points">
      <div class="data-point">
        <div class="data-point-title">Deployment Controls</div>
        <div>${escapeHtml(data.deploymentControls || "Not documented")}</div>
      </div>
      <div class="data-point">
        <div class="data-point-title">Data Encryption</div>
        <div>${data.dataHandling.encryptionClaimed ? "Vendor claims to encrypt data." : "Encryption claims not confirmed."} ${escapeHtml(data.dataHandling.encryptionDetails || "")}</div>
      </div>
      <div class="data-point">
        <div class="data-point-title">Data Retention</div>
        <div>${escapeHtml(data.dataHandling.dataRetention || "Not disclosed")}</div>
      </div>
      <div class="data-point">
        <div class="data-point-title">Data Residency</div>
        <div>${escapeHtml(data.dataHandling.dataLocation || "Not disclosed")}</div>
      </div>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <h2>Security Posture Assessment</h2>
    <table>
      <thead>
        <tr>
          <th>Assessment Category</th>
          <th>Score</th>
          <th>Evaluation</th>
        </tr>
      </thead>
      <tbody>
        ${securityRows}
      </tbody>
    </table>

    <h2>Recent CVE Inventory</h2>
    <table>
      <thead>
        <tr>
          <th>CVE Identifier</th>
          <th>CVSS</th>
          <th>Attack Vector</th>
          <th>CISA KEV</th>
        </tr>
      </thead>
      <tbody>
        ${cveRows}
      </tbody>
    </table>

    <h2>Incident History & Exposure</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Severity</th>
          <th>Description</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        ${incidentRows}
      </tbody>
    </table>
    <p>${data.breachCount > 0 ? `${escapeHtml(data.breachCount)} confirmed breach${data.breachCount === 1 ? "" : "es"} reported.` : "No public breaches recorded for this vendor."}</p>

    <h2>Safer Alternatives</h2>
    <ul class="alternatives-list">
      ${alternativesList}
    </ul>

    <h2>Assessment Rationale</h2>
    <p>${escapeHtml(data.rationale || "No additional rationale was provided.")}</p>

    <h2>Sources & Citations</h2>
    <ol class="citations-list">
      ${citationsList}
    </ol>

    <p style="margin-top: 20px; font-size: 8pt; color: #666; font-style: italic; border-top: 1px solid #ccc; padding-top: 15px;">
      <strong>CONFIDENTIALITY NOTICE:</strong> This document contains proprietary and confidential 
      information. Distribution is restricted to authorized personnel only. The information contained 
      herein represents a point-in-time assessment and should be supplemented with ongoing monitoring 
      and periodic reassessment. No warranty, express or implied, is provided regarding the accuracy 
      or completeness of third-party security data.
    </p>
  </div>

  <div class="page-footer">
    <span>CISO Security Assessor | Confidential Assessment Report</span>
    <span>Generated: ${escapeHtml(data.generatedDate)} · ${escapeHtml(data.query)}</span>
  </div>
</body>
</html>`;
}

export function downloadConsultantPDF(data: ReportExportPayload) {
  const html = generateConsultantPDFReport(data);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
}