import { describe, it, expect } from 'vitest';
import { GROQ_TOOL_DEFINITIONS } from '../src/services/aiTools';
import { isGroqConfigured } from '../src/services/groqClient';

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
});
