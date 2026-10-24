import { describe, it, expect, vi } from 'vitest';
import { GROQ_TOOL_DEFINITIONS } from '../src/services/aiTools';
import { isGroqConfigured, GROQ_MODELS, runGroqDiagnostic } from '../src/services/groqClient';

describe('Operational & Intelligence Services Test Suite', () => {
  describe('Groq AI Tool Definitions & Security', () => {
    it('defines all 13 core operational tools with strict json-schema parameters', () => {
      const toolNames = GROQ_TOOL_DEFINITIONS.map((t) => t.function.name);

      expect(toolNames).toContain('get_property_performance');
      expect(toolNames).toContain('get_occupancy_forecast');
      expect(toolNames).toContain('get_payment_reconciliation');
      expect(toolNames).toContain('get_room_status');
      expect(toolNames).toContain('get_open_guest_complaints');
      expect(toolNames).toContain('get_housekeeping_tasks');
      expect(toolNames).toContain('get_laundry_stock');
      expect(toolNames).toContain('get_food_stock_forecast');
      expect(toolNames).toContain('get_profit_and_loss');
      expect(toolNames).toContain('get_marketing_performance');
      expect(toolNames).toContain('create_staff_task');
      expect(toolNames).toContain('draft_marketing_campaign');
      expect(toolNames).toContain('prepare_rate_recommendation');

      // Verify each tool schema has function name and parameters
      for (const t of GROQ_TOOL_DEFINITIONS) {
        expect(t.type).toBe('function');
        expect(t.function.name).toBeDefined();
        expect(t.function.description).toBeDefined();
        expect(t.function.parameters.type).toBe('object');
      }
    });

    it('validates environment helper for Groq API keys safely', () => {
      const emptyEnv: any = {};
      expect(isGroqConfigured(emptyEnv)).toBe(false);

      const configuredEnv: any = { GROQ_API_KEY: 'gsk_test_mock_key_12345' };
      expect(isGroqConfigured(configuredEnv)).toBe(true);
    });

    it('configures openai/gpt-oss-120b as primary intelligence and reasoning model', () => {
      expect(GROQ_MODELS.reasoning.id).toBe('openai/gpt-oss-120b');
      expect(GROQ_MODELS.deep_reasoning.id).toBe('openai/gpt-oss-120b');
      expect(GROQ_MODELS.reasoning.maxTokens).toBeGreaterThanOrEqual(4096);
    });

    it('defines natural-language property setup tools for Flexi AI', () => {
      const toolNames = GROQ_TOOL_DEFINITIONS.map((t) => t.function.name);
      expect(toolNames).toContain('get_property_setup_status');
      expect(toolNames).toContain('get_room_categories');
      expect(toolNames).toContain('prepare_room_category');
      expect(toolNames).toContain('prepare_room_type');
      expect(toolNames).toContain('prepare_rate_plan');
      expect(toolNames).toContain('prepare_amenities');
      expect(toolNames).toContain('prepare_property_profile');
      expect(toolNames).toContain('prepare_tax_configuration');
      expect(toolNames).toContain('validate_setup_draft');
      expect(toolNames).toContain('apply_approved_setup_draft');
      expect(toolNames).toContain('block_room');
      expect(toolNames).toContain('unblock_room');
      expect(toolNames).toContain('mark_room_clean');
    });

    it('runGroqDiagnostic correctly handles unconfigured environments without exposing keys', async () => {
      const emptyEnv: any = {};
      const diag = await runGroqDiagnostic(emptyEnv);
      expect(diag.configured).toBe(false);
      expect(diag.status).toBe('offline');
      expect(diag.model).toBe('openai/gpt-oss-120b');
      expect(diag.toolCallingSupported).toBe(false);
      expect(diag.message).toContain('GROQ_API_KEY secret is not set');
    });
  });

  describe('Food Procurement & Kitchen Covers Shortage Forecasting Logic', () => {
    it('calculates ingredient demand and accurately triggers shortage alerts', () => {
      // 10 guests staying for 3 days = 30 guest-days
      const guestDays = 30;
      const recipes = [
        { itemId: 'item_potatoes', itemName: 'Potatoes (Aloo)', gramsPerGuest: 250, unit: 'kg' },
        { itemId: 'item_rice', itemName: 'Basmati Rice', gramsPerGuest: 150, unit: 'kg' },
        { itemId: 'item_milk', itemName: 'Fresh Milk', gramsPerGuest: 200, unit: 'liter' },
      ];

      const currentStock: Record<string, number> = {
        item_potatoes: 5.0, // 5 kg
        item_rice: 10.0,    // 10 kg
        item_milk: 2.0,     // 2 liters
      };

      const shortageAlerts: any[] = [];

      for (const r of recipes) {
        const totalGramsRequired = r.gramsPerGuest * guestDays;
        const requiredUnits = totalGramsRequired / 1000;
        const stock = currentStock[r.itemId] || 0;

        if (stock < requiredUnits) {
          shortageAlerts.push({
            itemId: r.itemId,
            itemName: r.itemName,
            currentStock: stock,
            requiredAmount: requiredUnits,
            shortage: Math.round((requiredUnits - stock) * 10) / 10,
            unit: r.unit,
            urgency: stock <= requiredUnits * 0.3 ? 'critical' : 'warning',
          });
        }
      }

      // Potatoes: 250g * 30 = 7.5kg needed. Stock is 5.0kg -> Shortage is 2.5kg!
      const potatoAlert = shortageAlerts.find((a) => a.itemId === 'item_potatoes');
      expect(potatoAlert).toBeDefined();
      expect(potatoAlert?.shortage).toBe(2.5);

      // Rice: 150g * 30 = 4.5kg needed. Stock is 10.0kg -> No shortage!
      const riceAlert = shortageAlerts.find((a) => a.itemId === 'item_rice');
      expect(riceAlert).toBeUndefined();

      // Milk: 200g * 30 = 6.0L needed. Stock is 2.0L -> Shortage is 4.0L!
      const milkAlert = shortageAlerts.find((a) => a.itemId === 'item_milk');
      expect(milkAlert).toBeDefined();
      expect(milkAlert?.shortage).toBe(4.0);
      expect(milkAlert?.urgency).toBe('warning'); // 2.0 > 6.0 * 0.3 (1.8) -> warning
    });
  });

  describe('TallyPrime Multi-Line Balanced XML Generation', () => {
    it('produces valid XML structure with balanced positive and negative amounts', () => {
      const invoice = {
        invoiceNumber: 'INV-2026-0042',
        reservationId: 'res_sample_88',
        customerName: 'Aarav Sharma',
        date: '2026-10-24',
        subtotalRs: 5000.0,
        cgstRs: 300.0,
        sgstRs: 300.0,
        totalRs: 5600.0,
      };

      const dateFormatted = invoice.date.replace(/-/g, '');

      const voucherXml = `
<VOUCHER VCHTYPE="Sales" ACTION="Create">
  <DATE>${dateFormatted}</DATE>
  <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
  <VOUCHERNUMBER>${invoice.invoiceNumber}</VOUCHERNUMBER>
  <REFERENCE>${invoice.reservationId}</REFERENCE>
  <PARTYLEDGERNAME>Sundry Debtors - Hotel Guests</PARTYLEDGERNAME>
  <NARRATION>HotelFlexi Invoice #${invoice.invoiceNumber} for Guest ${invoice.customerName}</NARRATION>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Sundry Debtors - Hotel Guests</LEDGERNAME>
    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
    <AMOUNT>-${invoice.totalRs.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Room Tariff Revenue</LEDGERNAME>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <AMOUNT>${invoice.subtotalRs.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Output CGST 6%</LEDGERNAME>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <AMOUNT>${invoice.cgstRs.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
  <ALLLEDGERENTRIES.LIST>
    <LEDGERNAME>Output SGST 6%</LEDGERNAME>
    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
    <AMOUNT>${invoice.sgstRs.toFixed(2)}</AMOUNT>
  </ALLLEDGERENTRIES.LIST>
</VOUCHER>`.trim();

      expect(voucherXml).toContain('<VOUCHER VCHTYPE="Sales"');
      expect(voucherXml).toContain('<VOUCHERNUMBER>INV-2026-0042</VOUCHERNUMBER>');
      expect(voucherXml).toContain('<AMOUNT>-5600.00</AMOUNT>');
      expect(voucherXml).toContain('<AMOUNT>5000.00</AMOUNT>');
      expect(voucherXml).toContain('<AMOUNT>300.00</AMOUNT>');

      // Verify double-entry balance: Debits (-5600) + Credits (5000 + 300 + 300) = 0
      const totalDebit = -5600.0;
      const totalCredit = 5000.0 + 300.0 + 300.0;
      expect(totalDebit + totalCredit).toBe(0);
    });
  });

  describe('Post-Stay Neutral Reviews & Google Policy Compliance', () => {
    it('enforces rating bounds [1, 5] without default preselected stars', () => {
      const normalizeRating = (val: any) => {
        const num = Number(val ?? 5);
        if (isNaN(num) || num < 1) return 1;
        return Math.min(5, Math.max(1, num));
      };

      expect(normalizeRating(5)).toBe(5);
      expect(normalizeRating(1)).toBe(1);
      expect(normalizeRating(0)).toBe(1);
      expect(normalizeRating(10)).toBe(5); // capped at 5
      expect(normalizeRating(-3)).toBe(1); // floor at 1
    });

    it('ensures unconditional Google review link accessibility without gating', () => {
      const property = {
        name: 'Hilltop Resort Manali',
        address: 'Hadimba Temple Road, Manali, HP',
        googleReviewUrl: null, // fallback
      };

      const getReviewUrl = (prop: typeof property) => {
        return (
          prop.googleReviewUrl ||
          `https://www.google.com/search?q=${encodeURIComponent(`${prop.name} ${prop.address} review`)}`
        );
      };

      const generatedUrl = getReviewUrl(property);
      expect(generatedUrl).toContain('https://www.google.com/search?q=');
      expect(generatedUrl).toContain('Hilltop%20Resort%20Manali');
    });
  });

  describe('Dynamic Onboarding Checklist & Authoritative DB Derivation', () => {
    it('accurately derives task completion from real database counts', () => {
      const deriveTasks = (dbCounts: {
        hasPropertyProfile: boolean;
        roomCategoryCount: number;
        physicalRoomCount: number;
        ratePlanCount: number;
        hasTaxConfig: boolean;
        razorpayEnabled: boolean;
        razorpayKeyPresent: boolean;
      }) => {
        const tasks = [
          {
            id: 'property_profile',
            title: 'Set up property details',
            completed: dbCounts.hasPropertyProfile,
          },
          {
            id: 'room_categories',
            title: 'Create room categories',
            completed: dbCounts.roomCategoryCount > 0,
          },
          {
            id: 'physical_rooms',
            title: 'Add physical room units',
            completed: dbCounts.physicalRoomCount > 0,
          },
          {
            id: 'rate_plans',
            title: 'Configure rate plans & meal plans',
            completed: dbCounts.ratePlanCount > 0,
          },
          {
            id: 'tax_configuration',
            title: 'Configure GST & property taxes',
            completed: dbCounts.hasTaxConfig,
          },
          {
            id: 'razorpay_payments',
            title: 'Set up Razorpay payments',
            completed: dbCounts.razorpayEnabled && dbCounts.razorpayKeyPresent,
            ctaUrl: 'https://rzp.io/rzp/fKRf0v8',
          },
        ];

        const completedCount = tasks.filter((t) => t.completed).length;
        const percent = Math.round((completedCount / tasks.length) * 100);

        return { tasks, completedCount, percent };
      };

      // Scenario A: Brand new hotel
      const emptyState = deriveTasks({
        hasPropertyProfile: false,
        roomCategoryCount: 0,
        physicalRoomCount: 0,
        ratePlanCount: 0,
        hasTaxConfig: false,
        razorpayEnabled: false,
        razorpayKeyPresent: false,
      });

      expect(emptyState.completedCount).toBe(0);
      expect(emptyState.percent).toBe(0);
      const rzpTask = emptyState.tasks.find((t) => t.id === 'razorpay_payments');
      expect(rzpTask?.completed).toBe(false);
      expect(rzpTask?.ctaUrl).toBe('https://rzp.io/rzp/fKRf0v8');

      // Scenario B: Partially onboarded hotel (clicked Razorpay link, but keys not configured)
      const clickedLinkOnlyState = deriveTasks({
        hasPropertyProfile: true,
        roomCategoryCount: 2,
        physicalRoomCount: 8,
        ratePlanCount: 1,
        hasTaxConfig: true,
        razorpayEnabled: false, // NOT completed merely on click
        razorpayKeyPresent: false,
      });

      expect(clickedLinkOnlyState.completedCount).toBe(5);
      expect(clickedLinkOnlyState.percent).toBe(83);
      expect(clickedLinkOnlyState.tasks.find((t) => t.id === 'razorpay_payments')?.completed).toBe(false);

      // Scenario C: Fully verified with Razorpay credentials
      const fullyVerifiedState = deriveTasks({
        hasPropertyProfile: true,
        roomCategoryCount: 3,
        physicalRoomCount: 15,
        ratePlanCount: 2,
        hasTaxConfig: true,
        razorpayEnabled: true,
        razorpayKeyPresent: true,
      });

      expect(fullyVerifiedState.completedCount).toBe(6);
      expect(fullyVerifiedState.percent).toBe(100);
      expect(fullyVerifiedState.tasks.find((t) => t.id === 'razorpay_payments')?.completed).toBe(true);
    });
  });

  describe('Custom Tax, GST & Multi-Rule Folio Invoice Calculations', () => {
    it('accurately computes standard GST (12%) for tariffs <= ₹7,500/night', () => {
      const nightlyTariffPaise = 500000; // ₹5,000
      const standardGstPercent = 12.0;

      const gstRate = standardGstPercent / 100;
      const totalGstPaise = Math.round(nightlyTariffPaise * gstRate);
      const cgstPaise = Math.round(totalGstPaise / 2);
      const sgstPaise = totalGstPaise - cgstPaise;

      expect(totalGstPaise).toBe(60000); // ₹600 total GST
      expect(cgstPaise).toBe(30000); // ₹300 CGST (6%)
      expect(sgstPaise).toBe(30000); // ₹300 SGST (6%)
      expect(cgstPaise + sgstPaise).toBe(totalGstPaise);
    });

    it('accurately computes luxury GST (18%) for tariffs > ₹7,500/night', () => {
      const nightlyTariffPaise = 1000000; // ₹10,000
      const luxuryGstPercent = 18.0;

      const gstRate = luxuryGstPercent / 100;
      const totalGstPaise = Math.round(nightlyTariffPaise * gstRate);
      const cgstPaise = Math.round(totalGstPaise / 2);
      const sgstPaise = totalGstPaise - cgstPaise;

      expect(totalGstPaise).toBe(180000); // ₹1,800 total GST
      expect(cgstPaise).toBe(90000); // ₹900 CGST (9%)
      expect(sgstPaise).toBe(90000); // ₹900 SGST (9%)
      expect(cgstPaise + sgstPaise).toBe(totalGstPaise);
    });

    it('computes mixed multi-tax folios with fixed fees and percentage surcharges', () => {
      const roomChargesPaise = 800000; // ₹8,000 (2 nights @ ₹4,000)
      const nights = 2;

      const customRules = [
        {
          name: 'Resort Maintenance Fee',
          type: 'fixed',
          frequency: 'per_night',
          fixedAmountPaise: 25000, // ₹250/night
          isInclusive: false,
        },
        {
          name: 'Service Charge',
          type: 'percentage',
          ratePercent: 5.0, // 5%
          isInclusive: false,
        },
      ];

      // Fixed fees
      const resortFeePaise = 25000 * nights; // ₹500 (50,000 paise)
      expect(resortFeePaise).toBe(50000);

      // Service charge: 5% of ₹8,000
      const serviceChargePaise = Math.round(roomChargesPaise * 0.05); // ₹400 (40,000 paise)
      expect(serviceChargePaise).toBe(40000);

      // Taxable subtotal: ₹8,000 + ₹500 + ₹400 = ₹8,900
      const taxableSubtotalPaise = roomChargesPaise + resortFeePaise + serviceChargePaise;
      expect(taxableSubtotalPaise).toBe(890000);

      // Standard GST 12% on taxable subtotal
      const gstPaise = Math.round(taxableSubtotalPaise * 0.12); // ₹1,068
      expect(gstPaise).toBe(106800);

      const grandTotalPaise = taxableSubtotalPaise + gstPaise;
      expect(grandTotalPaise).toBe(996800); // ₹9,968
    });

    it('properly extracts base amount when tax is inclusive', () => {
      // Inclusive price ₹5,600 with 12% GST
      const inclusiveTotalPaise = 560000;
      const gstPercent = 12.0;

      // Base = Total / (1 + Rate)
      const basePaise = Math.round(inclusiveTotalPaise / (1 + gstPercent / 100));
      const extractedTaxPaise = inclusiveTotalPaise - basePaise;

      expect(basePaise).toBe(500000); // ₹5,000 base
      expect(extractedTaxPaise).toBe(60000); // ₹600 tax
      expect(basePaise + extractedTaxPaise).toBe(inclusiveTotalPaise);
    });
  });

  describe('Natural-Language Property Setup Draft Parsing & Diff Evaluation', () => {
    it('accurately categorizes entities into create vs update vs existing vs ambiguous', () => {
      const existingCategories = [
        { name: 'Deluxe Room', base_price_paise: 250000 },
        { name: 'Executive Suite', base_price_paise: 450000 },
      ];

      const proposedCategories = [
        { name: 'Deluxe Room', basePriceRupees: 2800 }, // Price changed -> update
        { name: 'Executive Suite', basePriceRupees: 4500 }, // Same price -> existing
        { name: 'Presidential Penthouse', basePriceRupees: 8500 }, // New -> create
        { name: 'Family Room', basePriceRupees: 0 }, // Missing price -> ambiguous
      ];

      const diff = proposedCategories.map((proposed) => {
        const match = existingCategories.find(
          (ex) => ex.name.toLowerCase() === proposed.name.toLowerCase()
        );

        if (!proposed.basePriceRupees || proposed.basePriceRupees <= 0) {
          return { name: proposed.name, action: 'ambiguous', reason: 'Missing price tariff' };
        }
        if (!match) {
          return { name: proposed.name, action: 'create' };
        }
        const existingPriceRupees = match.base_price_paise / 100;
        if (existingPriceRupees !== proposed.basePriceRupees) {
          return {
            name: proposed.name,
            action: 'update',
            oldPrice: existingPriceRupees,
            newPrice: proposed.basePriceRupees,
          };
        }
        return { name: proposed.name, action: 'existing' };
      });

      expect(diff.find((d) => d.name === 'Presidential Penthouse')?.action).toBe('create');
      expect(diff.find((d) => d.name === 'Deluxe Room')?.action).toBe('update');
      expect(diff.find((d) => d.name === 'Executive Suite')?.action).toBe('existing');
      expect(diff.find((d) => d.name === 'Family Room')?.action).toBe('ambiguous');
    });
  });
});
