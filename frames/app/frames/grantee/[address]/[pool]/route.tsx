import { Button } from "frames.js/next";
import { frames } from "../../../frames";
import { NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);

  const pathSegments = url.pathname.split("/");

  const address = pathSegments[3];
  const pool = pathSegments[4];

  return await frames(async (ctx) => {
    const path = `/grantee/${address}`;

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
        <Button action='tx' target='/stream/donate' post_url='/stream/success'>
          Donate
        </Button>,
      ],
    };
  })(req);
};

export const POST = handler;
export const GET = handler;
