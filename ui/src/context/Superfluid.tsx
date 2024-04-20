import { useEffect, useState, createContext, useContext } from "react";
import { Framework } from "@superfluid-finance/sdk-core";
import { useEthersProvider } from "../hooks/ethersAdapters";
import { NETWORK_ID, SUPERFLUID_RESOLVER_ADDRESS } from "../lib/constants";

export const SuperfluidContext = createContext<{
  sfFramework: Framework | null;
}>({ sfFramework: null });

export function useSuperfluidContext() {
  const context = useContext(SuperfluidContext);

  if (!context) {
    throw Error("Superfluid context was not found");
  }

  return context;
}

export default function SuperfluidContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sfFramework, setSfFramework] = useState<Framework | null>(null);

  const ethersProvider = useEthersProvider();

  useEffect(() => {
    (async () => {
      if (ethersProvider) {
        const sfFramework = await Framework.create({
          chainId: NETWORK_ID,
          resolverAddress: SUPERFLUID_RESOLVER_ADDRESS,
          provider: ethersProvider,
        });

        setSfFramework(sfFramework);
      }
    })();
  }, [ethersProvider]);

  return (
    <SuperfluidContext.Provider
      value={{
        sfFramework,
      }}
    >
      {children}
    </SuperfluidContext.Provider>
  );
}
