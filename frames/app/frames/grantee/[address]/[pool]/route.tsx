import { Button } from "frames.js/next";
import { frames } from "../../../frames";
import { NextRequest } from "next/server";

interface State {
  address: string;
  pool: number;
}

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);

  const pathSegments = url.pathname.split("/");

  const address = pathSegments.length > 3 ? pathSegments[3] || "" : "";
  const poolString = pathSegments.length > 4 ? pathSegments[4] : undefined;

  const pool = poolString ? parseInt(poolString, 10) : 0;
  if (isNaN(pool)) {
    console.error("Failed to parse pool number from URL, using default of 0");
  }

  return await frames(async (ctx) => {
    // Since we provide empty string fallbacks, address and pool are guaranteed to be strings here.
    const newState: State = { ...ctx.state, address, pool };

    return {
      image: (
        <span tw='flex flex-col px-10'>
          <h3>Streaming QF- Degen Builders Round</h3>
          <h3>
            SQF Funding For: {address} Pool: {pool}
          </h3>
          <p>
            Open a $DEGEN donation stream that's matched with quadratic funding.
          </p>
          <p>
            The more DEGENS that donate, the higher the matching multiplier!
          </p>
        </span>
      ),
      buttons: [
        <Button action='link' target={`https://sqf-degen-ui.vercel.app/`}>
          SQF Round Details
        </Button>,
        <Button action='tx' target='/stream/wrapDegen' post_url='/stream/'>
          Wrap to DegenX
        </Button>,
        <Button
          action='tx'
          target={{
            pathname: "/stream/donate",
            query: { address: address, pool: pool },
          }}
          post_url='/stream/success'
        >
          Donate
        </Button>,
      ],
      state: newState,
    };
  })(req);
};

export const POST = handler;
export const GET = handler;
