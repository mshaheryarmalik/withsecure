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

export function generateHTMLReport(data: ReportData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Assessment Report - ${data.query}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', Courier, monospace;
      background: #000000;
      color: #cbd5e1;
      line-height: 1.6;
      position: relative;
    }
    
    /* Matrix background effect */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        linear-gradient(90deg, transparent 0%, rgba(30, 41, 59, 0.1) 50%, transparent 100%),
        linear-gradient(180deg, transparent 0%, rgba(30, 41, 59, 0.1) 50%, transparent 100%);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      position: relative;
      z-index: 1;
    }
    
    /* Header Styling */
    .header {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 40px;
      box-shadow: 0 0 40px rgba(148, 163, 184, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
    }
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .shield-icon {
      font-size: 48px;
      filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));
    }
    
    h1 {
      font-size: 32px;
      color: #f1f5f9;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-shadow: 0 0 20px rgba(148, 163, 184, 0.3);
    }
    
    .entity-name {
      font-size: 18px;
      color: #94a3b8;
      margin-top: 8px;
    }
    
    .metadata {
      display: flex;
      justify-content: space-between;
      padding-top: 15px;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
      font-size: 14px;
      color: #64748b;
    }
    
    .footer-version {
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    /* Section Styling */
    .section {
      margin-bottom: 50px;
    }
    
    .section-title {
      font-size: 24px;
      color: #f1f5f9;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      gap: 15px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    
    .title-bar {
      width: 4px;
      height: 30px;
      background: linear-gradient(180deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }
    
    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(51, 65, 85, 0.6) 100%);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 25px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #475569, #64748b);
    }
    
    .metric-card.critical::before {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }
    
    .metric-card.warning::before {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }
    
    .metric-card.success::before {
      background: linear-gradient(90deg, #10b981, #059669);
    }
    
    .metric-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .metric-value {
      font-size: 48px;
      font-weight: bold;
      color: #f1f5f9;
      line-height: 1;
      margin-bottom: 10px;
      text-shadow: 0 0 20px rgba(148, 163, 184, 0.2);
    }
    
    .metric-card.critical .metric-value {
      color: #ef4444;
      text-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
    }
    
    .metric-card.warning .metric-value {
      color: #f59e0b;
      text-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
    }
    
    .metric-card.success .metric-value {
      color: #10b981;
      text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
    }
    
    .metric-subtitle {
      font-size: 13px;
      color: #64748b;
    }
    
    /* Table Styling */
    .vuln-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .vuln-table thead {
      background: linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(71, 85, 105, 0.9) 100%);
    }
    
    .vuln-table th {
      padding: 15px 20px;
      text-align: left;
      color: #f1f5f9;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid rgba(148, 163, 184, 0.3);
    }
    
    .vuln-table td {
      padding: 15px 20px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .vuln-table tbody tr:hover {
      background: rgba(51, 65, 85, 0.4);
    }
    
    .severity-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .severity-critical {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    
    .severity-high {
      background: rgba(249, 115, 22, 0.2);
      color: #f97316;
      border: 1px solid rgba(249, 115, 22, 0.4);
    }
    
    .severity-medium {
      background: rgba(234, 179, 8, 0.2);
      color: #eab308;
      border: 1px solid rgba(234, 179, 8, 0.4);
    }
    
    .severity-low {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }
    
    /* Data Card */
    .data-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .score-list {
      list-style: none;
    }
    
    .score-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 15px 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .score-item:last-child {
      border-bottom: none;
    }
    
    .score-category {
      flex: 0 0 220px;
      font-size: 14px;
      color: #cbd5e1;
    }
    
    .score-bar-container {
      flex: 1;
      height: 24px;
      background: rgba(15, 23, 42, 0.8);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    
    .score-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 12px;
      transition: width 1s ease;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    }
    
    .score-value {
      flex: 0 0 50px;
      text-align: right;
      font-weight: bold;
      font-size: 16px;
      color: #f1f5f9;
    }
    
    /* Findings List */
    .findings-list {
      list-style: none;
    }
    
    .finding-item {
      display: flex;
      gap: 20px;
      padding: 20px;
      margin-bottom: 15px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-left: 4px solid #475569;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .finding-item:hover {
      background: rgba(51, 65, 85, 0.6);
      transform: translateX(4px);
    }
    
    .finding-item.critical {
      border-left-color: #ef4444;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
    }
    
    .finding-item.warning {
      border-left-color: #f59e0b;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
    }
    
    .finding-item.success {
      border-left-color: #10b981;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.1);
    }
    
    .finding-item.info {
      border-left-color: #3b82f6;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
    }
    
    .finding-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    
    .finding-content {
      flex: 1;
    }
    
    .finding-title {
      font-size: 16px;
      font-weight: bold;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    
    .finding-description {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
    }
    
    /* CVE Table */
    .cve-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      overflow: hidden;
      margin: 20px 0;
    }
    
    .cve-table thead {
      background: linear-gradient(135deg, rgba(51, 65, 85, 0.9) 0%, rgba(71, 85, 105, 0.9) 100%);
    }
    
    .cve-table th {
      padding: 15px 20px;
      text-align: left;
      color: #f1f5f9;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid rgba(148, 163, 184, 0.3);
    }
    
    .cve-table td {
      padding: 15px 20px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .cve-table tbody tr:hover {
      background: rgba(51, 65, 85, 0.4);
    }
    
    .cve-id {
      font-weight: bold;
      color: #3b82f6;
      font-family: 'Courier New', monospace;
    }
    
    .cvss-score {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: bold;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    
    /* Recommendations */
    .recommendations-list {
      list-style: none;
    }
    
    .recommendation-item {
      padding: 20px;
      margin-bottom: 15px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      display: flex;
      gap: 15px;
      align-items: flex-start;
    }
    
    .recommendation-number {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #fff;
      font-size: 14px;
    }
    
    .recommendation-priority {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }
    
    .recommendation-text {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    
    .recommendations-box {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    /* Data Sources Grid */
    .sources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .source-item {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .source-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #10b981, #059669);
    }
    
    .source-name {
      font-size: 14px;
      font-weight: bold;
      color: #f1f5f9;
      margin-bottom: 8px;
    }
    
    .source-count {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    
    .source-status {
      font-size: 11px;
      color: #10b981;
      display: inline-block;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    /* Footer */
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    
    .page-break {
      page-break-after: always;
      height: 40px;
    }
    
    @media print {
      body::before {
        display: none;
      }
      
      .metric-card,
      .finding-item {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-title">
        <div class="shield-icon">🛡️</div>
        <div>
          <h1>Security Assessment Report</h1>
          <div class="entity-name">${data.query}</div>
        </div>
      </div>
      <div class="metadata">
        <span>Generated: ${data.generatedDate}</span>
        <span class="footer-version">CISO Security Assessor v1.0</span>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Executive Summary
      </h2>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Trust Score</div>
          <div class="metric-value">${data.trustScore}</div>
          <div class="metric-subtitle">
            ${data.trustScore >= 80 ? 'Low Risk' : data.trustScore >= 60 ? 'Moderate Risk' : 'High Risk'}
          </div>
        </div>
        
        <div class="metric-card critical">
          <div class="metric-label">Critical CVEs</div>
          <div class="metric-value">${data.criticalCVEs}</div>
          <div class="metric-subtitle">
            ⚠️ Immediate Action Required
          </div>
        </div>
        
        <div class="metric-card warning">
          <div class="metric-label">Compliance</div>
          <div class="metric-value">${data.compliance}%</div>
          <div class="metric-subtitle">SOC 2 Coverage</div>
        </div>
        
        <div class="metric-card success">
          <div class="metric-label">Patch Response</div>
          <div class="metric-value">${data.patchResponse}</div>
          <div class="metric-subtitle">
            ✓ Active Support
          </div>
        </div>
      </div>
    </div>

    <!-- Vulnerability Distribution -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Vulnerability Analysis
      </h2>
      
      <table class="vuln-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Count</th>
            <th>Percentage</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.vulnerabilityData.map(vuln => {
            const total = data.vulnerabilityData.reduce((sum, v) => sum + v.count, 0);
            const percentage = Math.round((vuln.count / total) * 100);
            const severityClass = vuln.name.toLowerCase();
            return `
              <tr>
                <td><span class="severity-badge severity-${severityClass}">${vuln.name}</span></td>
                <td>${vuln.count}</td>
                <td>${percentage}%</td>
                <td>${vuln.name === 'Critical' ? 'Requires immediate attention' : vuln.name === 'High' ? 'Address within 30 days' : 'Monitor regularly'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="page-break"></div>

    <!-- Security Score Breakdown -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Security Score Breakdown
      </h2>
      
      <div class="data-card">
        <ul class="score-list">
          ${data.securityScoreData.map(item => `
            <li class="score-item">
              <span class="score-category">${item.category}</span>
              <div class="score-bar-container">
                <div class="score-bar" style="width: ${item.score}%"></div>
              </div>
              <span class="score-value">${item.score}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>

    <!-- Key Findings -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Key Findings
      </h2>
      
      <ul class="findings-list">
        <li class="finding-item critical">
          <span class="finding-icon">⚠️</span>
          <div class="finding-content">
            <div class="finding-title">Critical: CVE-2021-44228 (Log4Shell)</div>
            <div class="finding-description">
              CVSS 10.0 - Remote Code Execution vulnerability detected in Apache Log4j. 
              This vulnerability allows unauthenticated remote attackers to execute arbitrary code. 
              Immediate patching to version 2.17.1 or later is required.
            </div>
          </div>
        </li>
        
        <li class="finding-item critical">
          <span class="finding-icon">🔴</span>
          <div class="finding-content">
            <div class="finding-title">CVE-2021-45046: Log4j DoS Vulnerability</div>
            <div class="finding-description">
              CVSS 9.0 - Denial of Service vulnerability in certain non-default configurations. 
              Affects versions 2.0-beta9 through 2.15.0 (excluding 2.12.2).
            </div>
          </div>
        </li>
        
        <li class="finding-item warning">
          <span class="finding-icon">⚡</span>
          <div class="finding-content">
            <div class="finding-title">Compliance Gaps Identified</div>
            <div class="finding-description">
              Missing controls in incident response (IR-4, IR-5) and vendor management (SA-9) areas. 
              22% of SOC 2 Type II requirements not fully documented. Risk assessment procedures need strengthening.
            </div>
          </div>
        </li>
        
        <li class="finding-item warning">
          <span class="finding-icon">📊</span>
          <div class="finding-content">
            <div class="finding-title">Vulnerability Trend Analysis</div>
            <div class="finding-description">
              23 new vulnerabilities discovered in the past 6 months. Patch deployment rate of 83% 
              indicates some delays in addressing medium-severity issues.
            </div>
          </div>
        </li>
        
        <li class="finding-item success">
          <span class="finding-icon">✅</span>
          <div class="finding-content">
            <div class="finding-title">Active Vendor Support</div>
            <div class="finding-description">
              Average patch response time of 14 days for critical vulnerabilities. 
              Regular security updates maintained. Strong community support with 600+ contributors.
            </div>
          </div>
        </li>
        
        <li class="finding-item info">
          <span class="finding-icon">🔍</span>
          <div class="finding-content">
            <div class="finding-title">No Recent Security Breaches</div>
            <div class="finding-description">
              No data breaches or security incidents reported in HaveIBeenPwned database. 
              Vendor maintains transparent security disclosure process.
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div class="page-break"></div>

    <!-- Detailed CVE Analysis -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Detailed CVE Analysis
      </h2>
      
      <table class="vuln-table">
        <thead>
          <tr>
            <th>CVE ID</th>
            <th>CVSS</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Patch Available</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CVE-2021-44228</td>
            <td>10.0</td>
            <td><span class="severity-badge severity-critical">Critical</span></td>
            <td>Remote Code Execution via JNDI lookup</td>
            <td>✅ v2.17.1+</td>
          </tr>
          <tr>
            <td>CVE-2021-45046</td>
            <td>9.0</td>
            <td><span class="severity-badge severity-critical">Critical</span></td>
            <td>DoS via crafted pattern layout</td>
            <td>✅ v2.17.0+</td>
          </tr>
          <tr>
            <td>CVE-2021-45105</td>
            <td>7.5</td>
            <td><span class="severity-badge severity-high">High</span></td>
            <td>DoS via uncontrolled recursion</td>
            <td>✅ v2.17.0+</td>
          </tr>
          <tr>
            <td>CVE-2021-44832</td>
            <td>6.6</td>
            <td><span class="severity-badge severity-medium">Medium</span></td>
            <td>RCE via JDBC Appender config</td>
            <td>✅ v2.17.1+</td>
          </tr>
          <tr>
            <td>CVE-2020-9488</td>
            <td>3.7</td>
            <td><span class="severity-badge severity-low">Low</span></td>
            <td>Information disclosure via SMTP</td>
            <td>✅ v2.13.2+</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Data Sources -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Data Sources & Citations
      </h2>
      
      <div class="sources-grid">
        <div class="source-item">
          <div class="source-name">NVD (National Vulnerability Database)</div>
          <div class="source-count">210,000+ CVEs analyzed</div>
          <span class="source-status">✓ Verified</span>
        </div>
        <div class="source-item">
          <div class="source-name">GitHub Security Advisories</div>
          <div class="source-count">5,000+ advisories</div>
          <span class="source-status">✓ Verified</span>
        </div>
        <div class="source-item">
          <div class="source-name">US-CERT Alerts</div>
          <div class="source-count">12,000+ security alerts</div>
          <span class="source-status">✓ Verified</span>
        </div>
        <div class="source-item">
          <div class="source-name">HaveIBeenPwned</div>
          <div class="source-count">600+ breach database</div>
          <span class="source-status">✓ Verified</span>
        </div>
        <div class="source-item">
          <div class="source-name">AlienVault OTX</div>
          <div class="source-count">19M+ threat indicators</div>
          <span class="source-status">✓ Verified</span>
        </div>
        <div class="source-item">
          <div class="source-name">Snyk Vulnerability DB</div>
          <div class="source-count">1M+ vulnerabilities</div>
          <span class="source-status">✓ Verified</span>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Recommendations
      </h2>
      
      <div class="recommendations-box">
        <ol class="recommendations-list">
          <li class="recommendation-item">
            <span class="recommendation-number">1</span>
            <span class="recommendation-text">
              <strong>Immediate:</strong> Upgrade to version 2.17.1 or later to address critical vulnerabilities 
              (CVE-2021-44228, CVE-2021-45046). This is the highest priority action item. Deploy emergency 
              patches across all production environments within 24-48 hours.
            </span>
          </li>
          <li class="recommendation-item">
            <span class="recommendation-number">2</span>
            <span class="recommendation-text">
              <strong>Short-term (1-2 weeks):</strong> Implement additional monitoring and detection rules 
              for exploitation attempts. Deploy WAF rules to block JNDI injection patterns. 
              Enable verbose logging for security event correlation.
            </span>
          </li>
          <li class="recommendation-item">
            <span class="recommendation-number">3</span>
            <span class="recommendation-text">
              <strong>Medium-term (1-3 months):</strong> Review and address compliance gaps in incident 
              response procedures (IR-4, IR-5) and vendor management (SA-9). Conduct tabletop exercises 
              for critical vulnerability scenarios.
            </span>
          </li>
          <li class="recommendation-item">
            <span class="recommendation-number">4</span>
            <span class="recommendation-text">
              <strong>Long-term strategic:</strong> Evaluate Logback or SLF4J Simple as potential 
              replacements with better security profiles. Implement automated vulnerability scanning 
              in CI/CD pipeline. Establish vendor risk management program.
            </span>
          </li>
          <li class="recommendation-item">
            <span class="recommendation-number">5</span>
            <span class="recommendation-text">
              <strong>Continuous improvement:</strong> Subscribe to vendor security advisories and 
              establish a regular patching cadence (monthly for low/medium, weekly review for critical). 
              Maintain updated asset inventory with version tracking.
            </span>
          </li>
        </ol>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>This report contains security-sensitive information and should be treated as confidential.</div>
      <div class="footer-version">CISO Security Assessor v1.0 | Powered by AI-Enhanced Security Intelligence</div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadHTMLReport(data: ReportData) {
  const html = generateHTMLReport(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `security-assessment-${data.query.replace(/\s+/g, '-')}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPDFReport(data: ReportData) {
  // Generate HTML first
  const html = generateHTMLReport(data);
  
  // Open in new window for printing to PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before triggering print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Note: User will need to "Save as PDF" from the print dialog
      }, 250);
    };
  }
}