const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Automated contract generator.
 *
 * Produces legally-structured PDF agreements from a small set of inputs:
 *   - 'client'             -> Services Agreement (Syntrix builds for a client)
 *   - 'member-contractor'  -> Independent Contractor Agreement (freelance team member)
 *   - 'member-employee'    -> Employment Agreement (salaried team member)
 *
 * These are solid, standard templates written for Indian jurisdiction. They are
 * NOT a substitute for review by a qualified lawyer — see LEGAL_DISCLAIMER.
 */

// ---------------------------------------------------------------------------
// Company configuration — EDIT THESE for your registered details.
// CONTRACT_CITY / CONTRACT_COMPANY can also be set via env without code changes.
// ---------------------------------------------------------------------------
const COMPANY = {
  name: process.env.CONTRACT_COMPANY || 'Syntrix Labs',
  // The city whose courts govern the contract: "courts of <city>, India".
  city: process.env.CONTRACT_CITY || '[CITY]',
  country: 'India',
  website: 'syntrixlabs.in',
  email: process.env.MAIL_FROM_ADDRESS || 'hello@syntrixlabs.in'
};

const LEGAL_DISCLAIMER =
  'This document is a template generated for convenience and does not constitute legal advice. ' +
  'Both parties should have it reviewed by a qualified legal professional before signing.';

const CONTRACT_TYPES = ['client', 'member-contractor', 'member-employee'];

const TYPE_META = {
  'client': { title: 'SERVICES AGREEMENT', kind: 'client' },
  'member-contractor': { title: 'INDEPENDENT CONTRACTOR AGREEMENT', kind: 'member' },
  'member-employee': { title: 'EMPLOYMENT AGREEMENT', kind: 'member' }
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const today = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

const money = (value, currency = 'INR') => {
  if (value === undefined || value === null || value === '') return '__________';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${currency} ${num.toLocaleString('en-IN')}`;
};

const fallback = (value, placeholder = '__________') =>
  (value === undefined || value === null || String(value).trim() === '') ? placeholder : String(value).trim();

// ---------------------------------------------------------------------------
// Compensation mode (member contracts):
//   salary -> a fixed monthly amount
//   share  -> a percentage cut paid per deal/project worked on (NOT equity)
//   both   -> monthly salary + per-deal share
// ---------------------------------------------------------------------------
function normalizeCompType(data) {
  const t = String(data.compType || '').toLowerCase().trim();
  // Accept legacy 'equity' aliases but treat everything as a deal-based share.
  if (['share', 'shares', 'equity', 'stock'].includes(t)) return 'share';
  if (['both', 'salary+share', 'salary-share', 'salary and share', 'salary & share', 'salary+equity'].includes(t)) return 'both';
  if (t === 'salary') return 'salary';
  // No explicit type: infer 'both' if a share was provided, else 'salary'.
  return (data.share || data.equity) ? 'both' : 'salary';
}

// A per-deal revenue share — explicitly NOT company equity, shares, or ownership.
function shareClause(data, who) {
  const share = fallback(data.share || data.equity, 'a percentage share of each deal as separately agreed in writing');
  const basis = fallback(data.shareBasis || data.vesting, 'the net amount the Company actually receives from the client for that deal, payable within seven (7) days of the Company receiving such payment');
  return {
    heading: 'Per-Deal Revenue Share',
    body: [
      `In addition to or in place of any fixed salary, the Company shall pay the ${who} ${share} (the "Deal Share") for each project, engagement, or deal that the ${who} works on or materially contributes to, as confirmed in writing for that deal.`,
      `The Deal Share is calculated on ${basis}. It accrues and is paid on a per-deal basis only. No Deal Share is payable in respect of deals the ${who} did not work on, or in respect of amounts the Company does not actually receive.`,
      `The Deal Share is a purely contractual revenue-sharing arrangement tied to specific work. It does not constitute equity, shares, securities, ownership, or any voting, dividend, or management right in the Company, and does not create any partnership between the parties.`
    ]
  };
}

// Returns the Compensation clause (and a Per-Deal Revenue Share clause when applicable).
function memberCompensationClauses(data, { who, cashDefault, taxLine }) {
  const mode = normalizeCompType(data);
  const cash = money(data.fee, data.currency);
  const cashBasis = fallback(data.paymentTerms, cashDefault);
  const cashWord = who === 'Employee' ? 'salary' : 'fee';

  if (mode === 'share') {
    return [
      { heading: 'Compensation', body: [
        `The ${who}'s compensation under this Agreement is by way of a per-deal revenue share only, as set out in the following clause. No fixed monthly ${cashWord} is payable under this Agreement unless separately agreed in writing.`
      ]},
      shareClause(data, who)
    ];
  }
  if (mode === 'both') {
    return [
      { heading: 'Compensation', body: [
        `The Company shall pay the ${who} a fixed amount of ${cash}, ${cashBasis}.`,
        taxLine,
        `In addition to the fixed amount above, the ${who} shall also receive a per-deal revenue share as set out in the following clause.`
      ]},
      shareClause(data, who)
    ];
  }
  return [
    { heading: 'Compensation', body: [
      `The Company shall pay the ${who} a fixed amount of ${cash}, ${cashBasis}.`,
      taxLine
    ]}
  ];
}

