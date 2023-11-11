.PHONY: test

test:
	@echo "Ensuring virtualenv"
	@[ -d .venv ] || virtualenv -p python3 .venv
	@echo "Installing requirements"
	@.venv/bin/pip install -r ./backend/requirements.txt
	@echo "Running tests"
	@cd backend && ../.venv/bin/python -m pytest -v
