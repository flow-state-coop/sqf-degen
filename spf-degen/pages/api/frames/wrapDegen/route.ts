import { NextRequest, NextResponse } from "next/server";
import useSuperfluid from "../../../hooks/superfluid";
import { DEGENX_ADDRESS } from "../../../lib/constants";
import { useEthersSigner } from "../../../hooks/ethersAdapters";

export async function POST(req: NextRequest): Promise<NextResponse<any>> {
  const { wrap, gdaGetFlowRate } = useSuperfluid();

  try {
    const address = useEthersSigner();

    // Get the flow rate
    const degenxAddress = DEGENX_ADDRESS;
    const gdaPoolAddress = "0x...";
    const flowRate = await gdaGetFlowRate(degenxAddress, gdaPoolAddress);

    // Execute the wrap function
    await wrap(flowRate);

    return NextResponse.json({
      status: "success",
      message: `Successfully wrapped ${flowRate} DEGEN into DEGENX.`,
    });
  } catch (error) {
    console.error("Error during the wrapping process:", error);
    return NextResponse.json(
      { error: "Failed to process the wrapping transaction" },
      { status: 500 }
    );
  }
}
