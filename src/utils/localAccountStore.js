const accountStorageKey = 'compugrade-account';
const legacyProfileStorageKey = 'compugrade-profile';
const legacyPasswordStorageKey = 'compugrade-password';
const passwordIterations = 120000;

export const defaultAccount = {
  fullName: 'Juan Dela Cruz',
  username: 'juandelacruz',
  email: 'juan.delacruz@university.edu',
  emailVerified: true,
  phone: '',
  phoneVerified: false,
  studentId: '2026-0004',
  program: 'BS Information Technology',
  yearLevel: '1st Year',
  bio: 'Student focused on building practical tech skills and improving academic performance.',
  profilePicture: '',
  twoFactorEnabled: false,
  verificationMethods: { email: true, phone: false },
  loginSessions: [
    {
      id: 'current-session',
      device: 'Windows',
      browser: 'Chrome',
      location: 'Davao, Philippines',
      lastActive: 'Active now',
      loginDate: 'Current session',
      isCurrent: true,
      isActive: true,
    },
    {
      id: 'previous-session',
      device: 'Windows',
      browser: 'Chrome',
      location: 'Davao, Philippines',
      lastActive: 'October 7, 2026',
      loginDate: 'October 7, 2026',
      isCurrent: false,
      isActive: false,
    },
  ],
};

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function derivePasswordHash(password, salt, iterations) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
    .then((keyMaterial) => crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      256,
    ));
}

function readStoredAccount() {
  const stored = localStorage.getItem(accountStorageKey);
  return stored ? JSON.parse(stored) : null;
}

function normalizeAccount(account) {
  const normalized = { ...defaultAccount, ...account };
  normalized.verificationMethods = {
    ...defaultAccount.verificationMethods,
    ...account?.verificationMethods,
  };
  normalized.loginSessions = Array.isArray(account?.loginSessions)
    ? account.loginSessions
    : defaultAccount.loginSessions;
  if (!normalized.profilePicture && normalized.picture) {
    normalized.profilePicture = normalized.picture;
  }
  delete normalized.picture;
  delete normalized.passwordCredential;
  return normalized;
}

function migrateLegacyData() {
  let legacyProfile = {};
  let passwordCredential = null;

  const storedProfile = localStorage.getItem(legacyProfileStorageKey);
  if (storedProfile) {
    try {
      legacyProfile = JSON.parse(storedProfile);
    } catch {
      localStorage.removeItem(legacyProfileStorageKey);
    }
  }

  const storedPassword = localStorage.getItem(legacyPasswordStorageKey);
  if (storedPassword) {
    try {
      passwordCredential = JSON.parse(storedPassword);
    } catch {
      localStorage.removeItem(legacyPasswordStorageKey);
    }
  }

  const account = { ...normalizeAccount(legacyProfile), passwordCredential };
  localStorage.setItem(accountStorageKey, JSON.stringify(account));
  localStorage.removeItem(legacyProfileStorageKey);
  localStorage.removeItem(legacyPasswordStorageKey);
  return account;
}

function getStoredAccount() {
  return readStoredAccount() || migrateLegacyData();
}

export function loadLocalAccount() {
  return normalizeAccount(getStoredAccount());
}

export function saveLocalAccount(account) {
  const storedAccount = getStoredAccount();
  localStorage.setItem(accountStorageKey, JSON.stringify({
    ...storedAccount,
    ...normalizeAccount(account),
  }));
}

export function updateLocalSecuritySettings(changes) {
  const storedAccount = getStoredAccount();
  localStorage.setItem(accountStorageKey, JSON.stringify({
    ...storedAccount,
    ...changes,
  }));
}

export async function saveLocalPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, passwordIterations);
  const storedAccount = getStoredAccount();

  localStorage.setItem(accountStorageKey, JSON.stringify({
    ...storedAccount,
    passwordCredential: {
      salt: toBase64(salt),
      hash: toBase64(hash),
      iterations: passwordIterations,
    },
  }));
}

export async function verifyLocalPassword(password) {
  const credential = getStoredAccount().passwordCredential;
  if (!credential || typeof credential.salt !== 'string' || typeof credential.hash !== 'string') {
    return false;
  }

  const expected = fromBase64(credential.hash);
  const actual = new Uint8Array(await derivePasswordHash(
    password,
    fromBase64(credential.salt),
    credential.iterations,
  ));
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

export function hasLocalPassword() {
  return Boolean(getStoredAccount().passwordCredential);
}

export function getLocalLoginSessions() {
  return [...loadLocalAccount().loginSessions];
}

export function saveLocalLoginSessions(loginSessions) {
  updateLocalSecuritySettings({ loginSessions });
}

export function authenticateLocalAccount(identifier, password) {
  const account = loadLocalAccount();
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const matchesAccount = [account.email, account.username]
    .some((value) => value.toLowerCase() === normalizedIdentifier);

  if (!matchesAccount) return Promise.resolve(false);
  return verifyLocalPassword(password);
}
