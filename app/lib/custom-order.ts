/** The enquiry form on /egyedi-rendeles: fields, validation and the e-mail to the owners. */

export type CustomOrderInput = {
  name: string;
  email: string;
  garment: string;
  idea: string;
};

export function parseCustomOrder(formData: FormData): CustomOrderInput {
  const text = (key: string) => String(formData.get(key) ?? '').trim();
  return {
    name: text('name'),
    email: text('email'),
    garment: text('garment'),
    idea: text('idea'),
  };
}

/** The first problem to show the shopper, or null when the enquiry is complete. */
export function customOrderError(input: CustomOrderInput): string | null {
  if (!input.name) return 'Add meg a neved.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return 'Adj meg egy érvényes e-mail címet, ide küldjük az ajánlatot.';
  }
  if (!input.garment) return 'Írd le, melyik ruhadarabodról van szó.';
  if (!input.idea) return 'Írd le, milyen grafikát vagy változtatást szeretnél.';
  return null;
}

export function customOrderEmail(input: CustomOrderInput): {subject: string; text: string} {
  return {
    subject: `[Egyedi rendelés] ${input.garment.slice(0, 60)} – ${input.name}`,
    text: [
      'Új egyedi rendelési megkeresés',
      '',
      `Név: ${input.name}`,
      `E-mail: ${input.email}`,
      `Ruhadarab: ${input.garment}`,
      '',
      input.idea,
    ].join('\n'),
  };
}
