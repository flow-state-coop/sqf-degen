import { Button } from "frames.js/next";
import { frames } from "../../frames";
import { NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);

  const pathSegments = url.pathname.split("/");

  const address = pathSegments[3];

  return await frames(async (ctx) => {
    const path = `frames/grantee/${address}/pool/1`;

    return {
      image: (
        <div tw='flex relative'>
          <h1>SQF Funding For.. {address}</h1>
        </div>
      ),
      buttons: [
        <Button action='post' target='/grantee'>
          Previous frame
        </Button>,
        <Button action='post' target={path}>
          View Details
        </Button>,
      ],
    };
  })(req);
};
export const POST = handler;
export const GET = handler;
