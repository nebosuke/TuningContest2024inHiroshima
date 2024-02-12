import { check } from "k6";
import http from "k6/http";
import { Options } from "k6/options";
import exec from "k6/execution";

// baseUrl
const BASE_URL = __ENV.BASE_URL;

// ユーザー数
const USER_NUM = 300000;

const url = (path: string) => `${BASE_URL}${path}`;

export const options: Options = {
  scenarios: {
    rampingTestSuite: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 40 },
        { duration: "10s", target: 80 },
        { duration: "10s", target: 120 },
        { duration: "10s", target: 120 },
        { duration: "10s", target: 80 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "1m",
      gracefulStop: "1m",
      exec: "testSuite",
    },
  },
};

export const testSuite = () => {
  const { sessionId, userId } = login();
  if (sessionId == "" || userId == "") {
    return;
  }
  getUsers(sessionId);
  for (let i = 0; i < 4; i++) {
    getUserIcon(sessionId);
  }
  searchUsers(sessionId);
  getMatchGroups(sessionId, userId);
  createMatchGroup(sessionId);
};

// ログインAPI
const login = (): { sessionId: string; userId: string } => {
  const index =
    exec.scenario.iterationInInstance < USER_NUM
      ? exec.scenario.iterationInInstance
      : exec.scenario.iterationInInstance - USER_NUM;

  const res = http.post(
    url("/api/v1/session"),
    JSON.stringify({
      mail: `popy${index}@example.com`,
      password: `pass${index}`,
    }),
    {
      headers: { "Content-Type": "application/json" },
      timeout: "50s",
      tags: { name: login.name },
    }
  );
  if (
    !check(
      res,
      {
        "Login: is status 200 or 201": () =>
          res.status === 200 || res.status === 201,
      },
      { name: login.name }
    )
  ) {
    return { sessionId: "", userId: "" };
  }
  return {
    sessionId: (res.json("sessionId") || "").toString(),
    userId: (res.json("userId") || "").toString(),
  };
};

// ユーザー一覧取得API
const getUsers = (sessionId: string) => {
  const res = http.get(url(`/api/v1/users`), {
    cookies: {
      SESSION_ID: sessionId,
    },
    timeout: "50s",
    tags: { name: getUsers.name },
  });
  check(
    res,
    {
      "Get users: is status 200": () => res.status === 200,
    },
    { name: getUsers.name }
  );
};

// ユーザーアイコン画像取得API
const getUserIcon = (sessionId: string) => {
  const res = http.get(url(`/api/v1/users/user-icon/test-file-id`), {
    cookies: {
      SESSION_ID: sessionId,
    },
    timeout: "50s",
    tags: { name: getUserIcon.name },
  });
  check(
    res,
    {
      "Get user icon: is status 200": () => res.status === 200,
    },
    { name: getUserIcon.name }
  );
};

// ユーザー検索API
const searchUsers = (sessionId: string) => {
  // 検索キーワードは"常務"
  const res = http.get(url(`/api/v1/users/search?q=%E5%B8%B8%E5%8B%99`), {
    cookies: {
      SESSION_ID: sessionId,
    },
    timeout: "50s",
    tags: { name: searchUsers.name },
  });
  check(
    res,
    {
      "Get users: is status 200": () => res.status === 200,
    },
    { name: searchUsers.name }
  );
};

// マッチグループ一覧取得API
const getMatchGroups = (sessionId: string, userId: string) => {
  const res = http.get(
    url(`/api/v1/match-groups/members/${userId}?status=open`),
    {
      cookies: {
        SESSION_ID: sessionId,
      },
      timeout: "50s",
      tags: { name: getMatchGroups.name },
    }
  );
  check(
    res,
    {
      "Get match-groups: is status 200": () => res.status === 200,
    },
    { name: getMatchGroups.name }
  );
};

// マッチグループ作成API
const createMatchGroup = (sessionId: string) => {
  const res = http.post(
    url("/api/v1/match-groups"),
    JSON.stringify({
      matchGroupName: "match-group",
      description: "match-group description",
      numOfMembers: 4,
      departmentFilter: "onlyMyDepartment",
      officeFilter: "onlyMyOffice",
      skillFilter: ["簿記3級"],
      neverMatchedFilter: true,
    }),
    {
      cookies: { SESSION_ID: sessionId },
      headers: { "Content-Type": "application/json" },
      timeout: "50s",
      tags: { name: createMatchGroup.name },
    }
  );
  check(
    res,
    {
      "Create match-group: is status 201": () => res.status === 201,
    },
    { name: createMatchGroup.name }
  );
};
