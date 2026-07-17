/** Shared mappers from a card fill path (e.g. "/images/flat_1.webp") to related assets. */

export function cardImageNumber(cardImage: string) {
  return cardImage.match(/flat_?(\d+)/i)?.[1] ?? "";
}

/** Confirmation email closed envelope: flat_1.webp → flat_1_closed.webp */
export function closedEnvelopeImage(cardImage: string) {
  const file = cardImage.split("/").at(-1) ?? "";
  const base = file.replace(/\.webp$/i, "");
  return `/images/${base}_closed.webp`;
}

/** "Card is ready" email art: flat_1.webp → flat1_email.jpg */
export function cardEmailImage(cardImage: string) {
  const num = cardImageNumber(cardImage);
  return `/images/flat${num}_email.jpg`;
}

/** Receive landing fall art: flat_1.webp → flat_1_post.png */
export function postFallImage(cardImage: string) {
  const num = cardImageNumber(cardImage);
  return `/images/flat_${num}_post.png`;
}
