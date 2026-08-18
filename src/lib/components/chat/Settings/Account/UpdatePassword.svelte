*** Begin Patch
*** Update File: src/lib/components/chat/Settings/Account/UpdatePassword.svelte
@@
 		<div class="flex-1">
 			<SensitiveInput
 				variant="settings"
 				type="password"
 				bind:value={newPasswordConfirm}
 				placeholder={$i18n.t('Confirm your new password')}
 				autocomplete="off"
 				required
 			/>
 		</div>
 	</div>
+
+	<div class="flex flex-col w-full mt-4">
+		<div class="mb-1 text-xs text-gray-600 dark:text-gray-400">{$i18n.t('Encryption Code')}</div>
+		<div class="flex gap-2">
+			<input
+				class="flex-1 rounded px-2 py-1 text-sm"
+				bind:value={encryptionCode}
+				placeholder={$i18n.t('Enter encryption code (optional)')}
+				autocomplete="off"
+			/>
+			<button type="button" class={actionButtonClass} on:click={updateEncryptionCode}>
+				{$i18n.t('Save')}
+			</button>
+		</div>
+		<p class="mt-1 text-[0.6875rem] text-gray-400 dark:text-gray-600">{$i18n.t('Used to encrypt/decrypt API data on this device. Not sent to the server.')}</p>
+	</div>
*** End Patch