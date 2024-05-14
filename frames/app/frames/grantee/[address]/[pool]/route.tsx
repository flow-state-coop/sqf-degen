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
        <div tw='flex relative'>
          <h1>SQF Funding For.. {address}</h1>
          <h1>Pool.. {pool}</h1>
        </div>
      ),
      buttons: [
        <Button action='post' target='/grantee'>
          Previous frame
        </Button>,
      ],
    };
  })(req);
};

export const POST = handler;
export const GET = handler;
