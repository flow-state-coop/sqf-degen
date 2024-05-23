/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next/pages-router/server";
import { frames } from "../../frames";

const handleRequest = frames(async (ctx) => {
  const { address, pool, amount } = ctx;
  return {
    image: (
      <>
        <span tw='flex flex-col px-10'>
          <h3>Success!</h3>
        </span>
      </>
    ),
    buttons: [
      <Button action='link' target={`https://sqf-degen-ui.vercel.app/`}>
        SQF Round Details
      </Button>,
      <Button action='post' target={`/edit`}>
        Edit Stream
      </Button>,
    ],
    state: { address, pool, amount },
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
