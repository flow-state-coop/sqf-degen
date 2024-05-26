import {
  TransactionTargetResponse,
  getFrameMessageFromRequestBody,
} from "frames.js";
import { NextRequest, NextResponse } from "next/server";
import {
  Abi,
  createPublicClient,
  encodeFunctionData,
  http,
  parseEther,
} from "viem";
import { degen } from "viem/chains";
import { superTokenAbi } from "../../../lib/abi/superToken";

export async function POST(
  req: NextRequest
): Promise<NextResponse<TransactionTargetResponse>> {
  const json = await req.json();

  const frameMessage = await getFrameMessageFromRequestBody(json);

  const { searchParams } = new URL(req.url);
  // const address = searchParams.get("address");
  // const pool = searchParams.get("pool");
  const amount = searchParams.get("amount") ?? "1";
  // console.log("Amount to wrap", amount);

  if (!frameMessage) {
    throw new Error("No frame message");
  }

  const degenxAddress = "0xda58FA9bfc3D3960df33ddD8D4d762Cf8Fa6F7ad";
  const wrapCalldata = encodeFunctionData({
    abi: superTokenAbi,
    functionName: "upgradeByETH",
  });

  const publicClient = createPublicClient({
    chain: degen,
    transport: http("https://rpc.degen.tips"),
  });

  return NextResponse.json({
    chainId: "eip155:666666666", // Degen Chain
    method: "eth_sendTransaction",
    params: {
      abi: superTokenAbi as Abi,
      to: degenxAddress,
      data: wrapCalldata,
      value: parseEther(amount).toString(),
    },
  });
}
