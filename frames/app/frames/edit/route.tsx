import { Button } from "frames.js/next";
import { frames } from "../frames";

const handler = frames(async (ctx) => {
  const adress = ctx.adress;
  const pool = ctx.pool;
  const amount = ctx.amount;
  return {
    image: (
      <div tw='flex relative'>
        <h1>Edit Stream</h1>
        <h2>{adress}</h2>
        <h2>{pool}</h2>
        <h2>{amount}</h2>
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

export const POST = handler;
export const GET = handler;
