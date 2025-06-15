import { gcm } from "@noble/ciphers/aes";
import { bytesToUtf8, utf8ToBytes } from "@noble/ciphers/utils";
import { managedNonce } from "@noble/ciphers/webcrypto";
import { Buffer } from "buffer";

function getAesGcm(key: Uint8Array) {
	if (key.length !== 32) {
		throw new Error("Encryption key must be 32 bytes (256 bits).");
	}
	return managedNonce(gcm)(key);
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a managed nonce.
 * The IV is prepended to the ciphertext automatically.
 * @returns A base64-encoded string containing the IV and ciphertext.
 */
export async function encrypt(plaintext: string, key: Uint8Array) {
	const aesGcm = getAesGcm(key);
	const plaintextBytes = utf8ToBytes(plaintext);
	const ciphertextWithNonce = aesGcm.encrypt(plaintextBytes);
	return Buffer.from(ciphertextWithNonce).toString("base64");
}

/**
 * Decrypts an AES-256-GCM encrypted, base64-encoded string with a managed nonce.
 * @returns The original plaintext string.
 */
export async function decrypt(
	base64CiphertextWithNonce: string,
	key: Uint8Array,
) {
	const aesGcm = getAesGcm(key);
	const ciphertextWithNonce = Buffer.from(base64CiphertextWithNonce, "base64");
	const decryptedBytes = aesGcm.decrypt(ciphertextWithNonce);
	return bytesToUtf8(decryptedBytes);
}
