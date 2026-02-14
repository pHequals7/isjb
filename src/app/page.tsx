import { JobBoard } from "@/components/job-board";
import { loadVCFunds } from "@/lib/data";

export default function Home() {
  const funds = loadVCFunds();
  return <JobBoard funds={funds} />;
}
