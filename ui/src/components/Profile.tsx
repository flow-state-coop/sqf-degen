import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { formatEther } from "viem";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";
import Offcanvas from "react-bootstrap/Offcanvas";
import Stack from "react-bootstrap/Stack";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Image from "react-bootstrap/Image";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import CloseIcon from "../assets/close.svg";
import CopyIcon from "../assets/copy-light.svg";
import AccountIcon from "../assets/account-circle.svg";
import LogoutIcon from "../assets/logout.svg";
import DegenLogo from "../assets/degen-white.svg";
import useFlowingAmount from "../hooks/flowingAmount";
import { useMediaQuery } from "../hooks/mediaQuery";
import useRoundQuery from "../hooks/roundQuery";
import {
  TimeInterval,
  unitOfTime,
  fromTimeUnitsToSeconds,
  roundWeiAmount,
  formatNumberWithCommas,
  truncateStr,
} from "../lib/utils";
import { DEGENX_ADDRESS } from "../lib/constants";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

function Profile() {
  const [showProfile, setShowProfile] = useState(false);

  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isMobile, isTablet } = useMediaQuery();
  const { userTokenSnapshots } = useRoundQuery(address);
  const accountTokenSnapshot = userTokenSnapshots?.filter(
    (snapshot) => snapshot.token === DEGENX_ADDRESS.toLowerCase()
  )[0];
  const superTokenBalance = useFlowingAmount(
    BigInt(accountTokenSnapshot?.balanceUntilUpdatedAt ?? 0),
    accountTokenSnapshot?.updatedAtTimestamp ?? 0,
    BigInt(accountTokenSnapshot?.totalNetFlowRate ?? 0)
  );

  const handleCloseProfile = () => setShowProfile(false);
  const handleShowProfile = () => setShowProfile(true);

  return (
    <>
      <ButtonGroup className="d-flex align-items-center bg-dark border-secondary">
        <Button
          variant="secondary"
          disabled={showProfile}
          onClick={handleShowProfile}
          className="d-none d-xl-block text-light rounded-start"
        >
          {!userTokenSnapshots ? (
            <Spinner size="sm" animation="border" role="status"></Spinner>
          ) : (
            <Card.Text className="m-0">
              {formatEther(superTokenBalance).slice(0, 8)} DEGENx
            </Card.Text>
          )}
        </Button>
        <Button
          variant="outline-secondary"
          disabled={showProfile}
          onClick={handleShowProfile}
          className="d-none d-xl-flex align-items-center gap-1 text-light bg-dark rounded-end"
        >
          <Card.Text className="m-0">
            {truncateStr(address ?? "0x", 14)}{" "}
          </Card.Text>
        </Button>
        <Button
          variant="link"
          disabled={showProfile}
          onClick={handleShowProfile}
          className="ms-3 d-xl-none"
        ></Button>
        <Button
          variant="link"
          disabled={showProfile}
          onClick={handleShowProfile}
          className="d-xl-none"
        >
          <Image width={46} src={AccountIcon} />
        </Button>
      </ButtonGroup>
      <Offcanvas
        show={showProfile}
        scroll
        onHide={handleCloseProfile}
        placement="end"
        backdrop={true}
        className="bg-dark overflow-auto border-0"
        style={{ width: isMobile ? "100vw" : isTablet ? "50vw" : "" }}
      >
        <Stack
          direction="horizontal"
          className="justify-content-end align-items-center"
        >
          <Button
            variant="transparent"
            className="float-end"
            onClick={handleCloseProfile}
          >
            <Image src={CloseIcon} alt="close" width={28} />
          </Button>
        </Stack>
        <Stack
          direction="horizontal"
          className="justify-content-between align-items-center p-3 text-white"
        >
          <Stack direction="horizontal" className="align-items-center">
            <Card.Text className="m-0">
              {truncateStr(address ?? "0x", 14)}{" "}
            </Card.Text>
            <Button
              variant="transparent"
              className="d-flex align-items-center px-2"
              onClick={() => navigator.clipboard.writeText(address ?? "0x")}
            >
              <Image src={CopyIcon} alt="copy" width={18} />{" "}
            </Button>
          </Stack>
          <Button
            variant="blue"
            className="d-flex gap-2 align-items-center rounded-4 px-3 py-2"
            onClick={() => {
              disconnect();
              handleCloseProfile();
            }}
          >
            <Card.Text className="m-0">Disconnect</Card.Text>
            <Image src={LogoutIcon} alt="copy" width={18} />{" "}
          </Button>
        </Stack>
        <Stack
          direction="horizontal"
          gap={1}
          className="bg-purple rounded-top-4 mt-3 mx-3 p-3 fs-3"
        >
          <Badge
            className={`cursor-pointer rounded-3 ${"bg-success text-success"}`}
            style={{
              background: "linear-gradient(rgba(0,0,0,.50),rgba(0,0,0,.50))",
            }}
          >
            DEGENx
          </Badge>
        </Stack>
        <Stack
          direction="horizontal"
          className="bg-purple mx-3 p-2 pb-3 fs-3 border-bottom border-dark"
        >
          <Card.Text className="m-0 text-gray px-2 w-50">Balance</Card.Text>
          <Stack direction="horizontal" gap={2} className="align-items-center">
            <Image src={DegenLogo} alt="token logo" width={16} />
            <Card.Text className="m-0 text-white overflow-hidden text-truncate">
              {formatNumberWithCommas(
                parseFloat(formatEther(superTokenBalance).slice(0, 8))
              )}
            </Card.Text>
          </Stack>
        </Stack>
        <Stack
          direction="horizontal"
          className="bg-purple mx-3 px-2 py-3 fs-3 border-bottom border-dark"
        >
          <Card.Text className="m-0 text-gray px-2 w-50">
            Total Stream Value
          </Card.Text>
          <Stack
            direction="horizontal"
            gap={2}
            className="align-items-center w-50"
          >
            <Image src={DegenLogo} alt="close" width={16} />
            <Card.Text className="m-0 text-white w33 overflow-hidden text-truncate">
              {formatNumberWithCommas(
                parseFloat(
                  roundWeiAmount(
                    BigInt(accountTokenSnapshot?.totalOutflowRate ?? 0) *
                      BigInt(
                        fromTimeUnitsToSeconds(
                          1,
                          unitOfTime[TimeInterval.MONTH]
                        )
                      ),
                    6
                  )
                )
              )}
            </Card.Text>
            <Card.Text className="m-0 text-gray fs-6">monthly</Card.Text>
          </Stack>
        </Stack>
        <Stack
          direction="horizontal"
          className="bg-purple mx-3 rounded-bottom-4 px-2 py-3 fs-3 border-bottom border-dark"
        >
          <Card.Text className="m-0 text-gray px-2 w-50">
            Liquidation Date
          </Card.Text>
          <Card.Text className="m-0 text-gray overflow-hidden text-truncate fs-4">
            {accountTokenSnapshot?.maybeCriticalAtTimestamp
              ? dayjs
                  .unix(accountTokenSnapshot.maybeCriticalAtTimestamp)
                  .format("MMM D, YYYY")
              : "N/A"}
          </Card.Text>
        </Stack>
        <Card.Link
          href="https://app.superfluid.finance"
          target="_blank"
          className="mx-3 p-3 text-center text-decoration-underline cursor-pointer"
        >
          Visit the Superfluid App for advanced management of your Super Token
          balances
        </Card.Link>
      </Offcanvas>
    </>
  );
}

export default Profile;
