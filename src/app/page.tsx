"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import type { ContractFunctionName } from "viem";
import { signalGreenhouseAbi } from "@/lib/abi";
import {
  attributionDataSuffix,
  isAttributionConfigured,
  isContractConfigured,
  signalGreenhouseAddress,
} from "@/lib/wagmi";

type ActionId = "pulse" | "switch" | "stamp";
type FriendlyStatus =
  | "Ready"
  | "Choose a wallet"
  | "Pending"
  | "Confirmed"
  | "Request rejected"
  | "Transaction failed"
  | "Configuration needed";

const actions: {
  id: ActionId;
  label: string;
  functionName: ContractFunctionName<typeof signalGreenhouseAbi, "nonpayable">;
  tone: string;
  detail: string;
}[] = [
  {
    id: "pulse",
    label: "Pulse Signal",
    functionName: "pulseSignal",
    tone: "from-[#2b7fff] to-[#42e8a6]",
    detail: "Wake a fresh growth pulse in the signal canopy.",
  },
  {
    id: "switch",
    label: "Flip Switch",
    functionName: "flipSwitch",
    tone: "from-[#f4d35e] to-[#45cfff]",
    detail: "Toggle the greenhouse climate relay onchain.",
  },
  {
    id: "stamp",
    label: "Stamp Pass",
    functionName: "stampPass",
    tone: "from-[#ff4fc4] to-[#42e8a6]",
    detail: "Mark your specimen pass with a Base transaction.",
  },
];

const readCalls = (address?: `0x${string}`) =>
  [
    {
      address: signalGreenhouseAddress,
      abi: signalGreenhouseAbi,
      functionName: "userPulses",
      args: [address ?? "0x0000000000000000000000000000000000000000"],
    },
    {
      address: signalGreenhouseAddress,
      abi: signalGreenhouseAbi,
      functionName: "userSwitches",
      args: [address ?? "0x0000000000000000000000000000000000000000"],
    },
    {
      address: signalGreenhouseAddress,
      abi: signalGreenhouseAbi,
      functionName: "userStamps",
      args: [address ?? "0x0000000000000000000000000000000000000000"],
    },
    {
      address: signalGreenhouseAddress,
      abi: signalGreenhouseAbi,
      functionName: "totalPulses",
    },
    {
      address: signalGreenhouseAddress,
      abi: signalGreenhouseAbi,
      functionName: "totalSwitches",
    },
    {
      address: signalGreenhouseAddress,
      abi: signalGreenhouseAbi,
      functionName: "totalStamps",
    },
  ] as const;

function shortAddress(address?: string) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function friendlyError(error: unknown): FriendlyStatus {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("reject") || message.includes("denied")) {
    return "Request rejected";
  }
  return "Transaction failed";
}

