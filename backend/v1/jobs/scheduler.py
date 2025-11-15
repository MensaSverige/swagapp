# scheduler.py
import os
import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from v1.jobs.refresh_events import refresh_external_events
from v1.jobs.refresh_news import refresh_external_news

log = logging.getLogger(__name__)


class JobConfig:
    def __init__(self, name, func, default_schedule, env_prefix, init=False):
        self.name = name
        self.func = func
        self.default_schedule = default_schedule  # dict, e.g. {"type": "interval", "seconds": 60}
        self.env_prefix = env_prefix             # e.g. "CLEANUP_JOB"
        self.init = init # bool, whether to run the job immediately on startup

    def is_enabled(self) -> bool:
        return os.getenv(f"{self.env_prefix}_ENABLED", "true").lower() == "true"

    def build_trigger(self):
        """
        Build APScheduler trigger from env or default.
        Examples:
          CLEANUP_JOB_CRON="0 */5 * * *"
          CLEANUP_JOB_INTERVAL_SECONDS=300
        """
        cron_expr = os.getenv(f"{self.env_prefix}_CRON")
        interval_seconds = os.getenv(f"{self.env_prefix}_PERIOD")

        if cron_expr:
            # simple "m h dom mon dow"
            minute, hour, day, month, dow = cron_expr.split()
            return CronTrigger(
                minute=minute, hour=hour, day=day, month=month, day_of_week=dow
            )

        if interval_seconds:
            return IntervalTrigger(seconds=int(interval_seconds))

        # fall back to default
        t = self.default_schedule
        if t["type"] == "interval":
            return IntervalTrigger(**{k: v for k, v in t.items() if k != "type"})
        elif t["type"] == "cron":
            return CronTrigger(**{k: v for k, v in t.items() if k != "type"})
        else:
            raise ValueError(f"Unknown trigger type {t['type']}")


JOB_REGISTRY = [
    JobConfig(
        name="sync_external_events",
        func=refresh_external_events,
        default_schedule={"type": "cron", "minute": "*/15"},
        env_prefix="SYNC_EXTERNAL_EVENTS",
        init=True,
    ),
    JobConfig(
        name="refresh_external_news",
        func=refresh_external_news,
        default_schedule={"type": "cron", "minute": "*/30"},
        env_prefix="REFRESH_EXTERNAL_NEWS",
        init=True,
    ),
]


def create_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")

    for job_cfg in JOB_REGISTRY:
        if not job_cfg.is_enabled():
            log.info("Job %s disabled via env", job_cfg.name)
            continue

        trigger = job_cfg.build_trigger()
        scheduler.add_job(
            job_cfg.func,
            trigger=trigger,
            id=job_cfg.name,
            replace_existing=True,
            max_instances=1,
        )
        log.info("Scheduled job %s with trigger %s", job_cfg.name, trigger)

        if job_cfg.init:
            log.info("Running job %s immediately on startup", job_cfg.name)
            try:
                job_cfg.func()
            except Exception as e:
                log.error("Error running job %s on startup: %s", job_cfg.name, e)

    return scheduler
