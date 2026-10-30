// Erzeugt ein VAPID-Schluesselpaar fuer Web Push.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("\nVAPID-Schluessel erzeugt. In die .env eintragen:\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(
  "\nHinweis: VAPID_SUBJECT (z.B. mailto:admin@burkard3.ch) ebenfalls setzen.\n"
);
