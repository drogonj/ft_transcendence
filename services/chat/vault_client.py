import os
import hvac

class VaultClient:
    def __init__(self, vault_addr, token_file, ca_cert_path):
        token = ''
        if os.path.exists(token_file):
            with open(token_file, 'r') as file:
                token = file.read().strip()
        if token == '':
            raise ValueError('Django token not found')
        self.client = hvac.Client(url=vault_addr, token=token, verify=ca_cert_path)

    def read_secret(self, path):
        try:
            response = self.client.secrets.kv.v2.read_secret_version(path=path)
            return response['data']['data']
        except hvac.exceptions.VaultError as e:
            print(f"Error reading secret from path {path}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error reading secret from path {path}: {e}")
            return None

    def create_secret(self, path, data):
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=data
            )
            return True
        except hvac.exceptions.VaultError as e:
            print(f"Error creating secret: {e}")
            return False

    def delete_secret(self, path):
        try:
            self.client.secrets.kv.v2.delete_metadata_and_all_versions(path=path)
            return True
        except hvac.exceptions.VaultError as e:
            print(f"Error deleting secret: {e}")
            return False

# Singleton pattern to ensure only one instance of VaultClient
_vault_client_instance = None

def get_vault_client():
    global _vault_client_instance
    if _vault_client_instance is None:
        vault_addr = os.environ.get('VAULT_ADDR')
        token_file = os.environ.get('VAULT_TOKEN_FILE')
        ca_cert_path = os.environ.get('VAULT_CA_CERT_PATH')
        token_file = token_file.strip('"').strip("'")
        _vault_client_instance = VaultClient(vault_addr, token_file, ca_cert_path)
    return _vault_client_instance
