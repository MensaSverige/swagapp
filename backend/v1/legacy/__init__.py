"""Frozen endpoints kept alive only for app builds that can no longer be fixed.

Nothing here is part of the current API surface. These routes exist because
old releases in the wild still call them, and the only thing we can do for
those users is tell them to update.

Rules for anything in this package:
  - No response_model, and no reuse of models that are still evolving. A
    schema change must never be able to break a route whose entire job is to
    reach clients we cannot rebuild.
  - Payloads are literals. If you find yourself computing one, it belongs in
    the live API instead.
"""