// ---------------------------------------------------------------------------
// Clause builders — each returns a list of { heading, body: [paragraphs] }.
// Clauses are numbered automatically at render time (do not prefix headings).
// ---------------------------------------------------------------------------
function clientClauses(data) {
  const scope = fallback(data.scope, 'the design, development, and delivery of the software/website project as described by the Client and agreed in writing between the parties');
  const fee = money(data.fee, data.currency);
  const payment = fallback(data.paymentTerms, '50% of the Total Fee is payable in advance before work begins, and the remaining 50% on delivery, due within seven (7) days of each invoice');
  const timeline = fallback(data.timeline, 'as mutually agreed in writing between the parties');

  return [
    { heading: 'Engagement & Scope of Work', body: [
      `The Client engages the Service Provider to perform ${scope} (the "Services"). Any work outside this defined scope shall be treated as a change request and may be subject to additional fees and timelines, agreed in writing before that work begins.`
    ]},
    { heading: 'Deliverables & Timeline', body: [
      `The Service Provider shall deliver the agreed deliverables according to the following timeline: ${timeline}.`,
      'Timelines assume the Client provides required materials, approvals, and feedback promptly. Delays caused by the Client may extend delivery dates accordingly.'
    ]},
    { heading: 'Fees & Payment', body: [
      `The total fee for the Services is ${fee} ("Total Fee"), exclusive of applicable taxes (including GST where chargeable).`,
      `Payment terms: ${payment}.`,
      'Late payments may attract interest at 1.5% per month on the outstanding amount. The Service Provider may pause work on overdue accounts after written notice.'
    ]},
    { heading: 'Client Responsibilities', body: [
      'The Client shall provide accurate information, content, brand assets, access credentials, and timely feedback required for the Services. The Client warrants it owns or is licensed to use all materials it supplies.'
    ]},
    { heading: 'Intellectual Property', body: [
      'Upon receipt of full payment of the Total Fee, the Service Provider assigns to the Client all intellectual property rights in the final deliverables created specifically for the Client under this Agreement.',
      'The Service Provider retains ownership of its pre-existing tools, libraries, frameworks, and know-how, and grants the Client a non-exclusive licence to use such elements as embedded in the deliverables. Third-party and open-source components remain subject to their own licences.'
    ]},
    { heading: 'Confidentiality', body: [
      'Each party shall keep confidential all non-public information disclosed by the other and use it solely to perform this Agreement. This obligation survives termination for a period of three (3) years.'
    ]},
    { heading: 'Warranties & Defect Correction', body: [
      'The Service Provider warrants the Services will be performed with reasonable skill and care. For thirty (30) days after delivery, the Service Provider will correct material defects in the deliverables at no additional charge. This excludes issues caused by Client modifications, third-party services, or changes outside the agreed scope.'
    ]},
    { heading: 'Limitation of Liability', body: [
      'To the maximum extent permitted by law, neither party is liable for indirect, incidental, or consequential losses. The Service Provider\'s total aggregate liability under this Agreement shall not exceed the Total Fee actually paid by the Client.'
    ]},
    { heading: 'Term & Termination', body: [
      'Either party may terminate this Agreement on fourteen (14) days\' written notice, or immediately on a material breach not cured within fourteen (14) days of notice. On termination, the Client shall pay for all Services performed up to the termination date.'
    ]},
    { heading: 'Independent Contractor', body: [
      'The Service Provider acts as an independent contractor. Nothing in this Agreement creates an employment, partnership, or agency relationship between the parties.'
    ]},
    { heading: 'Force Majeure', body: [
      'Neither party is liable for delays or failures caused by events beyond its reasonable control, including acts of God, war, strikes, internet or infrastructure failures, or government action.'
    ]},
    { heading: 'Governing Law & Dispute Resolution', body: [
      `This Agreement is governed by the laws of ${COMPANY.country}. The parties shall first attempt to resolve disputes amicably; failing that, disputes shall be subject to the exclusive jurisdiction of the courts of ${COMPANY.city}, ${COMPANY.country}.`
    ]},
    { heading: 'Entire Agreement', body: [
      'This Agreement constitutes the entire understanding between the parties and supersedes all prior discussions. Amendments must be in writing and signed by both parties.'
    ]}
  ];
}

