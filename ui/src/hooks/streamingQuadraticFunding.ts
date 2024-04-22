import { useStreamingQuadraticFundingContext } from "../context/StreamingQuadraticFunding";

export default function useStreamingQuadraticFunding() {
  const { recipients, recipientsDetails, gdaPool } =
    useStreamingQuadraticFundingContext();

  return {
    recipients,
    recipientsDetails,
    gdaPool,
  };
}
