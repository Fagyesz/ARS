const BACK_VOWELS = 'aáoóuú';
const FRONT_ROUNDED = 'öőüű';
const VOWELS = `${BACK_VOWELS}${FRONT_ROUNDED}eéií`;

/**
 * A name with the -tól/-től suffix ("from"), following vowel harmony: the
 * last vowel decides, except that i/í after a back vowel keeps the back form
 * ("Dóritól", "Zsolttól", "Emitől"). A final a/e lengthens as Hungarian
 * spelling requires ("Zorkától", "Bencétől").
 */
export function ablative(name: string): string {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  // harmony follows the last word only: "Nagy Emi" → "Nagy Emitől"
  const lastWord = lower.split(/\s+/).pop() ?? '';
  const vowels = [...lastWord].filter((ch) => VOWELS.includes(ch));
  const last = vowels[vowels.length - 1];

  let back: boolean;
  if (!last) back = false;
  else if (BACK_VOWELS.includes(last)) back = true;
  else if (FRONT_ROUNDED.includes(last) || last === 'e' || last === 'é') back = false;
  else back = vowels.some((ch) => BACK_VOWELS.includes(ch)); // i, í

  let stem = trimmed;
  if (lower.endsWith('a')) stem = `${trimmed.slice(0, -1)}${trimmed.endsWith('A') ? 'Á' : 'á'}`;
  else if (lower.endsWith('e')) stem = `${trimmed.slice(0, -1)}${trimmed.endsWith('E') ? 'É' : 'é'}`;

  return `${stem}${back ? 'tól' : 'től'}`;
}
