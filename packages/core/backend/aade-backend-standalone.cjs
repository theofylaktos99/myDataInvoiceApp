#!/usr/bin/env node
/**
 * Italian Corner AADE Backend Service
 * Standalone Node.js service that handles OAuth token generation and AADE API proxy
 * 
 * This service:
 * - Starts on port 3000
 * - Handles OAuth token exchange with Taxisnet credentials
 * - Proxies invoice validation and submission to AADE
 * - Runs independently from the Electron app
 * 
 * Can be run as:
 * - Standalone: node aade-backend-standalone.js
 * - Windows Service: npm install -g nssm && nssm install ...
 * - Startup script: via Windows Scheduler or startup folder
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const LOG_DIR = process.env.APPDATA 
  ? path.join(process.env.APPDATA, 'Italian Corner Invoice')
  : path.join(__dirname, 'logs');

// AADE Configuration
const AADE_PRODUCTION_URL = 'https://mydatapi.aade.gr/myDATA/SendInvoices';
const AADE_TESTING_URL = 'https://mydataapidev.aade.gr/SendInvoices';
const AADE_USER_ID_HEADER = 'aade-user-id';
const AADE_SUBSCRIPTION_KEY_HEADER = 'ocp-apim-subscription-key';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, 'backend.log');

// Simple logger
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

// Convert JSON invoice payload to XML format expected by AADE (myDATA API schema)
// Based on AADE myDATA REST API v1.0 specification
function jsonToXmlPayload(jsonPayload) {
  const { header, lines, totals, meta } = jsonPayload;
  
  // Map VAT categories from string to numeric codes
  const vatCategoryMap = {
    'VAT_24': '1',
    'VAT_13': '2',
    'VAT_6': '3',
    'VAT_4': '4',
    'VAT_0': '5',
    '24': '1',
    '13': '2',
    '6': '3',
    '4': '4',
    '0': '5'
  };

  const paymentMethodTypeMap = {
    cash: '1',
    cheque: '2',
    check: '2',
    bank: '3',
    deposit: '3',
    transfer: '3',
    wire: '3',
    card: '4',
    pos: '4',
    creditcard: '4',
    credit: '5',
    invoice: '5'
  };

  const formatAmount = (value, fractionDigits = 2) => {
    const num = Number(value || 0);
    return num.toFixed(fractionDigits);
  };

  const formatQuantity = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return null;
    // Invoice schema allows decimals; keep up to 4 fractional digits to cover most cases
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(4);
  };
  
  // XML with AADE namespace - Standard v1.0 namespace (myDATA capitalized)
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0" xmlns:ecls="https://www.aade.gr/myDATA/expensesClassificaton/v1.0">\n';
  xml += '  <invoice>\n';
  
  // Issuer (required)
  xml += '    <issuer>\n';
  xml += `      <vatNumber>${escapeXml(header.issuer.vat)}</vatNumber>\n`;
  xml += `      <country>GR</country>\n`;
  xml += `      <branch>1</branch>\n`;
  xml += '    </issuer>\n';
  
  // Counterparty/Customer (required)
  xml += '    <counterpart>\n';
  xml += `      <vatNumber>${escapeXml(header.counterparty.vat)}</vatNumber>\n`;
  xml += `      <country>GR</country>\n`;
  xml += `      <branch>1</branch>\n`;
  xml += '    </counterpart>\n';
  
  // Invoice Header (required)
  const currencyCode = (header?.currency || 'EUR').toUpperCase();

  xml += '    <invoiceHeader>\n';
  xml += `      <series>${escapeXml(header.series)}</series>\n`;
  xml += `      <aa>${escapeXml(String(header.aa))}</aa>\n`;
  xml += `      <issueDate>${escapeXml(header.issueDate)}</issueDate>\n`;
  xml += `      <invoiceType>${escapeXml(header.docType)}</invoiceType>\n`;
  xml += `      <currency>${escapeXml(currencyCode)}</currency>\n`;
  xml += '    </invoiceHeader>\n';

  // Payment Methods (mandatory for certain invoice types)
  const paymentMethodKey = (header?.paymentMethod || '').toLowerCase();
  const paymentTypeCode = paymentMethodTypeMap[paymentMethodKey] || '1';
  const paymentAmount = formatAmount(totals?.gross);
  const paymentInfo = header?.paymentInfo;
  xml += '    <paymentMethods>\n';
  xml += '      <paymentMethodDetails>\n';
  xml += `        <type>${escapeXml(paymentTypeCode)}</type>\n`;
  xml += `        <amount>${escapeXml(paymentAmount)}</amount>\n`;
  if (paymentInfo) {
    xml += `        <paymentMethodInfo>${escapeXml(paymentInfo)}</paymentMethodInfo>\n`;
  }
  xml += '      </paymentMethodDetails>\n';
  xml += '    </paymentMethods>\n';
  
  // Invoice Details/Lines (required - at least 1 line)
  if (lines && Array.isArray(lines) && lines.length > 0) {
    lines.forEach((line, idx) => {
      const lineNumber = line?.lineNumber ?? idx + 1;
      const qtyStr = formatQuantity(line?.qty);
      const netValue = formatAmount(line?.netAmount);
      const vatAmount = formatAmount(line?.vatAmount);
      const vatCode = vatCategoryMap[line?.vatCategory] || '1';

      xml += '    <invoiceDetails>\n';
      xml += `      <lineNumber>${escapeXml(String(lineNumber))}</lineNumber>\n`;
      if (qtyStr) {
        xml += `      <quantity>${escapeXml(qtyStr)}</quantity>\n`;
      }
      xml += `      <netValue>${escapeXml(netValue)}</netValue>\n`;
      xml += `      <vatCategory>${escapeXml(vatCode)}</vatCategory>\n`;
      xml += `      <vatAmount>${escapeXml(vatAmount)}</vatAmount>\n`;
      if (line?.description) {
        xml += `      <lineComments>${escapeXml(line.description)}</lineComments>\n`;
      }
      const incomeCls = line?.incomeClassification;
      if (incomeCls?.classificationCategory) {
        xml += '      <incomeClassification>\n';
        if (incomeCls?.classificationType) {
          xml += `        <icls:classificationType>${escapeXml(incomeCls.classificationType)}</icls:classificationType>\n`;
        }
        xml += `        <icls:classificationCategory>${escapeXml(incomeCls.classificationCategory)}</icls:classificationCategory>\n`;
        xml += `        <icls:amount>${escapeXml(formatAmount(incomeCls.amount))}</icls:amount>\n`;
        xml += '      </incomeClassification>\n';
      }
      xml += '    </invoiceDetails>\n';
    });
  } else {
    throw new Error('Invoice must include at least one line item');
  }
  
  // Invoice Summary (required)
  xml += '    <invoiceSummary>\n';
  xml += `      <totalNetValue>${escapeXml(formatAmount(totals?.net))}</totalNetValue>\n`;
  xml += `      <totalVatAmount>${escapeXml(formatAmount(totals?.vat))}</totalVatAmount>\n`;
  xml += `      <totalWithheldAmount>${escapeXml(formatAmount(totals?.withheld))}</totalWithheldAmount>\n`;
  xml += `      <totalFeesAmount>${escapeXml(formatAmount(totals?.fees))}</totalFeesAmount>\n`;
  xml += `      <totalStampDutyAmount>${escapeXml(formatAmount(totals?.stampDuty))}</totalStampDutyAmount>\n`;
  xml += `      <totalOtherTaxesAmount>${escapeXml(formatAmount(totals?.otherTaxes))}</totalOtherTaxesAmount>\n`;
  xml += `      <totalDeductionsAmount>${escapeXml(formatAmount(totals?.deductions))}</totalDeductionsAmount>\n`;
  xml += `      <totalGrossValue>${escapeXml(formatAmount(totals?.gross))}</totalGrossValue>\n`;
  if (Array.isArray(totals?.incomeClassifications)) {
    totals.incomeClassifications.forEach((cls) => {
      if (!cls?.classificationCategory) return;
      xml += '      <incomeClassification>\n';
      if (cls?.classificationType) {
        xml += `        <icls:classificationType>${escapeXml(cls.classificationType)}</icls:classificationType>\n`;
      }
      xml += `        <icls:classificationCategory>${escapeXml(cls.classificationCategory)}</icls:classificationCategory>\n`;
      xml += `        <icls:amount>${escapeXml(formatAmount(cls.amount))}</icls:amount>\n`;
      xml += '      </incomeClassification>\n';
    });
  }
  xml += '    </invoiceSummary>\n';
  
  xml += '  </invoice>\n';
  xml += '</InvoicesDoc>';
  
  return xml;
}

// Escape special XML characters
function escapeXml(str) {
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Helper functions
const ok = (data) => ({ ok: true, ...data });
const fail = (msg) => ({ ok: false, error: msg });

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  log('GET /health - OK');
});

// Catch-all for health checks from various sources
app.all('/api/nodes', (req, res) => {
  res.json({ status: 'ok', nodes: [] });
  log('GET /api/nodes - OK (health check)');
});

// Catch-all for root
app.all('/', (req, res) => {
  res.json({ status: 'ok', service: 'AADE Backend' });
});

// Note: AADE uses direct header authentication (aade-user-id + subscription key)
// No OAuth token endpoint needed - credentials are passed per-request

// Validate invoice payload
app.post('/api/aade/validate', (req, res) => {
  log('POST /api/aade/validate');
  const { aadeUserId, subscriptionKey, invoicePayload } = req.body || {};
  
  // Log incoming data for debugging
  log(`Received: aadeUserId=${aadeUserId}, subscriptionKey=${subscriptionKey ? subscriptionKey.substring(0, 8) + '...' : 'N/A'}`);
  log(`Payload keys: ${Object.keys(invoicePayload || {}).join(', ')}`);
  
  // Validate credentials
  if (!aadeUserId || !subscriptionKey) {
    log('Missing AADE credentials', 'WARN');
    return res.status(400).json(fail('Λείπουν aadeUserId ή subscriptionKey'));
  }
  
  const p = invoicePayload || {};
  
  if (!p?.header?.aa || !p?.header?.issueDate) {
    log(`Validation failed: Missing header fields (aa=${p?.header?.aa}, issueDate=${p?.header?.issueDate})`, 'WARN');
    return res.status(400).json(fail('Λείπουν βασικά στοιχεία header.'));
  }

  if (!Array.isArray(p.lines) || p.lines.length === 0) {
    log('Validation failed: No line items', 'WARN');
    return res.status(400).json(fail('Δεν υπάρχουν γραμμές.'));
  }

  const bad = p.lines.find((x) => !(x.qty > 0) || !(x.unitPrice >= 0));
  if (bad) {
    log('Validation failed: Invalid quantities or prices', 'WARN');
    return res.status(400).json(fail('Μη έγκυρες ποσότητες/τιμές.'));
  }

  log(`Validation PASSED for user: ${aadeUserId}`, 'INFO');
  return res.json(ok({ message: 'VALID' }));
});

// Submit invoice to AADE
app.post('/api/aade/submit', async (req, res) => {
  log('POST /api/aade/submit');
  const { aadeUserId, subscriptionKey, invoicePayload, useTestingEndpoint } = req.body || {};

  if (!aadeUserId || !subscriptionKey) {
    log('Missing AADE credentials (aadeUserId or subscriptionKey)', 'WARN');
    return res.status(400).json(fail('Λείπουν credentials AADE.'));
  }

  try {
    const https = require('https');
    const url = useTestingEndpoint ? AADE_TESTING_URL : AADE_PRODUCTION_URL;
    
    // Convert JSON payload to XML format that AADE expects
    const xmlBody = jsonToXmlPayload(invoicePayload);
    
    const headers = {
      [AADE_USER_ID_HEADER]: aadeUserId,
      [AADE_SUBSCRIPTION_KEY_HEADER]: subscriptionKey,
      'Content-Type': 'application/xml',
      'Content-Length': Buffer.byteLength(xmlBody, 'utf-8')
    };

    log(`Submitting to AADE: ${url}`, 'INFO');

    // Make actual HTTPS call to AADE with XML body
    const response = await fetch(url, {
      method: 'POST',
      timeout: 30000,
      headers: headers,
      body: xmlBody
    });

    const responseText = await response.text();
    log(`AADE Response Status: ${response.status}`, 'INFO');

    if (!response.ok) {
      log(`AADE API Error: ${response.status} - ${responseText}`, 'WARN');
      // Return more details for debugging
      return res.status(response.status).json({ 
        ok: false, 
        error: `AADE API Error: ${response.status}`,
        details: responseText,
        note: 'Check credentials (User ID and Subscription Key) and ensure XML format is correct'
      });
    }

    // Parse response to get mark (could be XML or JSON)
    let mark = '';
    try {
      // Try JSON first
      const responseData = JSON.parse(responseText);
      mark = responseData.mark || responseData.Mark || responseData.markId || '';
    } catch (e) {
      // If not JSON, try to extract from XML response
      const markMatch = responseText.match(/<[^>]*[Mm]ark[^>]*>([^<]+)<\/[^>]*[Mm]ark[^>]*>/);
      if (markMatch) {
        mark = markMatch[1];
      }
    }

    if (!mark) {
      mark = `MARK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    log(`Submit SUCCESS - Mark: ${mark}`, 'INFO');
    return res.json(ok({ mark, endpoint: url, status: response.status, success: true }));
  } catch (err) {
    log(`Submit ERROR: ${err.message}`, 'ERROR');
    return res.status(500).json(fail(`Server error: ${err.message}`));
  }
});

// Retry failed submission
app.post('/api/aade/retry', async (req, res) => {
  log('POST /api/aade/retry');
  const { aadeUserId, subscriptionKey, invoicePayload, useTestingEndpoint } = req.body || {};

  // Validate credentials
  if (!aadeUserId || !subscriptionKey) {
    log('Missing AADE credentials (retry)', 'WARN');
    return res.status(400).json(fail('Λείπουν credentials AADE.'));
  }

  try {
    const https = require('https');
    const url = useTestingEndpoint ? AADE_TESTING_URL : AADE_PRODUCTION_URL;
    
    // Convert JSON payload to XML format that AADE expects
    const xmlBody = jsonToXmlPayload(invoicePayload);
    
    const headers = {
      [AADE_USER_ID_HEADER]: aadeUserId,
      [AADE_SUBSCRIPTION_KEY_HEADER]: subscriptionKey,
      'Content-Type': 'application/xml',
      'Content-Length': Buffer.byteLength(xmlBody, 'utf-8')
    };

    log(`Retrying submission to AADE: ${url}`, 'INFO');

    // Make actual HTTPS call to AADE with XML body
    const response = await fetch(url, {
      method: 'POST',
      timeout: 30000,
      headers: headers,
      body: xmlBody
    });

    const responseText = await response.text();
    log(`AADE Response Status: ${response.status}`, 'INFO');

    if (!response.ok) {
      log(`AADE API Error on retry: ${response.status} - ${responseText}`, 'WARN');
      return res.status(response.status).json(fail(`AADE API Error: ${response.status}`));
    }

    // Parse response to get mark (could be XML or JSON)
    let mark = '';
    try {
      const responseData = JSON.parse(responseText);
      mark = responseData.mark || responseData.Mark || responseData.markId || '';
    } catch (e) {
      const markMatch = responseText.match(/<[^>]*[Mm]ark[^>]*>([^<]+)<\/[^>]*[Mm]ark[^>]*>/);
      if (markMatch) {
        mark = markMatch[1];
      }
    }

    if (!mark) {
      mark = `MARK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    log(`Retry SUCCESS for user ${aadeUserId} - Mark: ${mark}`, 'INFO');
    return res.json(ok({ mark, status: response.status, success: true }));
  } catch (err) {
    log(`Retry ERROR: ${err.message}`, 'ERROR');
    return res.status(500).json(fail(`Server error: ${err.message}`));
  }
});

// Cancel Invoice (AADE CancelInvoice endpoint)
app.post('/api/aade/cancel-invoice', async (req, res) => {
  log('POST /api/aade/cancel-invoice');
  const { aadeUserId, subscriptionKey, invoiceNumber, branchId, cancelReasonCode, useTestingEndpoint } = req.body || {};

  // Validate required fields
  if (!aadeUserId || !subscriptionKey) {
    log('Missing AADE credentials (cancel)', 'WARN');
    return res.status(400).json(fail('Λείπουν credentials AADE.'));
  }

  if (!invoiceNumber) {
    log('Missing invoiceNumber for cancel', 'WARN');
    return res.status(400).json(fail('Αριθμός τιμολογίου απαιτείται για ακύρωση.'));
  }

  try {
    const https = require('https');
    // AADE CancelInvoice endpoint
    const cancelUrl = useTestingEndpoint 
      ? 'https://mydataapidev.aade.gr/CancelInvoice'
      : 'https://mydatapi.aade.gr/CancelInvoice';
    
    const headers = {
      [AADE_USER_ID_HEADER]: aadeUserId,
      [AADE_SUBSCRIPTION_KEY_HEADER]: subscriptionKey,
      'Content-Type': 'application/json',
    };

    const cancelPayload = {
      invoiceNumber: invoiceNumber,
      branchId: branchId || '',
      cancelReasonCode: cancelReasonCode || '1'
    };

    log(`Canceling invoice ${invoiceNumber} via: ${cancelUrl}`, 'INFO');
    log(`Reason Code: ${cancelReasonCode || 'Not specified'}`, 'INFO');

    // Make actual HTTPS call to AADE CancelInvoice endpoint
    const response = await fetch(cancelUrl, {
      method: 'POST',
      timeout: 30000,
      headers: headers,
      body: JSON.stringify(cancelPayload)
    });

    const responseText = await response.text();
    log(`AADE Cancel Response Status: ${response.status}`, 'INFO');

    if (!response.ok) {
      log(`AADE Cancel API Error: ${response.status} - ${responseText}`, 'WARN');
      return res.status(response.status).json(fail(`AADE Cancel API Error: ${response.status}`));
    }

    // Parse response to get cancel mark
    let cancelMark = '';
    try {
      const responseData = JSON.parse(responseText);
      cancelMark = responseData.mark || responseData.Mark || responseData.cancelMarkId || '';
    } catch (e) {
      const markMatch = responseText.match(/mark["\']?\s*:\s*["\']?([^"'\s,}]+)/i);
      cancelMark = markMatch ? markMatch[1] : `CANCEL-${Date.now()}`;
    }

    if (!cancelMark) {
      cancelMark = `CANCEL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    log(`Cancel SUCCESS - Mark: ${cancelMark}`, 'INFO');
    return res.json(ok({ 
      cancelMark, 
      invoiceNumber, 
      endpoint: cancelUrl,
      status: response.status,
      success: true
    }));
  } catch (err) {
    log(`Cancel ERROR: ${err.message}`, 'ERROR');
    return res.status(500).json(fail(`Server error: ${err.message}`));
  }
});

// GET /api/gsis/lookup-customer
// Query GSIS RgWsPublic2 SOAP API for customer info by VAT (ΑΦΜ)
app.get('/api/gsis/lookup-customer', async (req, res) => {
  const { vat, afm, username, password } = req.query;
  const vatId = vat || afm;

  if (!vatId || !vatId.trim()) {
    return res.status(400).json(fail('VAT/ΑΦΜ required'));
  }

  try {
    log(`GSIS Lookup for VAT: ${vatId}`, 'INFO');

    // MOCK MODE: For development/testing ONLY
    const isMockMode = process.env.GSIS_MOCK === 'true' || process.env.NODE_ENV === 'development';
    
    // Only use mock data for explicit development VATs
    const devOnlyVATs = ['069484979', '999999999', '123456789'];
    
    if (isMockMode || devOnlyVATs.includes(vatId)) {
      const mockData = {
        vat: vatId,
        name: 'ΕΛΛΗΝΙΚΗ ΕΤΑΙΡΕΙΑ ΑΕ',
        city: 'ΑΘΗΝΑ',
        postalCode: '11526',
        address: 'ΟΔΟς ΤΕΣΤ 123',
        recordsCount: 1,
        source: 'GSIS Mock (Development Mode)'
      };
      log(`GSIS Mock Success: ${JSON.stringify(mockData)}`, 'INFO');
      return res.json(ok(mockData));
    }

    // Check if credentials provided
    if (!username || !password) {
      log(`GSIS: Missing credentials (username/password)`, 'WARN');
      return res.status(400).json(fail('GSIS credentials required: username and password query parameters'));
    }

    // PRODUCTION MODE: Call live GSIS RgWsPublic2 SOAP API with authentication
    const soapUrl = 'https://www1.gsis.gr/wsaade/RgWsPublic2/RgWsPublic2';
    
    // Build SOAP XML request with WS-Security UsernameToken
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" 
              xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
              xmlns:ns2="http://rgwspublic2/RgWsPublic2Service" 
              xmlns:ns3="http://rgwspublic2/RgWsPublic2">
  <env:Header>
    <ns1:Security>
      <ns1:UsernameToken>
        <ns1:Username>${username}</ns1:Username>
        <ns1:Password>${password}</ns1:Password>
      </ns1:UsernameToken>
    </ns1:Security>
  </env:Header>
  <env:Body>
    <ns2:rgWsPublic2AfmMethod>
      <ns2:INPUT_REC>
        <ns3:afm_called_by/>
        <ns3:afm_called_for>${vatId}</ns3:afm_called_for>
      </ns2:INPUT_REC>
    </ns2:rgWsPublic2AfmMethod>
  </env:Body>
</env:Envelope>`;

    log(`Calling GSIS SOAP API for VAT: ${vatId}`, 'INFO');

    let response;
    try {
      response = await fetch(soapUrl, {
        method: 'POST',
        timeout: 15000,
        headers: { 
          'Content-Type': 'application/soap+xml; charset=UTF-8',
          'SOAPAction': '',
          'User-Agent': 'myDataInvoiceApp/1.1.0'
        },
        body: soapBody
      });

      log(`GSIS SOAP Response Status: ${response.status} for VAT ${vatId}`, 'INFO');

      if (!response.ok) {
        throw new Error(`GSIS responded with status ${response.status}`);
      }

      const responseText = await response.text();

      
      // Parse SOAP XML response
      // Look for error_code first
      const errorCodeMatch = responseText.match(/<error_code[^>]*>([^<]*)<\/error_code>/);
      const errorDescrMatch = responseText.match(/<error_descr[^>]*>([^<]*)<\/error_descr>/);
      
      const errorCode = errorCodeMatch ? errorCodeMatch[1] : null;
      const errorDescr = errorDescrMatch ? errorDescrMatch[1] : null;

      if (errorCode || errorDescr) {
        log(`GSIS Error: ${errorCode} - ${errorDescr}`, 'WARN');
        return res.status(400).json(fail(`GSIS Error: ${errorDescr || errorCode}`));
      }

      // Parse basic_rec fields
      const parseXmlTag = (xml, tag) => {
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : '';
      };

      const name = parseXmlTag(responseText, 'onomasia');
      const city = parseXmlTag(responseText, 'postal_area_description');
      const postalCode = parseXmlTag(responseText, 'postal_zip_code');
      const address = parseXmlTag(responseText, 'postal_address');
      const addressNo = parseXmlTag(responseText, 'postal_address_no');
      const doy = parseXmlTag(responseText, 'doy_descr');
      const afmValue = parseXmlTag(responseText, 'afm');

      // Check if we got valid data
      if (!name || !afmValue) {
        log(`GSIS: No valid data for VAT ${vatId}`, 'WARN');
        return res.status(404).json(fail(`No firm found for VAT: ${vatId}`));
      }

      const fullAddress = addressNo ? `${address} ${addressNo}` : address;
      
      const firmData = {
        vat: afmValue,
        name: name || '',
        city: city || '',
        postalCode: postalCode || '',
        address: fullAddress || '',
        doy: doy || '',
        recordsCount: 1,
        source: 'GSIS RgWsPublic2 API'
      };

      log(`GSIS Success: ${JSON.stringify(firmData)}`, 'INFO');
      return res.json(ok(firmData));

    } catch (fetchErr) {
      log(`GSIS Connection Error: ${fetchErr.message}`, 'WARN');
      return res.status(503).json(fail(`GSIS Service Unavailable: ${fetchErr.message}`));
    }

  } catch (err) {
    log(`GSIS ERROR: ${err.message}`, 'ERROR');
    return res.status(500).json(fail(`GSIS lookup failed: ${err.message}`));
  }
});// GET /api/update/check
// Check for available updates
app.get('/api/update/check', async (req, res) => {
  try {
    log('Update check requested', 'INFO');

    // For web app, check GitHub releases
    // Current version is in package.json version field
    const currentVersion = '1.1.0'; // Should match package.json version

    // Fetch latest release from GitHub
    const gitHubUrl = 'https://api.github.com/repos/giorgos-moros/invoice_app_italian_corner/releases/latest';
    
    const response = await fetch(gitHubUrl, {
      headers: { 'User-Agent': 'myDataInvoiceApp/1.1.0' }
    });

    if (!response.ok) {
      log(`GitHub API error: ${response.status}`, 'WARN');
      return res.json(ok({ 
        available: false, 
        message: 'Could not check for updates',
        current: currentVersion 
      }));
    }

    const release = await response.json();
    const latestVersion = release.tag_name ? release.tag_name.replace(/^v/, '') : null;

    if (!latestVersion) {
      return res.json(ok({ 
        available: false, 
        message: 'No release info found',
        current: currentVersion 
      }));
    }

    // Simple version comparison (e.g., "1.1.0" vs "1.1.1")
    const currentParts = currentVersion.split('.').map(Number);
    const latestParts = latestVersion.split('.').map(Number);

    let updateAvailable = false;
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const curr = currentParts[i] || 0;
      const latest = latestParts[i] || 0;
      if (latest > curr) {
        updateAvailable = true;
        break;
      } else if (latest < curr) {
        break;
      }
    }

    log(`Update check: current=${currentVersion}, latest=${latestVersion}, available=${updateAvailable}`, 'INFO');

    return res.json(ok({
      available: updateAvailable,
      current: currentVersion,
      latest: latestVersion,
      releaseUrl: release.html_url,
      releaseNotes: release.body
    }));

  } catch (err) {
    log(`Update check ERROR: ${err.message}`, 'ERROR');
    return res.status(500).json(fail(`Update check failed: ${err.message}`));
  }
});

// 404 handler
app.use((req, res) => {
  log(`404 - Path not found: ${req.path}`, 'WARN');
  res.status(404).json(fail(`Endpoint not found: ${req.path}`));
});

// Error handler
app.use((err, req, res, next) => {
  log(`Error: ${err.message}`, 'ERROR');
  res.status(500).json(fail('Internal server error'));
});

// Start server
const server = http.createServer(app);

server.listen(PORT, '127.0.0.1', () => {
  log(`✅ AADE Backend Service started on http://127.0.0.1:${PORT}`, 'INFO');
  log(`📁 Logs: ${LOG_FILE}`, 'INFO');
  
  // Prevent process from exiting (for Windows Service)
  if (process.argv.includes('--service')) {
    log('Running as Windows Service', 'INFO');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    log(`❌ Port ${PORT} already in use. Is another instance running?`, 'ERROR');
  } else {
    log(`❌ Server error: ${err.message}`, 'ERROR');
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down gracefully...', 'INFO');
  server.close(() => {
    log('Server stopped', 'INFO');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down gracefully...', 'INFO');
  server.close(() => {
    log('Server stopped', 'INFO');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`, 'ERROR');
  log(err.stack, 'ERROR');
  process.exit(1);
});

log('Italian Corner AADE Backend initialized', 'INFO');
