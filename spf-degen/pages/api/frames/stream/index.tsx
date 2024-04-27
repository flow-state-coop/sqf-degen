/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next/pages-router/server";
import { frames } from "../frames";
import { client } from "../../../../client/client";

const handleRequest = frames(async (ctx) => {
  return {
    image: (
      <>
        <span tw='flex flex-col px-10'>
          <h3>Streaming QF- Degen Builders Round</h3>
          <h1>Grant Name</h1>
          <p>
            Open a $DEGEN donation stream that's matched with quadratic funding.
          </p>
          <p>
            The more DEGENS that donate, the higher the matching multiplier!
          </p>
        </span>
      </>
    ),
    buttons: [
      <Button action='post' target='/'>
        Previous frame
      </Button>,
      <Button action='tx' target='/wrapDegen'>
        Wrap to DegenX
      </Button>,
    ],
  };
});

export default handleRequest;
