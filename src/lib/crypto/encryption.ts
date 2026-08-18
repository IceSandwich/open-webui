// AES-GCM encryption helpers using Web Crypto API
const DEFAULT_ENCRYPTION_CODE = 'openwebui-default-encryption';

let _currentCode = typeof localStorage !== 'undefined' ? localStorage.getItem('encryptionCode') : null;
let _currentKeyPromise: Promise<CryptoKey> | null = null;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function deriveKeyFromCode(code: string): Promise<CryptoKey> {
	const data = textEncoder.encode(code);
	const hash = await crypto.subtle.digest('SHA-256', data);
	// import raw hash as AES-GCM key
	return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function getKey(code?: string) {
	const effective = code ?? _currentCode ?? DEFAULT_ENCRYPTION_CODE;
	if (_currentKeyPromise && code == null) return _currentKeyPromise;
	const p = deriveKeyFromCode(effective);
	if (code == null) {
		_currentKeyPromise = p;
	}
	return p;
}

function _toBase64(bytes: Uint8Array) {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function _fromBase64(b64: string) {
	const binary = atob(b64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

export async function setEncryptionCode(code: string | null) {
	if (typeof localStorage !== 'undefined') {
		if (code) localStorage.setItem('encryptionCode', code);
		else localStorage.removeItem('encryptionCode');
	}
	_currentCode = code;
	_currentKeyPromise = null;
	return getKey();
}

export function getStoredEncryptionCode() {
	return _currentCode ?? DEFAULT_ENCRYPTION_CODE;
}

// Encrypt an object (JSON) -> base64 of (iv + ciphertext)
export async function encryptObject(obj: unknown, code?: string) {
	const key = await getKey(code);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const plain = textEncoder.encode(JSON.stringify(obj));
	const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
	const ctArr = new Uint8Array(ct);
	const combined = new Uint8Array(iv.byteLength + ctArr.byteLength);
	combined.set(iv, 0);
	combined.set(ctArr, iv.byteLength);
	return _toBase64(combined);
}

// Decrypt base64 (iv + ciphertext) -> object
export async function decryptToObject(b64: string, code?: string) {
	const key = await getKey(code);
	const bytes = _fromBase64(b64);
	if (bytes.length < 13) throw new Error('Invalid encrypted payload');
	const iv = bytes.slice(0, 12);
	const ct = bytes.slice(12);
	const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
	const txt = textDecoder.decode(plain as ArrayBuffer);
	return JSON.parse(txt);
}

// Try to decrypt a response object that may contain encrypted payloads.
// If 'encrypted' field exists (string), decrypt and return the parsed object.
export async function maybeDecryptResponseJson(obj: any, code?: string) {
	if (!obj) return obj;
	if (typeof obj === 'object' && (typeof obj.encrypted === 'string' || typeof obj.encrypted_data === 'string')) {
		const b64 = obj.encrypted ?? obj.encrypted_data;
		return await decryptToObject(b64, code);
	}
	return obj;
}

export { DEFAULT_ENCRYPTION_CODE };
