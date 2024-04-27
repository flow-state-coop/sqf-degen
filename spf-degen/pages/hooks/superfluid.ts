import { Operation, Host } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";
import { encodeFunctionData, hexToBigInt, Address } from "viem";
import { useEthersSigner, useEthersProvider } from "./ethersAdapters";
import { useSuperfluidContext } from "../context/Superfluid";
import { gdaAbi } from "../lib/abi/gda";
import {
  SUPERFLUID_HOST_ADDRESS,
  DEGENX_ADDRESS,
  GDA_CONTRACT_ADDRESS,
} from "../lib/constants";

export default function useSuperfluid(accountAddress?: string) {
  const { sfFramework } = useSuperfluidContext();
  const signer = useEthersSigner();
  const provider = useEthersProvider();

  const host = new Host(SUPERFLUID_HOST_ADDRESS);

  const wrap = async (flowRate: string) => {
    if (!signer) {
      throw Error("Could not find the signer");
    }

    const superToken = new ethers.Contract(
      DEGENX_ADDRESS,
      new ethers.utils.Interface(["function upgradeByETH() payable"])
    );
    const tx = await superToken
      .connect(signer)
      .upgradeByETH({ value: flowRate });

    await tx.wait();
  };

  const editFlow = (
    receiver: Address,
    oldFlowRate: string,
    newFlowRate: string
  ) => {
    if (!accountAddress) {
      throw Error("Could not find the account address");
    }

    if (!sfFramework) {
      throw Error("SF Framework is not initialized");
    }

    let op: Operation;

    if (BigInt(newFlowRate) === BigInt(0)) {
      op = sfFramework.cfaV1.deleteFlow({
        sender: accountAddress,
        receiver,
        superToken: DEGENX_ADDRESS,
      });
    } else if (BigInt(oldFlowRate) !== BigInt(0)) {
      op = sfFramework.cfaV1.updateFlow({
        sender: accountAddress,
        receiver,
        flowRate: newFlowRate,
        superToken: DEGENX_ADDRESS,
      });
    } else {
      op = sfFramework.cfaV1.createFlow({
        sender: accountAddress,
        receiver,
        flowRate: newFlowRate,
        superToken: DEGENX_ADDRESS,
      });
    }

    return op;
  };

  const gdaGetFlowRate = async (
    superTokenAddress: Address,
    gdaPool: Address
  ) => {
    if (!signer?.getAddress()) {
      throw Error("Could not find the signer");
    }
    const account = `0x${await signer.getAddress()}` as `0x${string}`;

    const getFlowRateData = encodeFunctionData({
      abi: gdaAbi,
      functionName: "getFlowRate",
      args: [superTokenAddress, account, gdaPool],
    });
    const res = await provider.call({
      to: GDA_CONTRACT_ADDRESS,
      data: getFlowRateData,
    });
    const flowRate = res ? hexToBigInt(res as `0x${string}`).toString() : "0";

    return flowRate;
  };

  const gdaDistributeFlow = (flowRate: string, gdaPool: Address) => {
    if (!accountAddress) {
      throw Error("Could not find the account address");
    }

    if (!gdaPool) {
      throw Error("Could not find GDA pool address");
    }

    const distributeFlowData = encodeFunctionData({
      abi: gdaAbi,
      functionName: "distributeFlow",
      args: [
        DEGENX_ADDRESS,
        accountAddress as Address,
        gdaPool,
        BigInt(flowRate),
        "0x",
      ],
    });
    const op = host.callAgreement(
      GDA_CONTRACT_ADDRESS,
      distributeFlowData,
      "0x",
      {}
    );

    return op;
  };

  const execOperation = async (op: Operation) => {
    if (!signer) {
      throw Error("No signer was found");
    }

    const tx = await op.exec(signer);

    await tx.wait();
  };

  return {
    sfFramework,
    wrap,
    editFlow,
    execOperation,
    gdaGetFlowRate,
    gdaDistributeFlow,
  };
}
