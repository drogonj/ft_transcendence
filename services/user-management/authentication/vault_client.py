import os
import hvac
import time

class VaultClient:
    def __init__(self, vault_addresses, token_file, ca_cert_path):
        self.vault_addresses = vault_addresses
        self.token_file = token_file
        self.ca_cert_path = ca_cert_path
        self.client = None

    def connect(self):
        token = ''
        if os.path.exists(self.token_file):
            with open(self.token_file, 'r') as file:
                token = file.read().strip()
        if token == '':
            raise ValueError('Django token not found')

        for addr in self.vault_addresses:
            try:
                self.client = hvac.Client(url=addr, token=token, verify=self.ca_cert_path)
                if self.client.is_authenticated():
                    return
            except Exception as e:
                print(f"Failed to connect to Vault at {addr}: {str(e)}")
        
        raise ConnectionError("Failed to connect to any Vault instance")

    def read_secret(self, path):
        if not self.client or not self.client.is_authenticated():
            self.connect()

        try:
            response = self.client.secrets.kv.v2.read_secret_version(path=path)
            return response['data']['data']
        except hvac.exceptions.VaultError as e:
            print(f"Error reading secret from path {path}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error reading secret from path {path}: {e}")
            return None

_vault_client_instance = None

def get_vault_client():
    global _vault_client_instance
    if _vault_client_instance is None:
        vault_addresses = [
            "https://vault_2:8200",
            "https://vault_3:8200",
            "https://vault_4:8200"
        ]
        token_file = os.environ.get('VAULT_TOKEN_FILE', '').strip('"').strip("'")
        ca_cert_path = os.environ.get('VAULT_CA_CERT_PATH')
        _vault_client_instance = VaultClient(vault_addresses, token_file, ca_cert_path)
    return _vault_client_instance
