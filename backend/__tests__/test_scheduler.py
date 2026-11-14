"""A startup job must not hold up the server.

create_scheduler() runs while uvicorn imports v1.server, so anything it does
inline delays the API from accepting connections. The external-event sync used
to run there; its booking refresh makes two HTTP calls per stored token, and
after the 2026-11-14 release the API answered 502 for nine minutes while it ran.
"""

import threading

from v1.jobs import scheduler as sched


def test_init_job_runs_on_scheduler_thread_not_inline(monkeypatch):
    started = threading.Event()
    release = threading.Event()

    def slow_job():
        started.set()
        release.wait(5)

    monkeypatch.setattr(sched, "JOB_REGISTRY", [
        sched.JobConfig(
            name="slow",
            func=slow_job,
            default_schedule={"type": "interval", "hours": 1},
            env_prefix="TEST_SLOW_JOB",
            init=True,
        ),
    ])

    scheduler = sched.create_scheduler()
    assert not started.is_set(), "create_scheduler ran the init job inline"

    scheduler.start()
    try:
        assert started.wait(5), "init job did not run when the scheduler started"
    finally:
        release.set()
        scheduler.shutdown(wait=True)
