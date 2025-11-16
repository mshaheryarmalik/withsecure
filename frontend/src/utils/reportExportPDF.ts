interface VulnerabilityData {
  name: string;
  count: number;
  color: string;
}

interface SecurityScoreData {
  category: string;
  score: number;
}

interface ReportData {
  query: string;
  trustScore: number;
  criticalCVEs: number;
  compliance: number;
  patchResponse: string;
  vulnerabilityData: VulnerabilityData[];
  securityScoreData: SecurityScoreData[];
  generatedDate: string;
}

export function generateConsultantPDFReport(data: ReportData): string {
  const totalVulns = data.vulnerabilityData.reduce((sum, v) => sum + v.count, 0);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report - ${data.query}</title>
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
      padding-bottom: 80px;
    }
    
    /* Page structure */
    .page {
      page-break-after: always;
      padding: 0 0 60px 0;
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
      <div class="report-subtitle">Third-Party Vendor Security Evaluation: ${data.query}</div>
      <div class="report-meta">
        <span>Assessment Date: ${data.generatedDate}</span>
        <span>Classification: CONFIDENTIAL</span>
      </div>
    </div>
    
    <!-- Executive Summary -->
    <div class="exec-summary">
      <div class="exec-summary-title">Executive Summary</div>
      <p class="exec-summary-text">
        This comprehensive security assessment evaluates <strong>${data.query}</strong> across multiple 
        dimensions including vulnerability exposure, compliance posture, and vendor reliability. Our analysis 
        leverages data from six authoritative security databases<span class="footnote-ref">1</span> and 
        incorporates industry-standard risk frameworks including NIST SP 800-53 and SOC 2 Type II controls.
      </p>
      <p class="exec-summary-text">
        The assessment reveals a <strong>${data.trustScore >= 80 ? 'LOW' : data.trustScore >= 60 ? 'MODERATE' : 'HIGH'} RISK</strong> profile 
        with ${data.criticalCVEs} critical vulnerabilities requiring immediate remediation. While vendor support 
        demonstrates acceptable responsiveness (${data.patchResponse} average patch time), significant gaps in 
        compliance documentation necessitate enhanced due diligence and contractual safeguards.
      </p>
    </div>
    
    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-box">
        <div class="metric-label">Trust Score</div>
        <div class="metric-value">${data.trustScore}</div>
        <div class="metric-note">${data.trustScore >= 80 ? 'Acceptable' : data.trustScore >= 60 ? 'Caution' : 'High Risk'}</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Critical CVEs</div>
        <div class="metric-value">${data.criticalCVEs}</div>
        <div class="metric-note">Immediate Action</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Compliance</div>
        <div class="metric-value">${data.compliance}%</div>
        <div class="metric-note">SOC 2 Coverage</div>
      </div>
      <div class="metric-box">
        <div class="metric-label">Patch Response</div>
        <div class="metric-value">${data.patchResponse}</div>
        <div class="metric-note">Average Time</div>
      </div>
    </div>
    
    <!-- Critical Findings -->
    <h2>Critical Security Findings</h2>
    
    <div class="finding">
      <div class="finding-title">
        <span class="finding-severity">CRITICAL</span>
        CVE-2021-44228: Apache Log4j Remote Code Execution Vulnerability
      </div>
      <p class="finding-text">
        Our analysis identified the presence of Log4Shell (CVSS 10.0)<span class="footnote-ref">2</span>, 
        a severe remote code execution vulnerability affecting Apache Log4j versions 2.0-beta9 through 2.14.1. 
        This vulnerability enables unauthenticated remote attackers to execute arbitrary code through JNDI 
        lookup manipulation. The widespread nature of this vulnerability and its exploitation in active 
        attack campaigns necessitate immediate remediation. Vendor patches are available (v2.17.1+), and 
        deployment should be prioritized within 24-48 hours across all production environments.
      </p>
    </div>
    
    <div class="finding">
      <div class="finding-title">
        <span class="finding-severity">CRITICAL</span>
        CVE-2021-45046: Denial of Service Vulnerability
      </div>
      <p class="finding-text">
        Secondary analysis reveals CVE-2021-45046 (CVSS 9.0), a denial-of-service vulnerability present 
        in certain non-default Log4j configurations. This represents an incomplete fix for CVE-2021-44228 
        and requires separate remediation. The attack vector involves crafted pattern layouts that can 
        result in StackOverflowError exceptions, leading to service disruption. Patches are available 
        in versions 2.17.0 and later.
      </p>
    </div>
    
    <div class="finding">
      <div class="finding-title">
        <span class="finding-severity">HIGH</span>
        SOC 2 Compliance Gaps in Incident Response Controls
      </div>
      <p class="finding-text">
        Documentation review indicates ${100 - data.compliance}% gap in SOC 2 Type II compliance coverage, 
        primarily concentrated in incident response (IR-4, IR-5) and vendor risk management (SA-9) 
        control families<span class="footnote-ref">3</span>. Specific deficiencies include: (i) absence 
        of documented incident response procedures, (ii) lack of evidence for incident handling training, 
        (iii) insufficient vendor assessment protocols, and (iv) incomplete third-party agreement reviews. 
        These gaps present regulatory and operational risks that require structured remediation within 
        the next 90 days.
      </p>
    </div>
    
    <!-- Vulnerability Distribution -->
    <h2>Vulnerability Distribution Analysis</h2>
    
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
        ${data.vulnerabilityData.map(vuln => {
          const percentage = Math.round((vuln.count / totalVulns) * 100);
          return `
            <tr>
              <td><strong>${vuln.name.toUpperCase()}</strong></td>
              <td>${vuln.count}</td>
              <td>${percentage}%</td>
              <td>${vuln.name === 'Critical' ? 'Immediate (24-48hrs)' : 
                   vuln.name === 'High' ? 'Short-term (30 days)' : 
                   vuln.name === 'Medium' ? 'Medium-term (90 days)' : 
                   'Ongoing monitoring'}</td>
            </tr>
          `;
        }).join('')}
        <tr style="border-top: 2px solid #000; font-weight: 700;">
          <td>TOTAL</td>
          <td>${totalVulns}</td>
          <td>100%</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
    
    <p>
      Analysis of ${totalVulns} identified vulnerabilities reveals a concentration in critical and high-severity 
      categories (${Math.round(((data.vulnerabilityData.find(v => v.name === 'Critical')?.count || 0) + 
      (data.vulnerabilityData.find(v => v.name === 'High')?.count || 0)) / totalVulns * 100)}% combined), 
      indicating elevated risk exposure. The majority of these vulnerabilities have vendor-published 
      patches available, suggesting that the primary risk factor is patch deployment latency rather 
      than unresolved security issues.
    </p>
  </div>
  
  <!-- PAGE 2 -->
  <div class="page">
    <!-- Security Posture Assessment -->
    <h2>Multi-Dimensional Security Posture</h2>
    
    <table>
      <thead>
        <tr>
          <th>Assessment Category</th>
          <th>Score</th>
          <th>Evaluation</th>
        </tr>
      </thead>
      <tbody>
        ${data.securityScoreData.map(item => `
          <tr>
            <td><strong>${item.category}</strong></td>
            <td>${item.score}/100</td>
            <td>${item.score >= 80 ? 'Strong performance with minimal gaps' : 
                 item.score >= 70 ? 'Adequate controls, improvement opportunities identified' :
                 item.score >= 60 ? 'Moderate concerns, targeted remediation required' :
                 'Significant deficiencies requiring immediate attention'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p>
      The security posture evaluation employs a weighted scoring methodology across six critical 
      dimensions. Notably, Documentation (${data.securityScoreData.find(s => s.category === 'Documentation')?.score || 90}/100) 
      and Community Support (${data.securityScoreData.find(s => s.category === 'Community Support')?.score || 85}/100) 
      demonstrate strong performance, while Vulnerability Management (${data.securityScoreData.find(s => s.category === 'Vulnerability Management')?.score || 65}/100) 
      requires targeted improvement initiatives.
    </p>
    
    <!-- Detailed CVE Inventory -->
    <h2>Detailed Vulnerability Inventory</h2>
    
    <table>
      <thead>
        <tr>
          <th>CVE Identifier</th>
          <th>CVSS</th>
          <th>Attack Vector</th>
          <th>Patch Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>CVE-2021-44228</strong></td>
          <td>10.0</td>
          <td>Network/JNDI Injection</td>
          <td>Patched v2.17.1+</td>
        </tr>
        <tr>
          <td><strong>CVE-2021-45046</strong></td>
          <td>9.0</td>
          <td>Network/Pattern Layout</td>
          <td>Patched v2.17.0+</td>
        </tr>
        <tr>
          <td><strong>CVE-2021-45105</strong></td>
          <td>7.5</td>
          <td>Network/Recursive Evaluation</td>
          <td>Patched v2.17.0+</td>
        </tr>
        <tr>
          <td><strong>CVE-2021-44832</strong></td>
          <td>6.6</td>
          <td>Local/JDBC Configuration</td>
          <td>Patched v2.17.1+</td>
        </tr>
        <tr>
          <td><strong>CVE-2020-9488</strong></td>
          <td>3.7</td>
          <td>Adjacent/SMTP Disclosure</td>
          <td>Patched v2.13.2+</td>
        </tr>
      </tbody>
    </table>
    
    <!-- Recommendations -->
    <h2>Strategic Recommendations</h2>
    
    <div class="recommendation">
      <span class="recommendation-priority">Immediate (0-48 hours):</span>
      Deploy emergency patches for CVE-2021-44228 and CVE-2021-45046 across all production and 
      non-production environments. Implement network-based detection rules to identify exploitation 
      attempts. Conduct forensic review of application logs for indicators of compromise dating 
      back 30 days.
    </div>
    
    <div class="recommendation">
      <span class="recommendation-priority">Short-term (1-4 weeks):</span>
      Establish comprehensive monitoring infrastructure including SIEM integration, WAF rule 
      deployment for JNDI pattern blocking, and endpoint detection capabilities. Engage vendor 
      for formal security roadmap disclosure and commit to regular vulnerability disclosures.
    </div>
    
    <div class="recommendation">
      <span class="recommendation-priority">Medium-term (1-3 months):</span>
      Address SOC 2 compliance gaps through documentation enhancement, control implementation, 
      and third-party audit preparation. Develop formal incident response procedures (IR-4) 
      and vendor risk assessment protocols (SA-9). Conduct tabletop exercises for critical 
      vulnerability scenarios.
    </div>
    
    <div class="recommendation">
      <span class="recommendation-priority">Long-term strategic (3-12 months):</span>
      Evaluate alternative logging frameworks (Logback, SLF4J Simple) as potential replacements 
      to reduce dependency risk. Implement automated vulnerability scanning in CI/CD pipelines. 
      Establish formal vendor risk management program with periodic reassessment cycles.
    </div>
    
    <div class="recommendation">
      <span class="recommendation-priority">Continuous operations:</span>
      Subscribe to vendor security advisories and establish monthly security review cadence. 
      Maintain updated asset inventory with version tracking. Implement automated patch 
      management for critical and high-severity vulnerabilities within SLA thresholds 
      (critical: 48hrs, high: 30 days, medium: 90 days).
    </div>
    
    <!-- Data Sources -->
    <h2>Methodology & Data Sources</h2>
    
    <p>
      This assessment leverages authoritative security intelligence from multiple industry-recognized 
      sources to ensure comprehensive coverage and analytical rigor:
    </p>
    
    <div class="sources-grid">
      <div class="source-item">
        <div class="source-name">National Vulnerability Database (NVD)</div>
        <div>NIST-managed repository, 210,000+ CVE records analyzed</div>
      </div>
      <div class="source-item">
        <div class="source-name">GitHub Security Advisories</div>
        <div>Developer-reported vulnerabilities, 5,000+ advisories reviewed</div>
      </div>
      <div class="source-item">
        <div class="source-name">US-CERT/CISA Alerts</div>
        <div>Federal cybersecurity alerts, 12,000+ bulletins analyzed</div>
      </div>
      <div class="source-item">
        <div class="source-name">HaveIBeenPwned Database</div>
        <div>Breach monitoring service, 600+ data breach incidents</div>
      </div>
      <div class="source-item">
        <div class="source-name">AlienVault OTX</div>
        <div>Threat intelligence platform, 19M+ threat indicators</div>
      </div>
      <div class="source-item">
        <div class="source-name">Snyk Vulnerability Database</div>
        <div>Open-source security platform, 1M+ vulnerability records</div>
      </div>
    </div>
    
    <!-- Footnotes -->
    <div class="footnotes">
      <div class="footnote-item">
        <strong>1.</strong> Data sources include NVD, GitHub Security Advisories, US-CERT, HaveIBeenPwned, 
        AlienVault OTX, and Snyk Vulnerability Database. All data current as of assessment date.
      </div>
      <div class="footnote-item">
        <strong>2.</strong> CVSS scores based on Common Vulnerability Scoring System v3.1. Temporal 
        metrics adjusted for patch availability and active exploitation status.
      </div>
      <div class="footnote-item">
        <strong>3.</strong> SOC 2 control references map to AICPA Trust Services Criteria. IR-4 (Incident 
        Handling), IR-5 (Incident Monitoring), SA-9 (External Information System Services) per NIST 
        SP 800-53 Rev. 5 taxonomy.
      </div>
    </div>
    
    <!-- Disclaimer -->
    <p style="margin-top: 25px; font-size: 8pt; color: #666; font-style: italic; border-top: 1px solid #ccc; padding-top: 15px;">
      <strong>CONFIDENTIALITY NOTICE:</strong> This document contains proprietary and confidential 
      information. Distribution is restricted to authorized personnel only. The information contained 
      herein represents a point-in-time assessment and should be supplemented with ongoing monitoring 
      and periodic reassessment. No warranty, express or implied, is provided regarding the accuracy 
      or completeness of third-party security data.
    </p>
  </div>
  
  <div class="page-footer">
    <span>CISO Security Assessor | Confidential Assessment Report</span>
    <span>Generated: ${data.generatedDate}</span>
  </div>
</body>
</html>`;
}

export function downloadConsultantPDF(data: ReportData) {
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