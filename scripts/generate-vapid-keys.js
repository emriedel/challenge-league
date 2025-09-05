const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated:');
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@challengeleague.com`);
console.log('');
console.log('Add this to your .env.local file:');
console.log('');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log('');
console.log('Public key for client-side use:');
console.log(vapidKeys.publicKey);