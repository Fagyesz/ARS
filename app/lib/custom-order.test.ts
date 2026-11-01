import {describe, expect, it} from 'vitest';
import {customOrderEmail, customOrderError, parseCustomOrder} from './custom-order';

const valid = {
  name: 'Kovács Anna',
  email: 'anna@example.com',
  garment: 'Farmerdzseki',
  idea: 'Tusgrafika a hátára',
};

describe('parseCustomOrder', () => {
  it('trims the values and treats missing fields as empty', () => {
    const form = new FormData();
    form.set('garment', ' Póló ');
    expect(parseCustomOrder(form)).toEqual({name: '', email: '', garment: 'Póló', idea: ''});
  });
});

describe('customOrderError', () => {
  it('accepts a complete enquiry', () => {
    expect(customOrderError(valid)).toBeNull();
  });

  it.each([
    [{...valid, name: ''}, 'neved'],
    [{...valid, email: 'nem-email'}, 'e-mail'],
    [{...valid, garment: ''}, 'ruhadarab'],
    [{...valid, idea: ''}, 'grafikát'],
  ])('rejects %j', (input, expected) => {
    expect(customOrderError(input)).toContain(expected);
  });
});

describe('customOrderEmail', () => {
  it('carries everything the owners need to answer', () => {
    const {subject, text} = customOrderEmail(valid);
    expect(subject).toContain('Kovács Anna');
    for (const value of Object.values(valid)) expect(text).toContain(value);
  });
});
