import asyncio

# ens_name -> running asyncio Task
_runners: dict[str, asyncio.Task] = {}


async def _run_agent(ens_name: str) -> None:
    # TODO: implement AgentRunner (LLM loop + trade execution)
    pass


def start_runner(ens_name: str) -> None:
    if ens_name in _runners:
        return
    task = asyncio.create_task(_run_agent(ens_name))
    _runners[ens_name] = task


def stop_runner(ens_name: str) -> None:
    task = _runners.pop(ens_name, None)
    if task:
        task.cancel()


def start_all(ens_names: list[str]) -> None:
    for ens_name in ens_names:
        start_runner(ens_name)


def stop_all() -> None:
    for ens_name in list(_runners):
        stop_runner(ens_name)


def is_running(ens_name: str) -> bool:
    return ens_name in _runners
