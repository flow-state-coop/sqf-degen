import { createPublicClient, http } from "viem";
import { degen } from "viem/chains";

export const client = createPublicClient({
  chain: degen,
  transport: http(),
});
