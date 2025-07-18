// Test data to demonstrate itemized invoice functionality
export const createTestItemizedData = () => {
  const testData = [
    {
      id: 1001,
      company: "Sapience Agribusiness Consulting LLP",
      particulars: "Sales Invoice INV-2025-001 - Items: Organic Fertilizer NPK 10:26:26 50 kg @₹1200; Neem Oil Pesticide 25 ltr @₹800; Vermicompost Premium 100 kg @₹450",
      transactionDate: "2025-04-15T00:00:00.000Z",
      voucherNumber: "INV-2025-001",
      voucherType: "Sales Invoice",
      debitAmount: "197532.00",
      creditAmount: "0.00",
      netAmount: "197532.00",
      category: "sales",
      aiConfidence: 95,
      invoiceItems: [
        {
          itemCode: "FERT-NPK-001",
          description: "Organic Fertilizer NPK 10:26:26",
          quantity: 50,
          unit: "kg",
          rate: 1200.00,
          amount: 60000.00,
          gstRate: 18,
          gstAmount: 10800.00,
          hsnCode: "31051000"
        },
        {
          itemCode: "PEST-NEEM-002",
          description: "Neem Oil Pesticide",
          quantity: 25,
          unit: "ltr",
          rate: 800.00,
          amount: 20000.00,
          gstRate: 18,
          gstAmount: 3600.00,
          hsnCode: "38089390"
        },
        {
          itemCode: "COMP-VERM-003",
          description: "Vermicompost Premium",
          quantity: 100,
          unit: "kg",
          rate: 450.00,
          amount: 45000.00,
          gstRate: 5,
          gstAmount: 2250.00,
          hsnCode: "31010000"
        }
      ],
      isItemized: true
    },
    {
      id: 1002,
      company: "Bengal Animal Health & Nutrition Solutions",
      particulars: "Sales Invoice INV-2025-002 - Items: Cattle Feed Premium 200 kg @₹650; Mineral Mixture 50 kg @₹1200; Calcium Supplement 25 kg @₹900",
      transactionDate: "2025-04-18T00:00:00.000Z",
      voucherNumber: "INV-2025-002",
      voucherType: "Sales Invoice",
      debitAmount: "233750.00",
      creditAmount: "0.00",
      netAmount: "233750.00",
      category: "sales",
      aiConfidence: 95,
      invoiceItems: [
        {
          itemCode: "FEED-CATT-001",
          description: "Cattle Feed Premium",
          quantity: 200,
          unit: "kg",
          rate: 650.00,
          amount: 130000.00,
          gstRate: 5,
          gstAmount: 6500.00,
          hsnCode: "23099090"
        },
        {
          itemCode: "MINR-MIX-002",
          description: "Mineral Mixture",
          quantity: 50,
          unit: "kg",
          rate: 1200.00,
          amount: 60000.00,
          gstRate: 18,
          gstAmount: 10800.00,
          hsnCode: "23091000"
        },
        {
          itemCode: "CALC-SUPP-003",
          description: "Calcium Supplement",
          quantity: 25,
          unit: "kg",
          rate: 900.00,
          amount: 22500.00,
          gstRate: 18,
          gstAmount: 4050.00,
          hsnCode: "23091000"
        }
      ],
      isItemized: true
    },
    {
      id: 1003,
      company: "Raavy Distributors",
      particulars: "Sales Invoice INV-2025-003 - Items: Drip Irrigation Kit 10 sets @₹3500; Sprinkler System 5 sets @₹2800; Garden Hose 50 meter @₹120",
      transactionDate: "2025-04-20T00:00:00.000Z",
      voucherNumber: "INV-2025-003",
      voucherType: "Sales Invoice",
      debitAmount: "84260.00",
      creditAmount: "0.00",
      netAmount: "84260.00",
      category: "sales",
      aiConfidence: 95,
      invoiceItems: [
        {
          itemCode: "IRRIG-DRIP-001",
          description: "Drip Irrigation Kit",
          quantity: 10,
          unit: "sets",
          rate: 3500.00,
          amount: 35000.00,
          gstRate: 18,
          gstAmount: 6300.00,
          hsnCode: "84242000"
        },
        {
          itemCode: "IRRIG-SPRK-002",
          description: "Sprinkler System",
          quantity: 5,
          unit: "sets",
          rate: 2800.00,
          amount: 14000.00,
          gstRate: 18,
          gstAmount: 2520.00,
          hsnCode: "84242000"
        },
        {
          itemCode: "HOSE-GARD-003",
          description: "Garden Hose",
          quantity: 50,
          unit: "meter",
          rate: 120.00,
          amount: 6000.00,
          gstRate: 18,
          gstAmount: 1080.00,
          hsnCode: "39173900"
        }
      ],
      isItemized: true
    }
  ];

  return testData;
};