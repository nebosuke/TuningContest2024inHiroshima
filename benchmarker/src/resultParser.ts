import { readFileSync, writeFileSync } from "fs";
import { basename } from "path";

interface API {
  name: string;
  method: string;
  path: string;
  point: number;
}

type Log = {
  metric: string;
  type: string;
  data: {
    time: string;
    value: number;
    tags: Record<string, string>;
  };
};

interface apiResult {
  name: string;
  method: string;
  path: string;
  success: number;
  fail: number;
  timeout: number;
  subTotal: number;
}

interface finalResult {
  score: number;
  totalSuccess: number;
  totalFail: number;
  apiResultsForSubmit: apiResultForSubmit[];
}

interface apiResultForSubmit {
  method: string;
  path: string;
  success: number;
  fail: number;
  timeout: number;
}

const readFile = (resultFile: string): Log[] => {
  const fileData = readFileSync(resultFile, "utf-8");
  const fileLines = fileData.split("\n").slice(0, -1);

  return fileLines.map((line) => JSON.parse(line));
};

const createResultAggregator = (
  checksResults: Log[],
  timeoutResults: Log[]
): apiResult[] => {
  const APIs: API[] = [
    {
      name: "login",
      method: "POST",
      path: "/api/v1/session",
      point: 3,
    },
    {
      name: "getUsers",
      method: "GET",
      path: "/api/v1/users",
      point: 3,
    },
    {
      name: "getUserIcon",
      method: "GET",
      path: "/api/v1/users/user-icon/{userIconId}",
      point: 1,
    },
    {
      name: "searchUsers",
      method: "GET",
      path: "/api/v1/users/search",
      point: 3,
    },
    {
      name: "getMatchGroups",
      method: "GET",
      path: "/api/v1/match-groups/members/{userId}",
      point: 5,
    },
    {
      name: "createMatchGroup",
      method: "POST",
      path: "/api/v1/match-groups",
      point: 10,
    },
  ];
  const FAIL_WEIGHT = 20;

  return APIs.map((API) => {
    const timeout = timeoutResults.filter(
      (result) => result.data.tags.name === API.name
    ).length;
    const success = checksResults.filter(
      (result) => result.data.tags.name === API.name && result.data.value === 1
    ).length;
    const fail =
      checksResults.filter(
        (result) =>
          result.data.tags.name === API.name && result.data.value === 0
      ).length - timeout;
    const subTotal = success * API.point - fail * FAIL_WEIGHT;

    return {
      name: API.name,
      method: API.method,
      path: API.path,
      success,
      fail,
      timeout,
      subTotal,
    };
  });
};

const outputApiResult = (apiResult: apiResult): apiResultForSubmit => {
  console.log(
    `
    - ${apiResult.method} ${apiResult.path}
      ✓ requests: ${
        apiResult.success + apiResult.fail + apiResult.timeout
      }, success: ${apiResult.success}, fail: ${apiResult.fail}, timeout: ${
      apiResult.timeout
    }
    `
  );

  return {
    method: apiResult.method,
    path: apiResult.path,
    success: apiResult.success,
    fail: apiResult.fail,
    timeout: apiResult.timeout,
  };
};

const calcResults = (apiResults: apiResult[]): finalResult => {
  const finalResult = apiResults.reduce(
    (acc: finalResult, cur) => {
      acc.score += cur.subTotal;
      acc.totalSuccess += cur.success;
      acc.totalFail += cur.fail;
      acc.apiResultsForSubmit.push(outputApiResult(cur));
      return acc;
    },
    { score: 0, totalSuccess: 0, totalFail: 0, apiResultsForSubmit: [] }
  );

  finalResult.score = finalResult.score > 0 ? finalResult.score : 0;
  return finalResult;
};

const main = () => {
  if (!process.argv[2]) {
    console.error("第1引数に解析対象のファイルを指定してください");
    process.exit(1);
  }
  const resultFile: string = process.argv[2];

  const allResults: Log[] = readFile(resultFile);

  const checksResults = allResults.filter(
    (result) => result.metric === "checks" && result.type === "Point"
  );

  const timeoutResults = allResults.filter(
    (entry) =>
      entry.type !== "Metric" &&
      entry.metric === "http_reqs" &&
      "error" in entry.data.tags &&
      entry.data.tags.error === "request timeout"
  );

  const apiResults = createResultAggregator(checksResults, timeoutResults);

  console.log(`Results per API:`);
  const finalResult = calcResults(apiResults);
  const totalRequests =
    finalResult.totalSuccess + finalResult.totalFail + timeoutResults.length;
  console.log(
    `
    ================================================================
        Congratulations! All Scoring Process Successfully Done!!

        Score: ${finalResult.score.toString().padStart(19)}

        Total requests: ${totalRequests.toString().padStart(10)}
          Success: ${finalResult.totalSuccess.toString().padStart(15)}
          Fail: ${finalResult.totalFail.toString().padStart(18)}
          Timeout: ${timeoutResults.length.toString().padStart(15)}
        RPS: ${(Math.round((totalRequests / 60) * 100) / 100)
          .toString()
          .padStart(21)}
    ================================================================
    `
  );

  const writeText = JSON.stringify({
    commit: process.env.COMMIT,
    pass: true,
    score: finalResult.score,
    success: finalResult.totalSuccess,
    fail: finalResult.totalFail,
    resultPerApi: finalResult.apiResultsForSubmit,
  });

  writeFileSync(`/scoring/score/${basename(resultFile)}`, writeText);
};

main();