function contractorClauses(data) {
  const role = fallback(data.role, 'Contributor');
  const term = fallback(data.timeline, 'until the engaged work is completed or terminated under this Agreement');

  return [
    { heading: 'Engagement', body: [
      `The Company engages the Contractor to provide services in the capacity of ${role} on an independent, non-exclusive basis. The Contractor shall perform the work with professional skill and care and according to reasonable instructions of the Company.`
    ]},
    { heading: 'Term', body: [
      `This engagement begins on the Effective Date and continues ${term}.`
    ]},
    ...memberCompensationClauses(data, {
      who: 'Contractor',
      cashDefault: 'per month, payable within seven (7) days of the monthly invoice',
      taxLine: 'The Contractor is responsible for their own taxes. The Company will deduct tax at source (TDS) where required by law. No employment benefits, paid leave, or statutory contributions apply to this engagement.'
    }),
    { heading: 'Independent Contractor Status', body: [
      'The Contractor is an independent contractor, not an employee, partner, or agent of the Company. The Contractor controls their own working hours and methods and is free to provide services to others, provided this does not breach the confidentiality or conflict-of-interest terms below.'
    ]},
    { heading: 'Intellectual Property Assignment', body: [
      'All work product, code, designs, documentation, and inventions created by the Contractor in the course of this engagement ("Work Product") are "works made for hire" and the exclusive property of the Company.',
      'The Contractor irrevocably assigns to the Company all intellectual property rights in the Work Product and agrees to sign any documents reasonably required to perfect this assignment. The Contractor waives any moral rights to the extent permitted by law.'
    ]},
    { heading: 'Confidentiality', body: [
      'The Contractor shall keep confidential all proprietary, client, technical, and business information of the Company, during and after the engagement, and shall not use it except to perform the services. This obligation survives indefinitely for trade secrets and for three (3) years for other confidential information.'
    ]},
    { heading: 'Non-Solicitation', body: [
      'During the engagement and for twelve (12) months after it ends, the Contractor shall not directly solicit the Company\'s clients or personnel whom they worked with, for competing services, without the Company\'s written consent.'
    ]},
    { heading: 'Conflict of Interest', body: [
      'The Contractor shall disclose any engagement that could conflict with the interests of the Company or its clients, and shall not use the Company\'s confidential information for the benefit of any competitor.'
    ]},
    { heading: 'Warranties', body: [
      'The Contractor warrants that the Work Product is original, does not infringe any third-party rights, and that the Contractor is free to enter into this Agreement.'
    ]},
    { heading: 'Termination', body: [
      'Either party may terminate this engagement on seven (7) days\' written notice, or immediately for material breach. On termination, the Company shall pay for all approved work completed, and the Contractor shall return or delete all Company materials and confidential information.'
    ]},
    { heading: 'Limitation of Liability', body: [
      'Neither party is liable for indirect or consequential losses. The Contractor\'s confidentiality and IP obligations are not subject to any liability cap.'
    ]},
    { heading: 'Governing Law & Jurisdiction', body: [
      `This Agreement is governed by the laws of ${COMPANY.country}, and the courts of ${COMPANY.city}, ${COMPANY.country} shall have exclusive jurisdiction over any dispute.`
    ]},
    { heading: 'Entire Agreement', body: [
      'This Agreement is the entire agreement between the parties regarding this engagement and supersedes all prior arrangements. Amendments must be in writing and signed by both parties.'
    ]}
  ];
}

