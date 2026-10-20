import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageIntent } from '../src/routes/aiAgent';

describe('AI Business Assistant - Natural Language Understanding', () => {
  const mockContext = {
    roomTypes: [
      { id: 'rt_cottage', name: 'Cottage', code: 'CTG', base_occupancy: 2, base_price_paise: 250000, extra_adult_price_paise: 100000 },
      { id: 'rt_deluxe', name: 'Deluxe Room', code: 'DLX', base_occupancy: 2, base_price_paise: 350000, extra_adult_price_paise: 120000 },
    ],
    property: {
      name: 'Shivadri Resort',
      slug: 'shivadri-resort',
    },
  };

  it('correctly parses user query: for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000', () => {
    const input = 'for cottage price for 2 people is rs. 5000 and above 2 people each one will additionally pay 3000';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('update_room_type_pricing');
    expect(parsed?.params.roomTypeName).toBe('Cottage');
    expect(parsed?.params.basePriceRupees).toBe(5000);
    expect(parsed?.params.baseOccupancy).toBe(2);
    expect(parsed?.params.extraAdultPriceRupees).toBe(3000);
  });

  it('correctly parses user query: Pending checkouts dikhao', () => {
    const input = 'Pending checkouts dikhao';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('find_checkouts');
    expect(parsed?.params.pendingOnly).toBe(true);
  });

  it('correctly parses user query: Saare rooms unblock kar do', () => {
    const input = 'Saare rooms unblock kar do';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('unblock_room');
    expect(parsed?.params.all).toBe(true);
  });

  it('correctly parses user query: unblock all rooms', () => {
    const input = 'unblock all rooms';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('unblock_room');
    expect(parsed?.params.all).toBe(true);
  });

  it('correctly parses single room unblocking: unblock room 101', () => {
    const input = 'unblock room 101';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('unblock_room');
    expect(parsed?.params.roomNumbers).toContain('101');
  });

  it('correctly parses in-house guest inquiry: in-house guests dikhao', () => {
    const input = 'in-house guests dikhao';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('get_inhouse_guests');
  });

  it('correctly parses vacant rooms inquiry: kitne kamre khali hain', () => {
    const input = 'kitne kamre khali hain';
    const parsed = parseNaturalLanguageIntent(input, mockContext);

    expect(parsed).not.toBeNull();
    expect(parsed?.toolName).toBe('get_vacant_rooms');
  });
});
