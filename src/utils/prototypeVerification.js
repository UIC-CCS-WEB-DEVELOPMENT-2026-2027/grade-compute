const challenges = new Map();
const challengeLifetimeMs = 5 * 60 * 1000;
const maxAttempts = 5;

function maskEmail(email) {
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'unavailable';
  return `${name[0]}${'*'.repeat(Math.max(3, name.length - 1))}@${domain}`;
}

function maskPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'unavailable';
  return `${'*'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
}

export function getVerifiedMethods(account) {
  const methods = [];
  if (account.emailVerified && account.verificationMethods.email && account.email) {
    methods.push({ id: 'email', label: 'Email', masked: maskEmail(account.email) });
  }
  if (account.phoneVerified && account.verificationMethods.phone && account.phone) {
    methods.push({ id: 'phone', label: 'Phone number', masked: maskPhone(account.phone) });
  }
  return methods;
}

export function createPrototypeChallenge(method) {
  if (!['email', 'phone'].includes(method)) {
    throw new Error('Choose a supported verification method.');
  }

  const id = crypto.randomUUID();
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  challenges.set(id, {
    code,
    expiresAt: Date.now() + challengeLifetimeMs,
    attempts: 0,
  });

  return { id, code };
}

export function verifyPrototypeChallenge(id, submittedCode) {
  const challenge = challenges.get(id);
  if (!challenge || Date.now() > challenge.expiresAt || challenge.attempts >= maxAttempts) {
    challenges.delete(id);
    return false;
  }

  challenge.attempts += 1;
  const isValid = /^\d{6}$/.test(submittedCode) && submittedCode === challenge.code;
  if (isValid) challenges.delete(id);
  return isValid;
}
