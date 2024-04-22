import { useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Offcanvas from "react-bootstrap/Offcanvas";
import RecipientDetails from "./RecipientDetails";
import EditStream from "./EditStream";
import CloseIcon from "../assets/close.svg";
import { useMediaQuery } from "../hooks/mediaQuery";
import useStreamingQuadraticFunding from "../hooks/streamingQuadraticFunding";
import useSuperfluid from "../hooks/superfluid";
import {
  TransactionPanelState,
  AllocationData,
  MatchingData,
} from "../pages/Index";

export type FundGranteeProps = {
  setTransactionPanelState: React.Dispatch<
    React.SetStateAction<TransactionPanelState>
  >;
  userAllocationData: AllocationData[];
  directAllocationData: AllocationData[];
  matchingData: MatchingData;
  granteeIndex: number;
  name: string;
  image: string;
  website: string;
  social: string;
  granteeAddress: Address;
  description: string;
  recipientId: Address;
};

export default function FundGrantee(props: FundGranteeProps) {
  const {
    granteeAddress,
    name,
    setTransactionPanelState,
    userAllocationData,
    granteeIndex,
  } = props;

  const [newFlowRate, setNewFlowRate] = useState("");

  const { address } = useAccount();
  const { recipients } = useStreamingQuadraticFunding();
  const { editFlow } = useSuperfluid(address);
  const { isMobile, isTablet } = useMediaQuery();

  const closeOffcanvas = () =>
    setTransactionPanelState({
      show: false,
      isMatchingPool: false,
      granteeIndex: null,
    });

  return (
    <Offcanvas
      show
      scroll
      onHide={closeOffcanvas}
      placement={isMobile ? "bottom" : "end"}
      backdrop={false}
      className={`${
        isMobile ? "w-100 h-100" : isTablet ? "w-50" : "w-25"
      } bg-dark px-3 overflow-auto border-0`}
      style={{ top: isMobile ? "auto" : 89, zIndex: isMobile ? "" : 1 }}
    >
      <Stack
        direction="horizontal"
        className="justify-content-between align-items-center py-2 text-white"
      >
        <Card.Text className="fs-3 pe-0 m-0">Fund Grantee</Card.Text>
        <Button
          variant="transparent"
          className="position-absolute end-0 px-2 me-1 py-0"
          onClick={closeOffcanvas}
        >
          <Image src={CloseIcon} alt="close" width={28} />
        </Button>
      </Stack>
      <Stack
        direction="vertical"
        gap={4}
        className="flex-grow-0 rounded-4 text-white pb-3"
      >
        <RecipientDetails
          flowRateToReceiver={userAllocationData[granteeIndex].flowRate}
          {...props}
        />
        <EditStream
          receiver={granteeAddress}
          granteeName={name}
          flowRateToReceiver={userAllocationData[granteeIndex].flowRate}
          newFlowRate={newFlowRate}
          setNewFlowRate={setNewFlowRate}
          isFundingMatchingPool={false}
          getOperation={() =>
            editFlow(
              recipients ? recipients[granteeIndex].superApp : "0x",
              userAllocationData[granteeIndex].flowRate,
              newFlowRate
            )
          }
          {...props}
        />
      </Stack>
    </Offcanvas>
  );
}
