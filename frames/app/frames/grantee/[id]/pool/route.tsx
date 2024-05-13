// pages/frames/grantee/[grantee]/pool/[pool].js
import { useRouter } from "next/router";

const PoolPage = () => {
  const router = useRouter();
  const { grantee, pool } = router.query;

  return (
    <div>
      <h1>Pool Details</h1>
      <p>Grantee ID: {grantee}</p>
      <p>Pool ID: {pool}</p>
    </div>
  );
};

export default PoolPage;
