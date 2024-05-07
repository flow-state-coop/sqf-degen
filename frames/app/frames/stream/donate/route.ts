import { TransactionTargetResponse, getFrameMessage } from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import {
  Abi,
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { degen } from "viem/chains";
import { cfaForwarderAbi } from "../../../lib/abi/cfaForwarder";

export async function POST(
  req: NextRequest
): Promise<NextResponse<TransactionTargetResponse>> {
  const json = await req.json();

  const frameMessage = await getFrameMessage(json);

  if (!frameMessage) {
    throw new Error("No frame message");
  }

  const SECONDS_IN_MONTH = BigInt(2628000);

  const cfaForwarderAddress = "0xcfA132E353cB4E398080B9700609bb008eceB125";
  const superappAddress = "0x5D256D8280Df9630BfEC7f4882659a8e1E809C6a";
  const degenxAddress = "0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad";
  const monthlyFlowRate = parseEther("1"); // 1 DEGENx per month
  const flowRate = monthlyFlowRate / SECONDS_IN_MONTH; // 380517503805 wei per second

  const createFlowCalldata = encodeFunctionData({
    abi: cfaForwarderAbi,
    functionName: "createFlow",
    args: [
      degenxAddress,
      frameMessage.connectedAddress,
      superappAddress,
      flowRate,
      "0x",
    ],
  });

  const publicClient = createPublicClient({
    chain: degen,
    transport: http("https://rpc.degen.tips"),
  });

  return NextResponse.json({
    chainId: "eip155:666666666",
    method: "eth_sendTransaction",
    params: {
      abi: cfaForwarderAbi as Abi,
      to: cfaForwarderAddress,
      data: createFlowCalldata,
    },
  });
}
