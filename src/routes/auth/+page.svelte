@@
-import { getBackendConfig } from '$lib/apis';
+import { getBackendConfig } from '$lib/apis';
 import {
     ldapUserSignIn,
     getSessionUser,
-    userSignIn,
+    userSignIn,
     userSignUp,
     updateUserTimezone
 } from '$lib/apis/auths';
@@
 let password = '';
 let confirmPassword = '';
+let encryptionCode = (typeof localStorage !== 'undefined' && localStorage.getItem('encryptionCode')) || '';
@@
-    const signInHandler = async () => {
-        const sessionUser = await userSignIn(email, password).catch((error) => {
-            toast.error(`${error}`);
-            return null;
-        });
-
-        await setSessionUser(sessionUser);
-    };
+    const signInHandler = async () => {
+        const sessionUser = await userSignIn(email, password, encryptionCode).catch((error) => {
+            toast.error(`${error}`);
+            return null;
+        });
+
+        await setSessionUser(sessionUser);
+    };
@@
-    const ldapSignInHandler = async () => {
-        const sessionUser = await ldapUserSignIn(ldapUsername, password).catch((error) => {
-            toast.error(`${error}`);
-            return null;
-        });
-        await setSessionUser(sessionUser);
-    };
+    const ldapSignInHandler = async () => {
+        const sessionUser = await ldapUserSignIn(ldapUsername, password, encryptionCode).catch((error) => {
+            toast.error(`${error}`);
+            return null;
+        });
+        await setSessionUser(sessionUser);
+    };
*** End Patch