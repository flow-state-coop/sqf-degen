import { Button } from "frames.js/next";
import { frames } from "../../frames";

export const POST = frames(async (ctx) => {
  const seed = ctx;

  return {
    image: (
      <div tw='flex relative'>
        <h1>SQF Funding</h1>
      </div>
    ),
    buttons: [
      <Button action='post' target='/'>
        Previous frame
      </Button>,
    ],
  };
});
