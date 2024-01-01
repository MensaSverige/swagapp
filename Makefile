.PHONY: test python-deps clean

test: python-deps
	@echo "Running tests"
	@cd backend && ../.venv/bin/python -m pytest -v

clean:
	@echo "Cleaning up .venv"
	@rm -rf .venv
	@echo "Cleaning up docs"
	@cd docs && git clean -Xdf

docs: docs/backend # docs/app docs/website

docs/backend: python-deps
	@echo "Generating markdown backend documentation using sphinx"
	@ ( \
			cp -a ./schema ./backend; \
			source .venv/bin/activate; \
			cd docs; \
			sphinx-apidoc -f -o ./source ../backend; \
			sphinx-build -b markdown ./source ./backend; \
			deactivate; \
			rm -rf ../backend/schema; \
		)

python-deps: .venv
	@.venv/bin/pip install -r ./backend/requirements.txt

.venv:
	@echo "Ensuring virtualenv"
	@echo Looking for python3.11
	@command -v python3.11 >/dev/null 2>&1 || { echo >&2 "Python 3.11 is not installed.  Aborting."; exit 1; }
	@[ -d .venv ] || python3.11 -m venv .venv