function employeeClauses(data) {
  const role = fallback(data.role, 'Team Member');
  const probation = fallback(data.probation, 'three (3) months');
  const notice = fallback(data.notice, 'thirty (30) days');

  return [
    { heading: 'Appointment & Role', body: [
      `The Company appoints the Employee to the position of ${role}. The Employee shall perform the duties of this role and such other reasonable duties as assigned, and shall report as directed by the Company.`
    ]},
    { heading: 'Commencement & Probation', body: [
      `Employment begins on the Effective Date and is subject to a probation period of ${probation}, during which either party may terminate on shorter notice as set out below. On successful completion, employment is confirmed.`
    ]},
    ...memberCompensationClauses(data, {
      who: 'Employee',
      cashDefault: 'per month, payable on or before the last working day of each month, subject to lawful deductions',
      taxLine: 'The Company will deduct income tax (TDS) and make statutory contributions where applicable by law. The salary structure may be revised at the Company\'s discretion based on performance and policy.'
    }),
    { heading: 'Working Hours & Leave', body: [
      'Standard working hours and leave entitlement (including casual, sick, and earned leave) shall be as per the Company\'s policies and applicable law. The Employee may be required to work additional hours as reasonably needed.'
    ]},
    { heading: 'Place of Work', body: [
      'The Employee shall work from the Company\'s designated location or remotely as agreed, and may be required to work at client sites or travel as reasonably necessary.'
    ]},
    { heading: 'Confidentiality', body: [
      'The Employee shall keep confidential all proprietary, client, technical, and business information of the Company, during and after employment, and shall use it solely for performing their duties. This obligation survives termination of employment.'
    ]},
    { heading: 'Intellectual Property', body: [
      'All work product, inventions, code, and designs created by the Employee in the course of employment are the exclusive property of the Company. The Employee assigns all such intellectual property rights to the Company and shall execute documents required to perfect this assignment.'
    ]},
    { heading: 'Non-Solicitation & Non-Compete', body: [
      'During employment and for twelve (12) months thereafter, the Employee shall not solicit the Company\'s clients or employees for competing purposes, nor engage in any business that directly competes with the Company using its confidential information, to the extent enforceable under applicable law.'
    ]},
    { heading: 'Code of Conduct', body: [
      'The Employee shall comply with the Company\'s policies, act in good faith and in the Company\'s best interests, and avoid conflicts of interest.'
    ]},
    { heading: 'Termination', body: [
      `After probation, either party may terminate employment by giving ${notice} written notice or salary in lieu thereof. The Company may terminate without notice for gross misconduct, breach of this Agreement, or conduct prejudicial to the Company.`,
      'On termination, the Employee shall return all Company property, documents, and confidential information and shall be entitled to dues lawfully payable up to the last working day.'
    ]},
    { heading: 'Governing Law & Jurisdiction', body: [
      `This Agreement is governed by the laws of ${COMPANY.country}, and the courts of ${COMPANY.city}, ${COMPANY.country} shall have exclusive jurisdiction over any dispute.`
    ]},
    { heading: 'Entire Agreement', body: [
      'This Agreement, together with the Company\'s policies, constitutes the entire understanding of employment and supersedes prior arrangements. Amendments must be in writing and signed by both parties.'
    ]}
  ];
}

