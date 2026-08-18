*** Begin Patch
*** Update File: src/routes/+layout.svelte
@@
-    onMount(async () => {
-        const originalFetch = window.fetch.bind(window);
-        window.fetch = async (input, init) => {
-            const response = await originalFetch(input, init);
-
-            if (
-                response.status === 401 &&
-                localStorage.token &&
-                isAuthenticatedBackendFetch(input, init) &&
-                !isAuthRedirectInProgress
-            ) {
-                // token expired or invalid — check whether the current session is actually unauthorized
-                const unauthorized = await isCurrentSessionUnauthorized(originalFetch).catch(() => false);
-                if (unauthorized) {
-                    clearExpiredSession();
-                }
-            }
-
-            return response;
-        };
+    onMount(async () => {
+        const originalFetch = window.fetch.bind(window);
+        window.fetch = async (input, init) => {
+            // If this is a backend request with authorization, optionally encrypt the JSON body
+            try {
+                const requestUrl = resolveFetchUrl(input);
+                const backendOrigin = new URL(WEBUI_BASE_URL || '/', window.location.origin).origin;
+                const headers = resolveFetchHeaders(input, init);
+                if (requestUrl.origin === backendOrigin && headers.has('authorization')) {
+                    // encrypt JSON body when present
+                    try {
+                        if (init && init.body && headers.get('content-type')?.includes('application/json')) {
+                            const bodyText = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
+                            const parsed = JSON.parse(bodyText);
+                            const { encryptObject, getStoredEncryptionCode } = await import('$lib/crypto/encryption');
+                            const code = localStorage.getItem('encryptionCode') || getStoredEncryptionCode();
+                            const encrypted = await encryptObject(parsed, code);
+                            init.body = JSON.stringify({ encrypted });
+                            headers.set('Content-Type', 'application/json');
+                            // reflect headers back to init
+                            init.headers = headers;
+                        }
+                    } catch (e) {
+                        console.debug('Encryption skipped or failed for request:', e);
+                    }
+                }
+            } catch (e) {
+                console.debug('Failed to prepare encrypted request', e);
+            }
+
+            const response = await originalFetch(input, init);
+
+            // If we receive 401 for backend-authenticated request, clear session
+            if (
+                response.status === 401 &&
+                localStorage.token &&
+                isAuthenticatedBackendFetch(input, init) &&
+                !isAuthRedirectInProgress
+            ) {
+                const unauthorized = await isCurrentSessionUnauthorized(originalFetch).catch(() => false);
+                if (unauthorized) {
+                    clearExpiredSession();
+                }
+            }
+
+            // Try to decrypt JSON response if backend returned encrypted payload
+            try {
+                const clone = response.clone();
+                const contentType = clone.headers.get('content-type') || '';
+                if (contentType.includes('application/json')) {
+                    const json = await clone.json();
+                    if (json && (json.encrypted || json.encrypted_data)) {
+                        const { maybeDecryptResponseJson, getStoredEncryptionCode } = await import('$lib/crypto/encryption');
+                        const code = localStorage.getItem('encryptionCode') || getStoredEncryptionCode();
+                        const decrypted = await maybeDecryptResponseJson(json, code);
+                        const body = JSON.stringify(decrypted);
+                        return new Response(body, {
+                            status: response.status,
+                            statusText: response.statusText,
+                            headers: response.headers
+                        });
+                    }
+                }
+            } catch (e) {
+                console.debug('Response decryption skipped or failed:', e);
+            }
+
+            return response;
+        };
*** End Patch