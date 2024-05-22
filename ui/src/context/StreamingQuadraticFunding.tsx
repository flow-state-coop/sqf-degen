import { useEffect, useState, createContext, useContext } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { createVerifiedFetch } from "@helia/verified-fetch";
import { recipientIds } from "../lib/recipientIds";
import { streamingQuadraticFundingAbi } from "../lib/abi/streamingQuadraticFunding";
import {
  STREAMING_QUADRATIC_FUNDING_ADDRESS,
  GDA_POOL_ADDRESS,
  IPFS_GATEWAYS,
} from "../lib/constants";

export type Recipient = {
  recipientAddress: Address;
  superApp: Address;
  metadata: Metadata;
};

export type Metadata = {
  protocol: bigint;
  pointer: string;
};

export type RecipientDetails = {
  name: string;
  description: string;
  image: string;
  website: string;
  social: string;
};

export const StreamingQuadraticFundingContext = createContext<{
  recipients: Recipient[] | null;
  recipientsDetails: RecipientDetails[] | null;
  gdaPool: Address | null;
} | null>(null);

export function useStreamingQuadraticFundingContext() {
  const context = useContext(StreamingQuadraticFundingContext);

  if (!context) {
    throw Error("Streaming Quadratic Funding context was not found");
  }

  return context;
}

export function StreamingQuadraticFundingContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [recipientsDetails, setRecipientsDetails] = useState<
    RecipientDetails[] | null
  >(null);
  const [gdaPool, setGdaPool] = useState<Address | null>(null);

  const publicClient = usePublicClient();

  useEffect(() => {
    (async () => {
      const res = await publicClient.multicall({
        contracts: recipientIds.map((recipientId) => {
          return {
            address: STREAMING_QUADRATIC_FUNDING_ADDRESS,
            abi: streamingQuadraticFundingAbi,
            functionName: "getRecipient",
            args: [recipientId],
          };
        }),
      });

      if (res.every((elem) => elem.status !== "success")) {
        throw Error("Recipients not found");
      }

      const recipients = res.map((elem: any, i) => {
        return { ...elem.result, id: recipientIds[i] };
      });

      shuffle(recipients as Recipient[]);

      const recipientsDetails = [];
      const emptyRecipientDetails = {
        name: "",
        description: "",
        image: "",
        website: "",
        social: "",
      };

      for (const recipient of recipients) {
        const pointer = recipient?.metadata?.pointer;

        if (pointer) {
          try {
            const verifiedFetch = await createVerifiedFetch({
              gateways: IPFS_GATEWAYS,
            });
            const detailsRes = await verifiedFetch(`ipfs://${pointer}`);

            const { title, description, logoImg, website, projectTwitter } =
              await detailsRes.json();

            const imageRes = await verifiedFetch(`ipfs://${logoImg}`);
            const imageBlob = await imageRes.blob();

            recipientsDetails.push({
              name: title,
              description,
              image: URL.createObjectURL(imageBlob),
              website,
              social: `https://twitter.com/${projectTwitter}`,
            });
          } catch (err) {
            recipientsDetails.push(emptyRecipientDetails);
            console.error(err);
          }
        } else {
          recipientsDetails.push(emptyRecipientDetails);
        }
      }

      setRecipients(recipients as Recipient[]);
      setRecipientsDetails(recipientsDetails);
      setGdaPool(GDA_POOL_ADDRESS as Address);
    })();
  }, []);

  const shuffle = (recipients: Recipient[]) => {
    for (let i = recipients.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
  };

  return (
    <StreamingQuadraticFundingContext.Provider
      value={{
        recipients,
        recipientsDetails,
        gdaPool,
      }}
    >
      {children}
    </StreamingQuadraticFundingContext.Provider>
  );
}