function buildClauses(type, data) {
  if (type === 'client') return clientClauses(data);
  if (type === 'member-contractor') return contractorClauses(data);
  if (type === 'member-employee') return employeeClauses(data);
  throw new Error(`Unknown contract type: ${type}`);
}

// Party labels per contract type.
function partyLabels(type) {
  if (type === 'client') {
    return { a: 'Service Provider', b: 'Client' };
  }
  if (type === 'member-contractor') {
    return { a: 'Company', b: 'Contractor' };
  }
  return { a: 'Company', b: 'Employee' };
}

// ---------------------------------------------------------------------------
// PDF rendering
// ---------------------------------------------------------------------------
const GREEN = '#0a6b4f';
const DARK = '#13231b';
const MUTED = '#5f7a68';
const LOGO = '#1d9e75'; // brand emerald — the Seed of Life mark, in colour

/**
 * Draw the Syntrix "Seed of Life" mark: a centre circle plus six circles whose
 * centres sit one radius away at 60° steps — the exact geometry used on the
 * site's loader (BrandLoader.tsx). `r` is the circle radius in PDF points.
 */
function drawSeedOfLife(doc, cx, cy, r, color = LOGO) {
  const centers = [[0, 0]];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    centers.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  doc.save().lineWidth(0.9).strokeColor(color).strokeOpacity(0.9);
  centers.forEach(([dx, dy]) => doc.circle(cx + dx, cy + dy, r).stroke());
  doc.restore();
}

