import { TransactionTargetResponse, getFrameMessage } from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import {
  Abi,
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { cfaForwarderAbi } from "../../../lib/abi/cfaForwarder";

const handler = async (req: NextRequest, res: NextResponse) => {
  const json = await req.json();

  const frameMessage = await getFrameMessage(json);
  const { searchParams } = new URL(req.url);

  const address = searchParams.get("address");
  const pool = searchParams.get("pool");
  const amount = frameMessage?.inputText ?? "1";
  const SECONDS_IN_MONTH = BigInt(2628000);

  const cfaForwarderAddress = "0xcfA132E353cB4E398080B9700609bb008eceB125";
  const degenxAddress = "0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad";
  const monthlyFlowRate = parseEther(amount);
  const flowRate = monthlyFlowRate / SECONDS_IN_MONTH;

  const createFlowCalldata = encodeFunctionData({
    abi: cfaForwarderAbi,
    functionName: "createFlow",
    args: [
      degenxAddress,
      frameMessage.connectedAddress,
      address,
      flowRate,
      "0x",
    ],
  });

  return NextResponse.json({
    chainId: "eip155:666666666",
    method: "eth_sendTransaction",
    params: {
      abi: cfaForwarderAbi as Abi,
      to: cfaForwarderAddress,
      data: createFlowCalldata,
      value: "0",
    },
  });
};

export const POST = handler;
export const GET = handler;
