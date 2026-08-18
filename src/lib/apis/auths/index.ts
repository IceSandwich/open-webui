*** Begin Patch
*** Update File: src/lib/apis/auths/index.ts
@@
-import { WEBUI_API_BASE_URL } from '$lib/constants';
+import { WEBUI_API_BASE_URL } from '$lib/constants';
+import { decryptToObject, maybeDecryptResponseJson, setEncryptionCode, getStoredEncryptionCode } from '$lib/crypto/encryption';
@@
-export const ldapUserSignIn = async (user: string, password: string) => {
+export const ldapUserSignIn = async (user: string, password: string, encryptionCode?: string) => {
     let error = null;
 
     const res = await fetch(`${WEBUI_API_BASE_URL}/auths/ldap`, {
@@
-        .then(async (res) => {
-            if (!res.ok) throw await res.json();
-            return res.json();
-        })
+        .then(async (res) => {
+            if (!res.ok) throw await res.json();
+            const json = await res.json();
+            // If backend returned encrypted payload, try to decrypt using provided code or stored/default
+            try {
+                const decrypted = await maybeDecryptResponseJson(json, encryptionCode ?? getStoredEncryptionCode());
+                // if decryption succeeded and returned object, store validated code
+                if (decrypted && (encryptionCode || localStorage.getItem('encryptionCode') == null)) {
+                    // store encryption code used (do not send to server)
+                    if (encryptionCode) await setEncryptionCode(encryptionCode);
+                }
+                return decrypted;
+            } catch (e) {
+                console.error('Failed to decrypt ldap signin response', e);
+                throw e;
+            }
+        })
         .catch((err) => {
             console.error(err);
 
             error = err.detail;
             return null;
         });
@@
-export const userSignIn = async (email: string, password: string) => {
+export const userSignIn = async (email: string, password: string, encryptionCode?: string) => {
     let error = null;
 
     const res = await fetch(`${WEBUI_API_BASE_URL}/auths/signin`, {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json'
         },
         credentials: 'include',
         body: JSON.stringify({
             email: email,
             password: password
         })
     })
-        .then(async (res) => {
-            if (!res.ok) throw await res.json();
-            return res.json();
-        })
+        .then(async (res) => {
+            if (!res.ok) throw await res.json();
+            const json = await res.json();
+            try {
+                const decrypted = await maybeDecryptResponseJson(json, encryptionCode ?? getStoredEncryptionCode());
+                if (decrypted && (encryptionCode || localStorage.getItem('encryptionCode') == null)) {
+                    if (encryptionCode) await setEncryptionCode(encryptionCode);
+                }
+                return decrypted;
+            } catch (e) {
+                console.error('Failed to decrypt signin response', e);
+                throw e;
+            }
+        })
         .catch((err) => {
             console.error(err);
 
             error = err.detail;
             return null;
         });
*** End Patch