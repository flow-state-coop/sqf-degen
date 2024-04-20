import { useState, useMemo, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { formatEther, parseEther, formatUnits } from "viem";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { Operation } from "@superfluid-finance/sdk-core";
import Accordion from "react-bootstrap/Accordion";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import Tooltip from "react-bootstrap/Tooltip";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import ConnectWallet from "./ConnectWallet";
import CopyTooltip from "./CopyTooltip";
import InfoIcon from "../assets/info.svg";
import DegenLogo from "../assets/degen-white.svg";
import DoneIcon from "../assets/done.svg";
import XIcon from "../assets/x-logo.svg";
import LensIcon from "../assets/lens.svg";
import FarcasterIcon from "../assets/farcaster.svg";
import ArrowDownIcon from "../assets/arrow-down.svg";
import ArrowForwardIcon from "../assets/arrow-forward.svg";
import CopyIcon from "../assets/copy-light.svg";
import AddIcon from "../assets/add.svg";
import RemoveIcon from "../assets/remove.svg";
import { MatchingData } from "../pages/Index";
import useFlowingAmount from "../hooks/flowingAmount";
import useSuperfluid from "../hooks/superfluid";
import useTransactionsQueue from "../hooks/transactionsQueue";
import useStreamingQuadraticFunding from "../hooks/streamingQuadraticFunding";
import useRoundQuery from "../hooks/roundQuery";
import { calcMatchingImpactEstimate } from "../lib/matchingImpactEstimate";
import {
  TimeInterval,
  unitOfTime,
  isNumber,
  fromTimeUnitsToSeconds,
  truncateStr,
  roundWeiAmount,
  convertStreamValueToInterval,
  absBigInt,
  formatNumberWithCommas,
  extractTwitterHandle,
} from "../lib/utils";
import { DEGENX_ADDRESS } from "../lib/constants";

interface EditStreamProps {
  granteeName: string;
  granteeIndex: number | null;
  matchingData?: MatchingData;
  receiver: string;
  flowRateToReceiver: string;
  newFlowRate: string;
  setNewFlowRate: React.Dispatch<React.SetStateAction<string>>;
  getOperation: () => Operation;
  isFundingMatchingPool: boolean;
}

type TransactionDetailsSnapshot = {
  wrapAmount?: string;
  underlyingTokenBalance?: string;
  superTokenBalance: bigint;
  liquidationEstimate: number | null;
  amountPerTimeInterval: string;
  netImpact: bigint;
  newFlowRate: string;
  flowRateToReceiver: string;
};

export enum Step {
  SELECT_AMOUNT = "Edit stream",
  WRAP = "Wrap to Super Token",
  TOP_UP = "Top up required tokens",
  REVIEW = "Review",
  SUCCESS = "Success!",
}

dayjs().format();
dayjs.extend(duration);

export default function EditStream(props: EditStreamProps) {
  const {
    granteeName,
    granteeIndex,
    matchingData,
    flowRateToReceiver,
    newFlowRate,
    setNewFlowRate,
    getOperation,
    isFundingMatchingPool,
    receiver,
  } = props;

  const [wrapAmount, setWrapAmount] = useState<string | null>(null);
  const [step, setStep] = useState(Step.SELECT_AMOUNT);
  const [amountPerTimeInterval, setAmountPerTimeInterval] = useState("");
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(
    TimeInterval.MONTH
  );
  const [transactionDetailsSnapshot, setTransactionDetailsSnapshot] =
    useState<TransactionDetailsSnapshot | null>(null);

  const { address } = useAccount();
  const { recipientsDetails } = useStreamingQuadraticFunding();
  const { userTokenSnapshots } = useRoundQuery(address);
  const { wrap, execOperation } = useSuperfluid(address);
  const userTokenSnapshot = userTokenSnapshots?.filter(
    (snapshot) => snapshot.token === DEGENX_ADDRESS.toLowerCase()
  )[0];
  const accountFlowRate = userTokenSnapshot?.totalNetFlowRate ?? "0";
  const superTokenBalance = useFlowingAmount(
    BigInt(userTokenSnapshot?.balanceUntilUpdatedAt ?? 0),
    userTokenSnapshot?.updatedAtTimestamp ?? 0,
    BigInt(accountFlowRate)
  );
  const { data: underlyingTokenBalance } = useBalance({
    address,
    cacheTime: 10000,
    staleTime: 10000,
    watch: true,
  });
  const { data: degenBalance } = useBalance({
    address,
    cacheTime: 10000,
    staleTime: 10000,
    watch: true,
  });
  const {
    areTransactionsLoading,
    completedTransactions,
    transactionError,
    executeTransactions,
  } = useTransactionsQueue();

  const minDegenBalance = 0.001;
  const suggestedTokenBalance = newFlowRate
    ? BigInt(newFlowRate) *
      BigInt(fromTimeUnitsToSeconds(1, unitOfTime[TimeInterval.MONTH])) *
      BigInt(2)
    : BigInt(0);
  const hasSufficientDegenBalance =
    degenBalance && degenBalance.value > parseEther(minDegenBalance.toString());
  const hasSuggestedTokenBalance =
    underlyingTokenBalance &&
    (underlyingTokenBalance.value > suggestedTokenBalance ||
      superTokenBalance > suggestedTokenBalance)
      ? true
      : false;
  const superTokenSymbol = "DEGENx";
  const superTokenIcon = DegenLogo;
  const underlyingTokenName = "DEGEN";
  const isDeletingStream =
    BigInt(flowRateToReceiver) > 0 && BigInt(newFlowRate) <= 0;

  const liquidationEstimate = useMemo(() => {
    if (address) {
      const newFlowRate =
        parseEther(amountPerTimeInterval.replace(/,/g, "")) /
        BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval]));

      if (
        BigInt(-accountFlowRate) -
          BigInt(flowRateToReceiver) +
          BigInt(newFlowRate) >
        BigInt(0)
      ) {
        const updatedAtTimestamp = userTokenSnapshot
          ? userTokenSnapshot.updatedAtTimestamp * 1000
          : Date.now();
        const date = dayjs(new Date(updatedAtTimestamp));

        return date
          .add(
            dayjs.duration({
              seconds: Number(
                (BigInt(userTokenSnapshot?.balanceUntilUpdatedAt ?? "0") +
                  parseEther(wrapAmount?.replace(/,/g, "") ?? "0")) /
                  (BigInt(-accountFlowRate) -
                    BigInt(flowRateToReceiver) +
                    BigInt(newFlowRate))
              ),
            })
          )
          .unix();
      }
    }

    return null;
  }, [
    userTokenSnapshot,
    accountFlowRate,
    address,
    wrapAmount,
    flowRateToReceiver,
    amountPerTimeInterval,
    timeInterval,
  ]);

  const netImpact = useMemo(() => {
    if (granteeIndex === null || !matchingData) {
      return BigInt(0);
    }

    return calcMatchingImpactEstimate({
      totalFlowRate: BigInt(matchingData.flowRate),
      totalUnits: BigInt(matchingData.totalUnits),
      granteeUnits: BigInt(matchingData.members[granteeIndex].units),
      granteeFlowRate: BigInt(matchingData.members[granteeIndex].flowRate),
      previousFlowRate: BigInt(flowRateToReceiver ?? 0),
      newFlowRate: BigInt(newFlowRate ?? 0),
    });
  }, [newFlowRate, flowRateToReceiver, matchingData, granteeIndex]);

  const transactions = useMemo(() => {
    if (!address) {
      return [];
    }

    const wrapAmountWei = parseEther(wrapAmount?.replace(/,/g, "") ?? "0");
    const transactions: (() => Promise<void>)[] = [];

    if (wrapAmount && Number(wrapAmount?.replace(/,/g, "")) > 0) {
      transactions.push(async () => await wrap(wrapAmountWei.toString()));
    }

    transactions.push(async () => await execOperation(getOperation()));

    return transactions;
  }, [address, wrapAmount, newFlowRate]);

  useEffect(() => {
    (async () => {
      const currentStreamValue = roundWeiAmount(
        BigInt(flowRateToReceiver) *
          BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval])),
        4
      );

      setAmountPerTimeInterval(
        formatNumberWithCommas(parseFloat(currentStreamValue))
      );
    })();
  }, [address, receiver, flowRateToReceiver]);

  useEffect(() => {
    if (!areTransactionsLoading && amountPerTimeInterval) {
      if (
        Number(amountPerTimeInterval.replace(/,/g, "")) > 0 &&
        liquidationEstimate &&
        dayjs
          .unix(liquidationEstimate)
          .isBefore(dayjs().add(dayjs.duration({ months: 2 })))
      ) {
        setWrapAmount(
          formatNumberWithCommas(
            parseFloat(
              formatEther(
                parseEther(amountPerTimeInterval.replace(/,/g, "")) * BigInt(2)
              )
            )
          )
        );
      } else {
        setWrapAmount("");
      }

      setNewFlowRate(
        (
          parseEther(amountPerTimeInterval.replace(/,/g, "")) /
          BigInt(fromTimeUnitsToSeconds(1, unitOfTime[timeInterval]))
        ).toString()
      );
    }
  }, [amountPerTimeInterval, timeInterval]);

  const handleAmountStepping = (stepping: { increment: boolean }) => {
    const { increment } = stepping;

    if (amountPerTimeInterval === "") {
      setAmountPerTimeInterval(increment ? "1" : "0");
    } else if (isNumber(amountPerTimeInterval.replace(/,/g, ""))) {
      const amount = parseFloat(amountPerTimeInterval.replace(/,/g, ""));

      setAmountPerTimeInterval(
        `${formatNumberWithCommas(
          increment ? amount + 1 : amount - 1 <= 0 ? 0 : amount - 1
        )}`
      );
    }
  };

  const handleAmountSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    setAmount: (value: string) => void
  ) => {
    const { value } = e.target;
    const valueWithoutCommas = value.replace(/,/g, "");

    if (isNumber(valueWithoutCommas)) {
      setAmount(
        `${
          isFundingMatchingPool && parseFloat(valueWithoutCommas) < 1000
            ? value
            : formatNumberWithCommas(parseFloat(valueWithoutCommas))
        }`
      );
    } else if (value === "") {
      setAmount("");
    } else if (value === ".") {
      setAmount(isFundingMatchingPool ? "0." : "0");
    }
  };

  const handleSubmit = async () => {
    setTransactionDetailsSnapshot({
      wrapAmount: wrapAmount?.replace(/,/g, ""),
      underlyingTokenBalance: underlyingTokenBalance?.formatted,
      superTokenBalance: superTokenBalance,
      liquidationEstimate: liquidationEstimate,
      amountPerTimeInterval: amountPerTimeInterval.replace(/,/g, ""),
      netImpact: netImpact,
      newFlowRate: newFlowRate,
      flowRateToReceiver: flowRateToReceiver,
    });

    await executeTransactions(transactions);

    setStep(Step.SUCCESS);
    setTransactionDetailsSnapshot(null);
  };

  const calcMatchingMultiplier = (
    netImpact: bigint,
    newFlowRate: string,
    flowRateToReceiver: string
  ) =>
    parseFloat(
      (
        Number(absBigInt(netImpact)) /
        Number(absBigInt(BigInt(newFlowRate) - BigInt(flowRateToReceiver)))
      ).toFixed(2)
    );

  return (
    <>
      <Accordion activeKey={step}>
        <Card className="bg-blue text-white rounded-0 rounded-top-4 border-0 border-bottom border-purple">
          <Button
            variant="transparent"
            className="d-flex align-items-center gap-2 p-3 text-white border-0 rounded-0 shadow-none"
            style={{
              pointerEvents: step === Step.SELECT_AMOUNT ? "none" : "auto",
            }}
            onClick={() => setStep(Step.SELECT_AMOUNT)}
          >
            <Badge
              pill
              as="div"
              className={`d-flex justify-content-center p-0 ${
                step !== Step.SELECT_AMOUNT ? "bg-info" : "bg-aqua"
              }`}
              style={{
                width: 20,
                height: 20,
              }}
            >
              {step !== Step.SELECT_AMOUNT ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="m-auto text-blue">1</Card.Text>
              )}
            </Badge>
            {Step.SELECT_AMOUNT}
          </Button>
          <Accordion.Collapse
            eventKey={Step.SELECT_AMOUNT}
            className="p-3 pt-0"
          >
            <Stack gap={3}>
              <Stack direction="horizontal" gap={2}>
                <Badge className="d-flex align-items-center gap-1 bg-purple w-50 rounded-3 px-3 py-2 fs-4 fw-normal">
                  <Image src={DegenLogo} alt="degen chain" width={18} />
                  Degen Chain
                </Badge>
                <Badge className="d-flex align-items-center gap-1 bg-purple w-50 rounded-3 px-3 py-2 fs-4 fw-normal">
                  <Image
                    src={superTokenIcon}
                    alt="degenchain"
                    width={isFundingMatchingPool ? 12 : 18}
                  />
                  {superTokenSymbol}
                </Badge>
              </Stack>
              <Stack direction="horizontal" gap={2}>
                <Stack direction="horizontal" className="w-50">
                  <Form.Control
                    type="text"
                    placeholder="0"
                    disabled={!address || !flowRateToReceiver}
                    value={amountPerTimeInterval}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAmountSelection(e, setAmountPerTimeInterval)
                    }
                    className={`bg-purple border-0 rounded-3 ${
                      isFundingMatchingPool ? "" : "rounded-end-0"
                    } text-white shadow-none`}
                  />
                  {!isFundingMatchingPool && (
                    <>
                      <Button
                        disabled={!address || !flowRateToReceiver}
                        variant="purple"
                        className="d-flex align-items-center border-0 rounded-0 fs-4 px-1 py-2"
                        onClick={() =>
                          handleAmountStepping({ increment: false })
                        }
                      >
                        <Image src={RemoveIcon} alt="remove" width={20} />
                      </Button>
                      <Button
                        disabled={!address || !flowRateToReceiver}
                        variant="purple"
                        className="d-flex align-items-center border-0 rounded-0 rounded-end-3 fs-4 px-1 py-2"
                        onClick={() =>
                          handleAmountStepping({ increment: true })
                        }
                      >
                        <Image src={AddIcon} alt="add" width={20} />
                      </Button>
                    </>
                  )}
                </Stack>
                <Dropdown className="w-50">
                  <Dropdown.Toggle
                    variant="blue"
                    className="d-flex justify-content-between align-items-center w-100 bg-purple border-0 rounded-3 fs-4"
                  >
                    {timeInterval}
                  </Dropdown.Toggle>
                  <Dropdown.Menu variant="dark" className="bg-purple">
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval.replace(/,/g, "")),
                            timeInterval,
                            TimeInterval.DAY
                          )
                        );
                        setTimeInterval(TimeInterval.DAY);
                      }}
                    >
                      {TimeInterval.DAY}
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval.replace(/,/g, "")),
                            timeInterval,
                            TimeInterval.WEEK
                          )
                        );
                        setTimeInterval(TimeInterval.WEEK);
                      }}
                    >
                      {TimeInterval.WEEK}
                    </Dropdown.Item>
                    <Dropdown.Item
                      className="text-white"
                      onClick={() => {
                        setAmountPerTimeInterval(
                          convertStreamValueToInterval(
                            parseEther(amountPerTimeInterval.replace(/,/g, "")),
                            timeInterval,
                            TimeInterval.MONTH
                          )
                        );
                        setTimeInterval(TimeInterval.MONTH);
                      }}
                    >
                      {TimeInterval.MONTH}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Stack>
              {address ? (
                <Button
                  variant={isDeletingStream ? "danger" : "success"}
                  disabled={
                    !amountPerTimeInterval ||
                    Number(amountPerTimeInterval.replace(/,/g, "")) < 0 ||
                    (BigInt(flowRateToReceiver) === BigInt(0) &&
                      Number(amountPerTimeInterval.replace(/,/g, "")) === 0) ||
                    newFlowRate === flowRateToReceiver
                  }
                  className="py-1 rounded-3 text-white"
                  onClick={() =>
                    setStep(
                      !hasSufficientDegenBalance || !hasSuggestedTokenBalance
                        ? Step.TOP_UP
                        : wrapAmount ||
                          superTokenBalance <
                            BigInt(newFlowRate) *
                              BigInt(
                                fromTimeUnitsToSeconds(1, TimeInterval.DAY)
                              )
                        ? Step.WRAP
                        : Step.REVIEW
                    )
                  }
                >
                  {isDeletingStream ? "Cancel Stream" : "Continue"}
                </Button>
              ) : (
                <ConnectWallet />
              )}
            </Stack>
          </Accordion.Collapse>
        </Card>
        <Card className="bg-blue text-white rounded-0 border-0 border-bottom border-purple">
          <Button
            variant="transparent"
            className="d-flex align-items-center gap-2 p-3 border-0 rounded-0 text-white shadow-none"
            onClick={() => setStep(Step.WRAP)}
            style={{
              pointerEvents: step === Step.REVIEW ? "auto" : "none",
            }}
          >
            <Badge
              pill
              as="div"
              className={`d-flex justify-content-center p-0
                    ${
                      step === Step.SELECT_AMOUNT || step === Step.TOP_UP
                        ? "bg-secondary"
                        : step === Step.WRAP
                        ? "bg-aqua"
                        : "bg-info"
                    }`}
              style={{
                width: 20,
                height: 20,
              }}
            >
              {step === Step.REVIEW || step === Step.SUCCESS ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="m-auto text-blue">2</Card.Text>
              )}
            </Badge>
            {Step.WRAP}
          </Button>
          <Accordion.Collapse eventKey={Step.WRAP} className="p-3 pt-0">
            <Stack direction="vertical" gap={3}>
              <Stack direction="vertical" className="position-relative">
                <Stack
                  direction="horizontal"
                  gap={2}
                  className="w-100 bg-purple p-2 rounded-4 rounded-bottom-0"
                >
                  <Form.Control
                    type="text"
                    placeholder="0"
                    disabled={!address}
                    value={wrapAmount ?? ""}
                    className="bg-purple w-75 border-0 text-white shadow-none"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAmountSelection(e, setWrapAmount)
                    }
                  />
                  <Badge
                    as="div"
                    className="d-flex justify-content-center align-items-center w-25 gap-1 bg-dark py-2 border border-dark rounded-3"
                  >
                    <Image
                      src={superTokenIcon}
                      alt="done"
                      width={isFundingMatchingPool ? 10 : 18}
                    />
                    <Card.Text className="p-0">{underlyingTokenName}</Card.Text>
                  </Badge>
                </Stack>
                <Card.Text className="w-100 bg-purple m-0 mb-2 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                  Balance:{" "}
                  {underlyingTokenBalance
                    ? underlyingTokenBalance.formatted.slice(0, 8)
                    : ""}
                </Card.Text>
                <Badge
                  pill
                  className="position-absolute top-50 start-50 translate-middle bg-dark p-1"
                >
                  <Image src={ArrowDownIcon} alt="downward arrow" width={22} />
                </Badge>
                <Stack
                  direction="horizontal"
                  gap={2}
                  className="w-100 bg-purple p-2 rounded-4 rounded-bottom-0"
                >
                  <Form.Control
                    type="text"
                    placeholder="0"
                    disabled={!address}
                    value={wrapAmount ?? ""}
                    className="bg-purple w-75 border-0 text-white shadow-none"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleAmountSelection(e, setWrapAmount)
                    }
                  />
                  <Badge
                    as="div"
                    className="d-flex justify-content-center align-items-center gap-1 w-25 bg-dark py-2 border border-dark rounded-3"
                  >
                    <Image
                      src={superTokenIcon}
                      alt="done"
                      width={isFundingMatchingPool ? 10 : 18}
                    />
                    <Card.Text className="p-0">{superTokenSymbol}</Card.Text>
                  </Badge>
                </Stack>
                <Card.Text className="w-100 bg-purple m-0 px-2 pb-2 rounded-bottom-4 text-end fs-5">
                  Balance: {formatEther(superTokenBalance).slice(0, 8)}
                </Card.Text>
              </Stack>
              {underlyingTokenBalance &&
                wrapAmount &&
                Number(
                  formatUnits(
                    underlyingTokenBalance.value,
                    underlyingTokenBalance.decimals
                  )
                ) < Number(wrapAmount.replace(/,/g, "")) && (
                  <Alert variant="danger" className="m-0">
                    Insufficient Balance
                  </Alert>
                )}
              <Stack direction="horizontal" gap={2}>
                <OverlayTrigger
                  overlay={
                    <Tooltip id="t-skip-wrap" className="fs-6">
                      You can skip wrapping if you already have an{" "}
                      {superTokenSymbol}
                      balance.
                    </Tooltip>
                  }
                >
                  <Button
                    variant="primary"
                    disabled={superTokenBalance <= BigInt(0)}
                    className="w-50 py-1 rounded-3 text-white"
                    onClick={() => {
                      setWrapAmount("");
                      setStep(Step.REVIEW);
                    }}
                  >
                    Skip
                  </Button>
                </OverlayTrigger>
                <Button
                  variant="success"
                  disabled={
                    !underlyingTokenBalance ||
                    !wrapAmount ||
                    Number(wrapAmount.replace(/,/g, "")) === 0 ||
                    Number(
                      formatUnits(
                        underlyingTokenBalance.value,
                        underlyingTokenBalance.decimals
                      )
                    ) < Number(wrapAmount.replace(/,/g, ""))
                  }
                  className="w-50 py-1 rounded-3 text-white"
                  onClick={() => setStep(Step.REVIEW)}
                >
                  Continue
                </Button>
              </Stack>
            </Stack>
          </Accordion.Collapse>
        </Card>
        <Card className="bg-blue text-white rounded-0 rounded-bottom-4 border-0">
          <Button
            variant="transparent"
            className="d-flex align-items-center gap-2 p-3 border-0 rounded-0 text-white shadow-none"
            style={{
              pointerEvents: "none",
            }}
            onClick={() => setStep(Step.REVIEW)}
          >
            <Badge
              pill
              className={`d-flex justify-content-center p-0 ${
                step !== Step.REVIEW && step !== Step.SUCCESS
                  ? "bg-secondary"
                  : step === Step.SUCCESS
                  ? "bg-info"
                  : "bg-aqua"
              }`}
              style={{
                width: 20,
                height: 20,
              }}
            >
              {step === Step.SUCCESS ? (
                <Image src={DoneIcon} alt="done" width={16} />
              ) : (
                <Card.Text className="m-auto text-blue">3</Card.Text>
              )}
            </Badge>
            {Step.REVIEW}
          </Button>
          <Accordion.Collapse eventKey={Step.REVIEW} className="p-3 pt-0">
            <Stack direction="vertical" gap={2}>
              {Number(wrapAmount?.replace(/,/g, "")) > 0 && (
                <Stack direction="vertical" gap={1}>
                  <Card.Text className="border-bottom border-secondary mb-2 pb-1 text-secondary">
                    A. Wrap Tokens
                  </Card.Text>
                  <Stack
                    direction="horizontal"
                    gap={1}
                    className="position-relative"
                  >
                    <Stack
                      direction="vertical"
                      gap={2}
                      className="justify-content-center align-items-center bg-purple p-2 rounded-4"
                    >
                      <Image
                        src={superTokenIcon}
                        alt="done"
                        width={isFundingMatchingPool ? 16 : 28}
                      />
                      <Card.Text className="m-0 border-0 text-center text-white fs-5">
                        {areTransactionsLoading && transactionDetailsSnapshot
                          ? transactionDetailsSnapshot.wrapAmount
                          : wrapAmount}{" "}
                        <br /> {underlyingTokenName}
                      </Card.Text>
                      <Card.Text className="border-0 text-center text-white fs-6">
                        New Balance:{" "}
                        {(
                          Number(
                            areTransactionsLoading && transactionDetailsSnapshot
                              ? transactionDetailsSnapshot.underlyingTokenBalance
                              : underlyingTokenBalance?.formatted
                          ) -
                          Number(
                            areTransactionsLoading && transactionDetailsSnapshot
                              ? transactionDetailsSnapshot.wrapAmount
                              : wrapAmount?.replace(/,/g, "")
                          )
                        )
                          .toString()
                          .slice(0, 8)}
                      </Card.Text>
                    </Stack>
                    <Image
                      className="bg-transparent"
                      src={ArrowForwardIcon}
                      alt="forward arrow"
                      width={30}
                    />
                    <Stack
                      direction="vertical"
                      gap={2}
                      className="justify-content-center align-items-center bg-purple p-2 rounded-4"
                    >
                      <Image
                        src={superTokenIcon}
                        alt="done"
                        width={isFundingMatchingPool ? 16 : 28}
                      />
                      <Card.Text className="m-0 border-0 text-center text-white fs-5">
                        {areTransactionsLoading && transactionDetailsSnapshot
                          ? transactionDetailsSnapshot.wrapAmount
                          : wrapAmount}{" "}
                        <br /> {superTokenSymbol}
                      </Card.Text>
                      <Card.Text className="border-0 text-center text-white fs-6">
                        New Balance:{" "}
                        {areTransactionsLoading &&
                        transactionDetailsSnapshot?.wrapAmount
                          ? formatEther(
                              transactionDetailsSnapshot.superTokenBalance +
                                parseEther(
                                  transactionDetailsSnapshot.wrapAmount
                                )
                            ).slice(0, 8)
                          : formatEther(
                              superTokenBalance +
                                parseEther(wrapAmount?.replace(/,/g, "") ?? "0")
                            ).slice(0, 8)}
                      </Card.Text>
                    </Stack>
                  </Stack>
                  <Card.Text className="border-0 text-center text-gray fs-4">
                    1 {underlyingTokenName} = 1 {superTokenSymbol}
                  </Card.Text>
                </Stack>
              )}
              <Stack direction="vertical" gap={1}>
                <Card.Text className="border-bottom border-secondary m-0 pb-1 text-secondary">
                  {Number(
                    areTransactionsLoading && transactionDetailsSnapshot
                      ? transactionDetailsSnapshot.wrapAmount
                      : wrapAmount?.replace(/,/g, "")
                  ) > 0
                    ? "B."
                    : "A."}{" "}
                  Edit stream
                </Card.Text>
              </Stack>
              <Stack
                direction="horizontal"
                className="justify-content-around px-2"
              >
                <Card.Text className="m-0 border-0 text-center text-white fs-4">
                  Sender
                </Card.Text>
                <Card.Text className="m-0 border-0 text-center text-white fs-4">
                  Receiver
                </Card.Text>
              </Stack>
              <Stack direction="horizontal">
                <Badge className="d-flex justify-content-around align-items-center w-50 bg-purple py-3 rounded-3 border-0 text-center text-white fs-5">
                  {truncateStr(address ?? "", 12)}
                  <CopyTooltip
                    contentClick="Address copied"
                    contentHover="Copy address"
                    handleCopy={() =>
                      navigator.clipboard.writeText(address ?? "")
                    }
                    target={<Image src={CopyIcon} alt="copy" width={18} />}
                  />
                </Badge>
                <Image
                  className="bg-transparent"
                  src={ArrowForwardIcon}
                  alt="forward arrow"
                  width={30}
                />
                <Badge className="d-flex justify-content-around align-items-center w-50 bg-purple px-2 py-3 rounded-3 border-0 text-center text-white fs-5">
                  {truncateStr(receiver, 12)}
                  <CopyTooltip
                    contentClick="Address copied"
                    contentHover="Copy address"
                    handleCopy={() => navigator.clipboard.writeText(receiver)}
                    target={<Image src={CopyIcon} alt="copy" width={18} />}
                  />
                </Badge>
              </Stack>
              <Stack direction="vertical">
                <Stack
                  direction="horizontal"
                  className={`mt-2 bg-purple p-2 ${
                    !isFundingMatchingPool ? "rounded-top-4" : "rounded-4"
                  }`}
                >
                  <Card.Text className="m-0 fs-5">New Stream</Card.Text>
                  <Stack
                    direction="horizontal"
                    gap={1}
                    className="justify-content-end w-50 ms-2 p-2"
                  >
                    <Image
                      src={superTokenIcon}
                      alt="degen"
                      width={isFundingMatchingPool ? 16 : 22}
                    />
                    <Badge className="bg-aqua w-75 ps-2 pe-2 py-2 fs-4 text-start overflow-hidden text-truncate">
                      {formatNumberWithCommas(
                        parseFloat(
                          convertStreamValueToInterval(
                            parseEther(
                              areTransactionsLoading &&
                                transactionDetailsSnapshot
                                ? transactionDetailsSnapshot.amountPerTimeInterval
                                : amountPerTimeInterval.replace(/,/g, "")
                            ),
                            timeInterval,
                            TimeInterval.MONTH
                          )
                        )
                      )}
                    </Badge>
                  </Stack>
                  <Card.Text className="m-0 ms-1 fs-5">/month</Card.Text>
                </Stack>
                {!isFundingMatchingPool && (
                  <>
                    <Stack
                      direction="horizontal"
                      className="bg-purple border-top border-dark p-2"
                    >
                      <Card.Text className="m-0 fs-5">Est. Matching</Card.Text>
                      <Stack
                        direction="horizontal"
                        gap={1}
                        className="justify-content-end w-50 ms-1 p-2"
                      >
                        <Image
                          src={DegenLogo}
                          alt="degen"
                          width={14}
                          className="mx-1"
                        />
                        <Badge className="bg-slate w-75 ps-2 pe-2 py-2 fs-4 text-start">
                          {areTransactionsLoading &&
                          transactionDetailsSnapshot?.netImpact
                            ? `${
                                transactionDetailsSnapshot.netImpact > 0
                                  ? "+"
                                  : ""
                              }${parseFloat(
                                (
                                  Number(
                                    formatEther(
                                      transactionDetailsSnapshot.netImpact
                                    )
                                  ) * fromTimeUnitsToSeconds(1, "months")
                                ).toFixed(6)
                              )}`
                            : netImpact
                            ? `${netImpact > 0 ? "+" : ""}${parseFloat(
                                (
                                  Number(formatEther(netImpact)) *
                                  fromTimeUnitsToSeconds(1, "months")
                                ).toFixed(6)
                              )}`
                            : 0}
                        </Badge>
                      </Stack>
                      <Card.Text className="m-0 ms-1 fs-5">/month</Card.Text>
                    </Stack>
                    <Stack
                      direction="horizontal"
                      className="bg-purple rounded-bottom-4 border-top border-dark p-2"
                    >
                      <Card.Text className="m-0 fs-5">QF Multiplier</Card.Text>
                      <Stack
                        direction="horizontal"
                        gap={1}
                        className="justify-content-end w-50 ms-2 p-2"
                      >
                        <Badge
                          className={`w-75 ps-2 pe-2 py-2 fs-4 text-start ${
                            BigInt(
                              areTransactionsLoading &&
                                transactionDetailsSnapshot
                                ? transactionDetailsSnapshot.newFlowRate
                                : newFlowRate
                            ) <
                            BigInt(
                              areTransactionsLoading &&
                                transactionDetailsSnapshot
                                ? transactionDetailsSnapshot.flowRateToReceiver
                                : flowRateToReceiver
                            )
                              ? "bg-danger"
                              : "bg-slate"
                          }`}
                        >
                          {areTransactionsLoading &&
                          transactionDetailsSnapshot?.netImpact &&
                          transactionDetailsSnapshot.newFlowRate !==
                            transactionDetailsSnapshot.flowRateToReceiver
                            ? `~${calcMatchingMultiplier(
                                transactionDetailsSnapshot.netImpact,
                                transactionDetailsSnapshot.newFlowRate,
                                transactionDetailsSnapshot.flowRateToReceiver
                              )}x`
                            : netImpact && newFlowRate !== flowRateToReceiver
                            ? `~${calcMatchingMultiplier(
                                netImpact,
                                newFlowRate,
                                flowRateToReceiver
                              )}x`
                            : "N/A"}
                        </Badge>
                      </Stack>
                    </Stack>
                  </>
                )}
              </Stack>
              {liquidationEstimate && (
                <Stack direction="horizontal" gap={1} className="mt-1">
                  <Card.Text className="m-0 fs-5">Est. Liquidation</Card.Text>
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="t-liquidation-info" className="fs-6">
                        This is the current estimate for when your token balance
                        will reach 0. Make sure to close your stream or wrap
                        more tokens before this date to avoid loss of your
                        buffer deposit.
                      </Tooltip>
                    }
                  >
                    <Image src={InfoIcon} alt="liquidation info" width={16} />
                  </OverlayTrigger>
                  <Card.Text className="m-0 ms-1 fs-5">
                    {dayjs
                      .unix(
                        areTransactionsLoading &&
                          transactionDetailsSnapshot?.liquidationEstimate
                          ? transactionDetailsSnapshot.liquidationEstimate
                          : liquidationEstimate
                      )
                      .format("MMMM D, YYYY")}
                  </Card.Text>
                </Stack>
              )}
              <Button
                variant={isDeletingStream ? "danger" : "success"}
                disabled={transactions.length === 0 || step === Step.SUCCESS}
                className="d-flex justify-content-center mt-2 py-1 rounded-3 text-white fw-bold"
                onClick={handleSubmit}
              >
                {areTransactionsLoading ? (
                  <Stack
                    direction="horizontal"
                    gap={2}
                    className="justify-content-center"
                  >
                    <Spinner
                      size="sm"
                      animation="border"
                      role="status"
                      className="p-2"
                    ></Spinner>
                    <Card.Text className="m-0">
                      {completedTransactions + 1}/{transactions.length}
                    </Card.Text>
                  </Stack>
                ) : isDeletingStream ? (
                  "Cancel Stream"
                ) : transactions.length > 0 ? (
                  `Submit (${transactions.length})`
                ) : (
                  "Submit"
                )}
              </Button>
              {transactionError && (
                <Alert
                  variant="danger"
                  className="mt-2 rounded-4 text-wrap text-break"
                >
                  {transactionError}
                </Alert>
              )}
            </Stack>
          </Accordion.Collapse>
        </Card>
        {step === Step.SUCCESS && BigInt(newFlowRate) === BigInt(0) ? (
          <Card className="bg-blue mt-4 p-4 text-white rounded-4">
            <Card.Text>Your donation stream is closed.</Card.Text>
          </Card>
        ) : step === Step.SUCCESS ? (
          <Card className="bg-blue mt-4 p-4 text-white rounded-4">
            <Card.Text>
              Your donation stream is open. Thank you for supporting public
              goods!
            </Card.Text>
            <Card.Text
              as="span"
              className="text-center"
              style={{ fontSize: 100 }}
            >
              &#x1F64F;
            </Card.Text>
            <Card.Text>
              Help spread the word about Streaming Quadratic Funding by sharing
              your contribution with your network:
            </Card.Text>
            <Stack direction="horizontal" className="justify-content-around">
              <Card.Link
                className="d-flex flex-column align-items-center twitter-share-button text-decoration-none text-white fs-5 m-0 w-50"
                rel="noreferrer"
                target="_blank"
                href={`https://twitter.com/intent/tweet?text=I%20just%20opened%20a%20contribution%20stream%20to%20${
                  isFundingMatchingPool
                    ? "the SQF Matching Pool"
                    : recipientsDetails && granteeIndex !== null
                    ? extractTwitterHandle(
                        recipientsDetails[granteeIndex].social
                      )
                    : ""
                }%20in%20the%20%23streamingqf%20on%Degen%Chain%20%0A%0AJoin%20me%20in%20making%20public%20goods%20funding%20history%20by%20donating%20in%20the%20world%27s%20first%20SQF%20round%21`}
                data-size="large"
              >
                <Image src={XIcon} alt="x social" width={28} height={22} />
                <span style={{ fontSize: "10px" }}>Post to X</span>
              </Card.Link>
              <Card.Link
                className="d-flex flex-column align-items-center text-decoration-none text-white fs-5 m-0 w-50"
                rel="noreferrer"
                target="_blank"
                href={`https://warpcast.com/~/compose?text=I+just+opened+a+contribution+stream+to+${
                  isFundingMatchingPool ? "the SQF Matching Pool" : granteeName
                }+in+the+%23streamingqf+pilot+round+on+degen+chain+%0A%0AJoin+me+in+making+public+goods+funding+history+by+donating+in+the+world's+first+SQF+round%21`}
              >
                <Image
                  src={FarcasterIcon}
                  alt="farcaster"
                  width={28}
                  height={22}
                />
                <span style={{ fontSize: "10px" }}>Cast to Farcaster</span>
              </Card.Link>
              <Card.Link
                className="d-flex flex-column align-items-center text-decoration-none text-white fs-5 m-0 w-50"
                rel="noreferrer"
                target="_blank"
                href={`https://hey.xyz/?text=I+just+opened+a+contribution+stream+to+${
                  isFundingMatchingPool ? "the SQF Matching Pool" : granteeName
                }+in+the+%23streamingqf+pilot+round+presented+by+Geo+Web%2C+%40gitcoin%2C+%26+%40superfluid%3A+%0A%0Ahttps%3A%2F%2Fstreaming.fund+%0A%0AJoin+me+in+making+public+goods+funding+history+by+donating+in+the+world%27s+first+SQF+round%21`}
              >
                <Image src={LensIcon} alt="lens" width={28} height={22} />
                <span style={{ fontSize: "10px" }}>Post on Lens</span>
              </Card.Link>
            </Stack>
          </Card>
        ) : null}
      </Accordion>
    </>
  );
}
