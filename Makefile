# Makefile for project setup and key generation

# Directory to store keys
KEYS_DIR := keys

# Key names
ACCESS_PRIVATE_KEY := $(KEYS_DIR)/access_private.key
ACCESS_PUBLIC_KEY := $(KEYS_DIR)/access_public.key
REFRESH_PRIVATE_KEY := $(KEYS_DIR)/refresh_private.key
REFRESH_PUBLIC_KEY := $(KEYS_DIR)/refresh_public.key

# Ensure the keys directory exists
$(KEYS_DIR):
	@echo "Creating keys directory..."
	mkdir -p $(KEYS_DIR)

# Check if keys already exist
check_keys:
	@if [ -f "$(ACCESS_PRIVATE_KEY)" ] || [ -f "$(REFRESH_PRIVATE_KEY)" ]; then \
		echo "Error: Keys already exist in the $(KEYS_DIR) directory."; \
		echo "Run 'make delete_keys' to remove existing keys before generating new ones."; \
		exit 1; \
	fi

# Generate access token keys
$(ACCESS_PRIVATE_KEY): $(KEYS_DIR) check_keys
	@echo "Generating access token private key..."
	openssl genpkey -algorithm RSA -out $(ACCESS_PRIVATE_KEY) -pkeyopt rsa_keygen_bits:2048
	@echo "Generating access token public key..."
	openssl rsa -pubout -in $(ACCESS_PRIVATE_KEY) -out $(ACCESS_PUBLIC_KEY)
	@echo "Access token keys generated successfully!"

# Generate refresh token keys
$(REFRESH_PRIVATE_KEY): $(KEYS_DIR) check_keys
	@echo "Generating refresh token private key..."
	openssl genpkey -algorithm RSA -out $(REFRESH_PRIVATE_KEY) -pkeyopt rsa_keygen_bits:2048
	@echo "Generating refresh token public key..."
	openssl rsa -pubout -in $(REFRESH_PRIVATE_KEY) -out $(REFRESH_PUBLIC_KEY)
	@echo "Refresh token keys generated successfully!"

# Default target to generate all keys
generate_keys: $(ACCESS_PRIVATE_KEY) $(REFRESH_PRIVATE_KEY)
	@echo "All keys generated successfully!"

# Clean up generated keys
delete_keys:
	@echo "Deleting keys directory..."
	rm -rf $(KEYS_DIR)
	@echo "Keys directory deleted successfully!"

# Display help message
help:
	@echo "Available commands:"
	@echo "  make generate_keys - Generate access and refresh token keys"
	@echo "  make delete_keys   - Delete the keys directory"
	@echo "  make help          - Display this help message"

.PHONY: help generate_keys delete_keys check_keys