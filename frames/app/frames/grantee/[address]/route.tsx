import { Button } from "frames.js/next";
import { frames } from "../../frames";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const address = req.url as string;

  return await frames(async (ctx) => {
    console.log(address);
    const path = `/grantee/${address}`;

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
      ],
    };
  })(req);
};