export default function Home() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const [walletOpen, setWalletOpen] = useState(false);
  const [lastHash, setLastHash] = useState<`0x${string}`>();
  const [lastAction, setLastAction] = useState<ActionId>();
  const [activity, setActivity] = useState<FriendlyStatus>(
    isContractConfigured ? "Ready" : "Configuration needed",
  );

  const reads = useReadContracts({
    contracts: readCalls(address),
    query: {
      enabled: isContractConfigured,
      refetchInterval: 8000,
    },
  });

  const receipt = useWaitForTransactionReceipt({
    hash: lastHash,
    query: {
      enabled: Boolean(lastHash),
    },
  });

  useEffect(() => {
    if (receipt.isSuccess) {
      reads.refetch();
    }
    if (receipt.isError) {
      console.error(receipt.error);
    }
  }, [receipt.isSuccess, receipt.isError, receipt.error, reads]);

  const displayedActivity: FriendlyStatus = receipt.isSuccess
    ? "Confirmed"
    : receipt.isError
      ? "Transaction failed"
      : activity;

  const values = reads.data?.map((item) =>
    item.status === "success" ? item.result : 0n,
  ) ?? [0n, 0n, 0n, 0n, 0n, 0n];

  const stats = [
    { label: "Pulses", mine: values[0], total: values[3], accent: "#45cfff" },
    { label: "Switches", mine: values[1], total: values[4], accent: "#f4d35e" },
    { label: "Stamps", mine: values[2], total: values[5], accent: "#ff4fc4" },
  ];

  async function runAction(
    action: (typeof actions)[number],
  ) {
    if (!isConnected) {
      setActivity("Choose a wallet");
      setWalletOpen(true);
      return;
    }
    if (!isContractConfigured || !isAttributionConfigured) {
      setActivity("Configuration needed");
      return;
    }

    try {
      setLastAction(action.id);
      setActivity("Pending");
      const hash = await writeContractAsync({
        address: signalGreenhouseAddress,
        abi: signalGreenhouseAbi,
        functionName: action.functionName,
        chainId: base.id,
        dataSuffix: attributionDataSuffix,
      });
      setLastHash(hash);
    } catch (error) {
      console.error(error);
      setActivity(friendlyError(error));
    }
  }

  const walletStatus = isConnected
    ? chainId === base.id
      ? "Connected on Base"
      : "Connected wallet"
    : "Ready to connect";

  return (
    <main className="min-h-screen overflow-hidden bg-[#08110f] text-[#f7fff9]">
      <div className="absolute inset-0 -z-0 bg-[linear-gradient(rgba(69,207,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(69,207,255,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="absolute left-1/2 top-0 -z-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#42e8a6]/12 blur-3xl" />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 rounded-[8px] border border-white/10 bg-black/25 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#42e8a6]">
              Base greenhouse console
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              Signal Greenhouse
            </h1>
          </div>
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#42e8a6] shadow-[0_0_16px_#42e8a6]" />
              <span>{walletStatus}</span>
              <span className="font-mono text-white/70">
                {shortAddress(address)}
              </span>
            </div>
            <button
              className="rounded-[8px] bg-[#2b7fff] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(43,127,255,0.35)] transition hover:bg-[#45cfff] hover:text-[#06100e]"
              onClick={() => setWalletOpen((open) => !open)}
              type="button"
            >
              {isConnected ? "Wallet" : "Connect Wallet"}
            </button>
            {walletOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-full min-w-64 rounded-[8px] border border-white/12 bg-[#0d1815] p-2 shadow-2xl sm:w-72">
                {connectors.map((connector) => (
                  <button
                    className="flex w-full items-center justify-between rounded-[6px] px-3 py-2.5 text-left text-sm text-white hover:bg-white/10"
                    disabled={isConnecting}
                    key={connector.uid}
                    onClick={() => {
                      connect({ connector, chainId: base.id });
                      setWalletOpen(false);
                    }}
                    type="button"
                  >
                    <span>{connector.name}</span>
                    <span className="font-mono text-xs text-[#42e8a6]">Base</span>
                  </button>
                ))}
                {isConnected ? (
                  <button
                    className="mt-1 w-full rounded-[6px] border border-white/10 px-3 py-2.5 text-left text-sm text-white/80 hover:bg-white/10"
                    onClick={() => {
                      disconnect();
                      setWalletOpen(false);
                    }}
                    type="button"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-[8px] border border-white/10 bg-[#0b1613] p-5 shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2b7fff] via-[#42e8a6] to-[#ff4fc4]" />
            <div className="absolute right-4 top-5 grid grid-cols-3 gap-1">
              {[...Array(18)].map((_, index) => (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#42e8a6]/50"
                  key={index}
                />
              ))}
            </div>
            <div className="relative">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f4d35e]">
                Growth signal panel
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Three onchain actions for a living Base lab.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/72">
                Connect a wallet, send one of three gas-only interactions, and
                watch your personal counters and global greenhouse totals update.
              </p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {actions.map((action) => (
                <button
                  className="group min-h-36 rounded-[8px] border border-white/12 bg-white/[0.05] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={activity === "Pending"}
                  key={action.id}
                  onClick={() => runAction(action)}
                  type="button"
                >
                  <span
                    className={`mb-4 block h-2 rounded-full bg-gradient-to-r ${action.tone} shadow-[0_0_18px_rgba(66,232,166,0.3)]`}
                  />
                  <span className="block text-lg font-semibold text-white">
                    {action.label}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-white/65">
                    {action.detail}
                  </span>
                  <span className="mt-4 inline-flex rounded-[6px] border border-white/10 px-2 py-1 font-mono text-xs text-[#42e8a6]">
                    {lastAction === action.id ? displayedActivity : "Ready"}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["CO2 stable", "Root zone live", "Light rails synced", "No token required"].map(
                (item) => (
                  <span
                    className="rounded-[6px] border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70"
                    key={item}
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#45cfff]">
                Climate lights
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ["Nutrient", "#42e8a6"],
                  ["Signal", "#45cfff"],
                  ["Bloom", "#ff4fc4"],
                ].map(([label, color]) => (
                  <div
                    className="rounded-[8px] border border-white/10 bg-black/20 p-3"
                    key={label}
                  >
                    <span
                      className="mb-3 block h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 20px ${color}`,
                      }}
                    />
                    <p className="text-xs text-white/65">{label}</p>
                    <p className="mt-1 font-mono text-sm text-white">Online</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#f4d35e]">
                Seed tag rail
              </p>
              <div className="mt-4 space-y-3">
                {stats.map((stat) => (
                  <div
                    className="rounded-[8px] border border-white/10 bg-black/20 p-3"
                    key={stat.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{stat.label}</span>
                      <span
                        className="h-2 w-14 rounded-full"
                        style={{ backgroundColor: stat.accent }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <p className="rounded-[6px] bg-white/[0.05] p-2">
                        <span className="block text-xs text-white/55">My</span>
                        <span className="font-mono text-xl text-white">
                          {stat.mine.toString()}
                        </span>
                      </p>
                      <p className="rounded-[6px] bg-white/[0.05] p-2">
                        <span className="block text-xs text-white/55">Total</span>
                        <span className="font-mono text-xl text-white">
                          {stat.total.toString()}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-[1fr_1fr]">
          <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#42e8a6]">
              Recent activity
            </p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-[8px] bg-black/20 p-4">
              <div>
                <p className="text-sm text-white/55">Last Transaction</p>
                <p className="mt-1 text-xl font-semibold">{displayedActivity}</p>
              </div>
              <span className="h-4 w-4 rounded-full bg-[#42e8a6] shadow-[0_0_20px_#42e8a6]" />
            </div>
          </div>
          <div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#45cfff]">
              Wallet status
            </p>
            <div className="mt-4 grid gap-2 text-sm text-white/75">
              <p className="flex justify-between gap-4 rounded-[6px] bg-black/20 px-3 py-2">
                <span>Address</span>
                <span className="font-mono text-white">{shortAddress(address)}</span>
              </p>
              <p className="flex justify-between gap-4 rounded-[6px] bg-black/20 px-3 py-2">
                <span>Network</span>
                <span className="font-mono text-white">
                  {chainId === base.id ? "Base" : "Select Base"}
                </span>
              </p>
              <p className="flex justify-between gap-4 rounded-[6px] bg-black/20 px-3 py-2">
                <span>Writes</span>
                <span className="font-mono text-white">3 actions only</span>
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
