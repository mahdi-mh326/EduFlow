import { randomInt } from "node:crypto";

export const generateTemporaryPassword = () => {
  const upper   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower   = "abcdefghijklmnopqrstuvwxyz";
  const digits  = "0123456789";
  const special = "@#$%&*!";
  const all     = upper + lower + digits + special;

  const pick = (chars) => chars[randomInt(chars.length)];

  const required = [
    pick(upper),
    pick(lower),
    pick(digits),
    pick(special),
  ];

  const rest = Array.from({ length: 8 }, () => pick(all));

  // Cryptographically secure Fisher-Yates shuffle
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};