function renderPdf(type, data, outPath) {
  return new Promise((resolve, reject) => {
    const meta = TYPE_META[type];
    const labels = partyLabels(type);
    const doc = new PDFDocument({ size: 'A4', margin: 56, bufferPages: true });
    const out = fs.createWriteStream(outPath);
    out.on('finish', () => resolve(outPath));
    out.on('error', reject);
    doc.on('error', reject);
    doc.pipe(out);

    const counterpartyName = fallback(data.name, 'the Counterparty');
    const counterpartyEmail = fallback(data.email, '');

    // --- Header band: centered Seed of Life mark + wordmark + sweep line ---
    const pageCenter = (doc.page.margins.left + (doc.page.width - doc.page.margins.right)) / 2;
    drawSeedOfLife(doc, pageCenter, 84, 11);
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(13)
      .text('SYNTRIX', 56, 116, { width: 483, align: 'center', characterSpacing: 5 });
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
      .text(`${COMPANY.website}  ·  ${COMPANY.email}`, 56, 136, { width: 483, align: 'center', characterSpacing: 1 });
    // Green sweep line under the wordmark.
    doc.moveTo(pageCenter - 70, 154).lineTo(pageCenter + 70, 154).strokeColor(LOGO).lineWidth(1).stroke();
    doc.y = 172;

    // --- Title ---
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(18).text(meta.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`Dated: ${today()}`, { align: 'center' });
    doc.moveDown(1.2);

    // --- Parties ---
    doc.fillColor(DARK).font('Helvetica').fontSize(10.5);
    doc.text(`This Agreement is made on ${today()} between:`);
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').text(`${COMPANY.name}`, { continued: true })
       .font('Helvetica').text(`, a company organised under the laws of ${COMPANY.country}, having its principal place of business in ${COMPANY.city}, ${COMPANY.country} (the "${labels.a}");`);
    doc.moveDown(0.4);
    doc.text('and');
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').text(`${counterpartyName}`, { continued: true })
       .font('Helvetica').text(`${counterpartyEmail ? ` (${counterpartyEmail})` : ''} (the "${labels.b}").`);
    doc.moveDown(0.4);
    doc.fillColor(MUTED).fontSize(9).text(`The ${labels.a} and the ${labels.b} are together the "Parties". The "Effective Date" is the date of last signature below.`);
    doc.moveDown(1);

    // --- Clauses ---
    const clauses = buildClauses(type, data);
    clauses.forEach((clause, idx) => {
      // keep heading with at least the first line
      if (doc.y > 720) doc.addPage();
      doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11).text(`${idx + 1}. ${clause.heading}`);
      doc.moveDown(0.25);
      clause.body.forEach((para) => {
        doc.fillColor(DARK).font('Helvetica').fontSize(10).text(para, { align: 'justify', lineGap: 1.5 });
        doc.moveDown(0.4);
      });
      doc.moveDown(0.4);
    });

    // --- Signature block ---
    if (doc.y > 620) doc.addPage();
    doc.moveDown(1);
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11).text('IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.');
    doc.moveDown(1.6);

    const colY = doc.y;
    const leftX = 56;
    const rightX = 310;
    const sigLine = (x, y) => {
      doc.moveTo(x, y).lineTo(x + 200, y).strokeColor('#9fb6a6').lineWidth(1).stroke();
    };
    // Party A
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`For the ${labels.a}`, leftX, colY);
    sigLine(leftX, colY + 46);
    doc.fillColor(DARK).fontSize(10).text(COMPANY.name, leftX, colY + 52);
    doc.fillColor(MUTED).fontSize(9).text('Name: __________________________', leftX, colY + 70);
    doc.text('Date: ___________________________', leftX, colY + 86);
    // Party B
    doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`For the ${labels.b}`, rightX, colY);
    sigLine(rightX, colY + 46);
    doc.fillColor(DARK).fontSize(10).text(counterpartyName, rightX, colY + 52);
    doc.fillColor(MUTED).fontSize(9).text('Name: __________________________', rightX, colY + 70);
    doc.text('Date: ___________________________', rightX, colY + 86);

    // --- Footer disclaimer on every page ---
    // Zero the bottom margin while stamping so pdfkit doesn't auto-paginate the
    // absolutely-positioned footer text (it sits below the normal content area).
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const savedBottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.fillColor(MUTED).font('Helvetica').fontSize(7)
        .text(LEGAL_DISCLAIMER, 56, doc.page.height - 52, { width: 483, align: 'center', lineBreak: true });
      doc.fillColor(MUTED).fontSize(7)
        .text(`Page ${i - range.start + 1} of ${range.count}`, 56, doc.page.height - 24, { width: 483, align: 'center' });
      doc.page.margins.bottom = savedBottom;
    }

    doc.end();
  });
}

/**
 * Generate a contract PDF.
 *
 * @param {Object} args
 * @param {'client'|'member-contractor'|'member-employee'} args.type
 * @param {Object} args.data - { name, email, role, scope, fee, currency, paymentTerms, timeline, probation, notice }
 * @param {string} args.outDir - directory to write the PDF into
 * @returns {Promise<{ filePath, fileName, type, title }>}
 */
async function generateContract({ type, data = {}, outDir }) {
  if (!CONTRACT_TYPES.includes(type)) {
    throw new Error(`Invalid contract type "${type}". Expected one of: ${CONTRACT_TYPES.join(', ')}`);
  }
  if (!outDir) throw new Error('outDir is required');
  fs.mkdirSync(outDir, { recursive: true });

  const safeName = fallback(data.name, 'counterparty').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 40);
  const fileName = `${type}-${safeName}-${Date.now()}.pdf`;
  const filePath = path.join(outDir, fileName);

  await renderPdf(type, data, filePath);

  return { filePath, fileName, type, title: TYPE_META[type].title };
}

module.exports = {
  generateContract,
  CONTRACT_TYPES,
  TYPE_META,
  COMPANY,
  LEGAL_DISCLAIMER
};
