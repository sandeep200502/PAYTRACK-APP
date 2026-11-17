// Realistic Indian small-business sample data.
// Dates are generated relative to the day the demo is first opened, so the
// dashboard always shows a believable mix of Paid / Pending / Partially Paid /
// Overdue / Draft invoices no matter which day you present.

import { addDays, todayISO } from '../utils/format.js';

export const SEED_CUSTOMERS = [
  { id: 'cus_abc', name: 'ABC Traders', contactPerson: 'Arjun Balan', email: 'accounts@abctraders.in', phone: '98401 23456', city: 'Chennai', gstin: '33AABCA1234F1Z2' },
  { id: 'cus_ce', name: 'Chennai Electronics', contactPerson: 'Priya Raman', email: 'billing@chennaielectronics.in', phone: '94440 56789', city: 'Chennai', gstin: '33AACCC5678G1Z9' },
  { id: 'cus_ka', name: 'Kumar Agencies', contactPerson: 'Senthil Kumar', email: 'kumaragencies@gmail.com', phone: '98841 34567', city: 'Tambaram', gstin: '33AAKFK4321H1Z1' },
  { id: 'cus_sls', name: 'Sri Lakshmi Stores', contactPerson: 'Lakshmi Narayanan', email: 'srilakshmistores@yahoo.in', phone: '90030 45678', city: 'Mylapore', gstin: '' },
  { id: 'cus_tz', name: 'TechZone Solutions', contactPerson: 'Karthik Iyer', email: 'finance@techzone.co.in', phone: '99620 78901', city: 'Guindy', gstin: '33AAGCT9876J1Z4' },
  { id: 'cus_gm', name: 'GreenMart', contactPerson: 'Meena Sundar', email: 'purchase@greenmart.in', phone: '97910 11223', city: 'Velachery', gstin: '33AAHCG2468K1Z7' },
  { id: 'cus_ravi', name: 'Ravi Enterprises', contactPerson: 'Ravi Shankar', email: 'ravienterprises@gmail.com', phone: '98410 99887', city: 'Ambattur', gstin: '33AAQPR1357L1Z3' },
  { id: 'cus_xyz', name: 'XYZ Stores', contactPerson: 'Farhan Ali', email: 'xyzstores.chennai@gmail.com', phone: '93805 44332', city: 'Anna Nagar', gstin: '' },
  { id: 'cus_mt', name: 'Madurai Textiles', contactPerson: 'Muthu Pandian', email: 'accounts@maduraitextiles.com', phone: '94432 66778', city: 'Madurai', gstin: '33AAFCM8642M1Z6' },
  { id: 'cus_cm', name: 'Coimbatore Motors', contactPerson: 'Deepa Venkatesh', email: 'service@coimbatoremotors.in', phone: '98430 22110', city: 'Coimbatore', gstin: '33AABCC7531N1Z8' },
  { id: 'cus_ab', name: 'Anand Bakery', contactPerson: 'Anand Raj', email: 'anandbakery.adyar@gmail.com', phone: '91766 55443', city: 'Adyar', gstin: '' },
  { id: 'cus_vh', name: 'Velu Hardware', contactPerson: 'Velmurugan S', email: 'veluhardware@gmail.com', phone: '97899 88776', city: 'Porur', gstin: '33AAVPV9753P1Z0' },
];

