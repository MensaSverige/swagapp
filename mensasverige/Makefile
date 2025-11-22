.PHONY: all
all: store.config.json

store.config.json:
	@if [ -z "$$REVIEW_PASSWORD" ]; then \
		echo "Error: REVIEW_PASSWORD environment variable is not set. Skipping store config generation."; \
		exit 0; # Exit without error so that the build can continue \
	fi

	@echo "Generating store.config.json from template"
	@RELEASE_NOTES="$${RELEASE_NOTES:-Blandade buggfixar och förbättringar}" envsubst < store.config.tpl.json > store.config.json


.PHONY: clean
clean:
	@rm -f store.config.json