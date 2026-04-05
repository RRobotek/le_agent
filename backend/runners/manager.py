import asyncio
import json

import utils.brain as brain
import utils.uniswap as uniswap
from utils.ens import get_subname

# ens_name -> running asyncio Task
_runners: dict[str, asyncio.Task] = {}


async def _run_agent(ens_name: str) -> None:
    while True:
        try:
            agent = await get_subname(ens_name)
            if not agent:
                print(f"[{ens_name}] agent not found in ENS, stopping runner")
                break

            contract_address = agent.get("contract_address")
            policy = agent["policy"]
            if isinstance(policy, str):
                policy = json.loads(policy)

            decision = await brain.decide(agent["strategy"], policy)
            print(f"[{ens_name}] {decision['action']}: {decision['reasoning']}")

            if decision["action"] == "swap" and contract_address:
                token_in = decision["token_in"]
                prices = await brain.fetch_prices([token_in])
                price = prices.get(token_in, 0)
                if price > 0:
                    amount_wei = int((decision["amount_usd"] / price) * 1e18)
                    tx_hash = await uniswap.execute_swap(
                        ens_name=ens_name,
                        contract_address=contract_address,
                        owner_address=agent["owner"],
                        token_in=token_in,
                        token_out=decision["token_out"],
                        amount_in_wei=amount_wei,
                    )
                    print(f"[{ens_name}] swap submitted: {tx_hash}")
            elif decision["action"] == "swap" and not contract_address:
                print(f"[{ens_name}] swap decision but no contract_address, skipping")

        except asyncio.CancelledError:
            return
        except Exception as e:
            print(
                f"[{ens_name}] error: {e}\n{e.__traceback__.tb_frame.f_code.co_filename}"
            )

        await asyncio.sleep(25 * 60)


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
