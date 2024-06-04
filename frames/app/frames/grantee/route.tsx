import { Button } from "frames.js/next";
import { frames } from "../frames";

export const POST = frames(async (ctx) => {
  const seed = ctx;

  return {
    image: (
      <div tw='flex relative'>
        <h1>SQF Funding</h1>
      </div>
    ),
    buttons: [
      <Button action='link' target={`https://sqf-degen-ui.vercel.app/`}>
        Learn about SQF
      </Button>,
      <Button action='post' target={"/grantee/2345"}>
        Check the Multiplier
      </Button>,
    ],
  };
});
