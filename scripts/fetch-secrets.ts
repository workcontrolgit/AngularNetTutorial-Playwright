/**
 * Azure Key Vault → .env generator
 *
 * Pulls Playwright test credentials from Azure Key Vault and writes them
 * to a local .env file (gitignored).
 *
 * Prerequisites:
 *   az login
 *   export AZURE_KEYVAULT_NAME=<your-vault-name>
 *
 * Usage:
 *   npm run setup:env
 *
 * Azure Key Vault secrets expected (create once with az keyvault secret set):
 *   playwright-employee-username
 *   playwright-employee-password
 *   playwright-manager-username
 *   playwright-manager-password
 *   playwright-hradmin-username
 *   playwright-hradmin-password
 *
 * To create secrets in Key Vault (run once):
 *   VAULT=<your-vault>
 *   az keyvault secret set --vault-name $VAULT --name "playwright-employee-username" --value "antoinette16"
 *   az keyvault secret set --vault-name $VAULT --name "playwright-employee-password" --value "Pa\$\$word123"
 *   az keyvault secret set --vault-name $VAULT --name "playwright-manager-username"  --value "rosamond33"
 *   az keyvault secret set --vault-name $VAULT --name "playwright-manager-password"  --value "Pa\$\$word123"
 *   az keyvault secret set --vault-name $VAULT --name "playwright-hradmin-username"  --value "ashtyn1"
 *   az keyvault secret set --vault-name $VAULT --name "playwright-hradmin-password"  --value "Pa\$\$word123"
 *
 * RBAC: grant yourself 'Key Vault Secrets User' role on the vault:
 *   az role assignment create \
 *     --role "Key Vault Secrets User" \
 *     --assignee <your-user-object-id> \
 *     --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const VAULT = process.env.AZURE_KEYVAULT_NAME;
if (!VAULT) {
  console.error('Error: AZURE_KEYVAULT_NAME environment variable is not set.');
  console.error('Run: export AZURE_KEYVAULT_NAME=<your-vault-name>');
  process.exit(1);
}

function getSecret(secretName: string): string {
  try {
    return execSync(
      `az keyvault secret show --vault-name ${VAULT} --name ${secretName} --query value -o tsv`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch (err) {
    console.error(`Failed to fetch secret "${secretName}" from vault "${VAULT}".`);
    console.error('Make sure you are logged in (az login) and have Key Vault Secrets User role.');
    throw err;
  }
}

console.log(`Fetching secrets from Azure Key Vault: ${VAULT}`);

const secrets: Record<string, string> = {
  TEST_USER_EMPLOYEE_USERNAME: getSecret('playwright-employee-username'),
  TEST_USER_EMPLOYEE_PASSWORD: getSecret('playwright-employee-password'),
  TEST_USER_MANAGER_USERNAME:  getSecret('playwright-manager-username'),
  TEST_USER_MANAGER_PASSWORD:  getSecret('playwright-manager-password'),
  TEST_USER_HRADMIN_USERNAME:  getSecret('playwright-hradmin-username'),
  TEST_USER_HRADMIN_PASSWORD:  getSecret('playwright-hradmin-password'),
};

const envContent = Object.entries(secrets)
  .map(([k, v]) => `${k}=${v}`)
  .join('\n') + '\n';

const envPath = path.resolve(__dirname, '../.env');
fs.writeFileSync(envPath, envContent, { encoding: 'utf8' });

console.log(`\n.env written to: ${envPath}`);
console.log('Run: npx playwright test --project=setup');
