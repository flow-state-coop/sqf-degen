import { Button } from "frames.js/next";
import { frames } from "../../../frames";
import { NextRequest } from "next/server";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const apolloClient = new ApolloClient({
  uri: "https://api.streaming.fund/graphql",
  cache: new InMemoryCache(),
});

const handler = async (req: NextRequest) => {
  const url = new URL(req.url);

  const pathSegments = url.pathname.split("/");

  const address = pathSegments.length > 3 ? pathSegments[3] || "" : "";
  const pool = pathSegments.length > 4 ? pathSegments[4] || "" : "";

  const { data: queryRes } = await apolloClient.query({
    query: gql`
      query Recipient($pool: String!, $address: String!) {
        recipient(id: $address, poolId: $pool, chainId: 666666666) {
          metadata
          superappAddress
        }
      }
    `,
    variables: {
      pool,
      address,
    },
  });

  // console.log(queryRes.recipient);
  return await frames(async (ctx) => {
    return {
      image: (
        <span tw='flex flex-col px-10'>
          <h3>Streaming QF- Degen Builders Round</h3>
          <h3>{queryRes.recipient.metadata.title}</h3>
          <p>
            Open a $DEGEN donation stream that's matched with quadratic funding.
          </p>
          <p>
            The more DEGENS that donate, the higher the matching multiplier!
          </p>
        </span>
      ),
      textInput: "Monthly Value (Requires $DEGENx)",
      buttons: [
        <Button action='link' target={`https://sqf-degen-ui.vercel.app/`}>
          SQF Round Details
        </Button>,
        <Button
          action='tx'
          target={{
            pathname: "/stream/wrapDegen",
          }}
          post_url={`/grantee/` + address + "/" + pool}
        >
          Wrap to DegenX
        </Button>,
        <Button
          action='tx'
          target={{
            pathname: "/stream/donate",
            query: {
              address: address,
              pool: pool,
            },
          }}
          post_url='/stream/success'
        >
          Create Stream
        </Button>,
      ],
      state: { address, pool, amount: ctx.message?.inputText || "" },
    };
  })(req);
};

export const POST = handler;
export const GET = handler;