// [customerId, issueOffset, dueOffset, items[[desc, qty, price]], discount, taxRate, isDraft, payments[[offset, amount|'full', method, ref]]]
const INVOICE_PLAN = [
  ['cus_ce', -175, -160, [['32" LED display panels', 4, 6500]], 0, 18, false, [[-162, 'full', 'Bank Transfer', 'NEFT-HDFC-448120']]],
  ['cus_ka', -140, -125, [['Office stationery – quarterly supply', 1, 15000], ['Printer cartridges (HP 88A)', 6, 850]], 0, 18, false, [[-120, 'full', 'UPI', 'UPI-409812345671']]],
  ['cus_sls', -122, -107, [['POS billing software setup', 1, 22000]], 0, 18, false, [[-108, 'full', 'Card', 'CARD-XX4821']]],
  ['cus_tz', -100, -85, [['Website maintenance (3 months)', 3, 12000]], 2000, 18, false, [[-86, 'full', 'Bank Transfer', 'IMPS-ICICI-772910']]],
  ['cus_gm', -88, -73, [['Printed carry bags (bundle of 100)', 20, 600]], 0, 18, false, [[-74, 'full', 'UPI', 'UPI-411298765432']]],
  ['cus_ravi', -80, -65, [['Electrical wiring – shop floor', 1, 8000]], 0, 18, false, []],
  ['cus_abc', -75, -60, [['Sona Masoori rice (25 kg bag)', 40, 1450]], 0, 5, false, [[-61, 'full', 'Bank Transfer', 'NEFT-SBI-118834']]],
  ['cus_ravi', -62, -47, [['LED tube lights 20W', 50, 420], ['MCB switches 32A', 20, 380]], 0, 18, false, [[-44, 'full', 'Cash', '']]],
  ['cus_mt', -50, -35, [['Cotton fabric rolls', 8, 1500]], 0, 18, false, []],
  ['cus_mt', -46, -31, [['Tailoring & finishing charges', 1, 24000]], 0, 18, false, [[-30, 'full', 'Bank Transfer', 'RTGS-CANB-220913']]],
  ['cus_cm', -40, -25, [['Annual vehicle servicing contract', 1, 36000]], 0, 18, false, [[-26, 'full', 'Bank Transfer', 'NEFT-AXIS-556201']]],
  ['cus_ce', -32, -17, [['CCTV camera with installation', 6, 3000]], 0, 18, false, [[-14, 'full', 'UPI', 'UPI-424567890123']]],
  ['cus_abc', -27, -12, [['Toor dal (50 kg bag)', 10, 2500]], 0, 18, false, [[-18, 11500, 'UPI', 'UPI-426601234598']]],
  ['cus_ka', -26, -11, [['Ergonomic office chairs', 8, 3000]], 0, 18, false, [[-9, 'full', 'Bank Transfer', 'NEFT-KVB-903311']]],
  ['cus_xyz', -22, -7, [['Snack & beverage stock', 1, 10000]], 0, 18, false, [[-15, 3300, 'Cash', '']]],
  ['cus_sls', -20, -5, [['Barcode scanners', 4, 4000]], 0, 18, false, [[-4, 'full', 'UPI', 'UPI-427788990011']]],
  ['cus_ab', -18, -3, [['Commercial oven servicing', 1, 6500]], 0, 18, false, []],
  ['cus_tz', -10, 4, [['Cloud hosting – annual plan', 1, 25000], ['Website redesign', 1, 15000]], 2000, 18, false, []],
  ['cus_gm', -9, 6, [['Cold storage rack', 3, 6000]], 0, 18, false, [[-2, 8000, 'UPI', 'UPI-428811223344']]],
  ['cus_ce', -6, 9, [['Laptop – Dell Vostro 3520', 1, 30000]], 0, 18, false, []],
  ['cus_vh', -5, 2, [['Power tools rental (1 week)', 1, 6000]], 0, 18, false, []],
  ['cus_sls', -4, 12, [['Steel shelving units', 2, 5500]], 0, 18, false, []],
  ['cus_cm', -3, 18, [['Fleet GPS trackers', 10, 5000]], 0, 18, false, []],
  ['cus_ka', -2, 1, [['Courier charges – monthly', 1, 4200]], 0, 18, false, []],
  ['cus_ab', -1, 14, [['Glass display counter', 1, 18000]], 0, 18, true, []],
  ['cus_vh', 0, 15, [['Wall paint (20 L bucket)', 30, 450]], 0, 18, true, []],
];

const r2 = (n) => Math.round(n * 100) / 100;

export function buildSeed(today = todayISO()) {
  const invoices = [];
  const payments = [];
  let payNo = 5001;

  INVOICE_PLAN.forEach(([customerId, issue, due, items, discount, taxRate, isDraft, pays], idx) => {
    const id = `inv_${idx + 1}`;
    const cust = SEED_CUSTOMERS.find((c) => c.id === customerId);
    const invoice = {
      id,
      number: `INV-${1001 + idx}`,
      customerId,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      issueDate: addDays(today, issue),
      dueDate: addDays(today, due),
      items: items.map(([description, quantity, unitPrice], j) => ({ id: `${id}_it${j}`, description, quantity, unitPrice })),
      discountType: 'flat',
      discountValue: discount,
      taxRate,
      notes: 'Thank you for your business. Please pay by the due date.',
      isDraft,
      createdAt: addDays(today, issue),
    };
    invoices.push(invoice);

    const subtotal = items.reduce((s, [, q, p]) => s + q * p, 0);
    const total = r2((subtotal - discount) * (1 + taxRate / 100));
    pays.forEach(([offset, amount, method, reference]) => {
      payments.push({
        id: `pay_${payNo}`,
        number: `PAY-${payNo}`,
        invoiceId: id,
        amount: amount === 'full' ? total : amount,
        method,
        date: addDays(today, offset),
        reference,
        note: '',
        createdAt: addDays(today, offset),
      });
      payNo += 1;
    });
  });

  const reminders = [
    { id: 'rem_1', invoiceId: 'inv_6', channel: 'Email', tone: 'firm', date: addDays(today, -20) },
    { id: 'rem_2', invoiceId: 'inv_9', channel: 'WhatsApp', tone: 'firm', date: addDays(today, -8) },
    { id: 'rem_3', invoiceId: 'inv_13', channel: 'WhatsApp', tone: 'friendly', date: addDays(today, -5) },
  ];

  const settings = {
    name: 'Sandeep Distributors',
    ownerName: 'Sandeep Kumar',
    email: 'accounts@sandeepdistributors.in',
    phone: '98400 11223',
    address: 'No. 14, Usman Road, T. Nagar, Chennai 600017',
    gstin: '33ABCPS1234K1Z5',
    upiId: 'sandeepdist@okhdfc',
    invoicePrefix: 'INV-',
    defaultTaxRate: 18,
    defaultDueDays: 15,
  };

  return {
    customers: SEED_CUSTOMERS.map((c) => ({ ...c, createdAt: addDays(today, -180) })),
    invoices,
    payments,
    reminders,
    settings,
    meta: { seededOn: today, version: 1 },
  };
}
