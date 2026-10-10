import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GitHubApi,
  type GitHubIssueResponse,
} from "../src/github-api";
import {
  assertIssueSearchResultsInRepo,
  buildIssueSearchQuery,
} from "../src/github-search";

function issueAt(htmlUrl: string): Pick<GitHubIssueResponse, "html_url"> {
  return { html_url: htmlUrl };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("assertIssueSearchResultsInRepo", () => {
  it("accepts exact repository path segments case-insensitively", () => {
    expect(() => assertIssueSearchResultsInRepo("Cloudflare", "Workerd", [
      issueAt("https://github.com/cloudflare/workerd/issues/1"),
    ])).not.toThrow();
  });

  it("rejects results from another repository", () => {
    expect(() => assertIssueSearchResultsInRepo("cloudflare", "workerd", [
      issueAt("https://github.com/cloudflare/quiche/issues/1"),
    ])).toThrow("outside the connected repository");
  });

  it("does not accept repository names that only share a prefix", () => {
    expect(() => assertIssueSearchResultsInRepo("cloudflare", "workerd", [
      issueAt("https://github.com/cloudflare/workerd-private/issues/1"),
    ])).toThrow("outside the connected repository");
  });

  it("rejects pull requests returned by an injected search expression", () => {
    expect(() => assertIssueSearchResultsInRepo("cloudflare", "workerd", [
      issueAt("https://github.com/cloudflare/workerd/pull/1"),
    ])).toThrow("non-issue result");
  });

  it("rejects malformed and non-GitHub result URLs", () => {
    expect(() => assertIssueSearchResultsInRepo("cloudflare", "workerd", [
      issueAt("not a URL"),
    ])).toThrow("outside the connected repository");
    expect(() => assertIssueSearchResultsInRepo("cloudflare", "workerd", [
      issueAt("https://example.com/cloudflare/workerd/issues/1"),
    ])).toThrow("outside the connected repository");
  });
});

describe("buildIssueSearchQuery", () => {
  it("builds a benign literal phrase search with structured filters", () => {
    expect(buildIssueSearchQuery("cloudflare", "workerd", {
      text: "durable objects",
      state: "open",
      labels: ["bug"],
      author: "jasnell",
    })).toBe(
      '"durable objects" repo:cloudflare/workerd is:issue state:open label:"bug" author:"jasnell"',
    );
  });

  it("quotes every caller-controlled query fragment", () => {
    expect(buildIssueSearchQuery("cloudflare", "workerd", {
      text: "repo:cloudflare/quiche OR scheduler",
      author: "jasnell OR repo:cloudflare/quiche",
      assignee: "octocat OR repo:cloudflare/quiche",
    })).toBe(
      '"repo:cloudflare/quiche OR scheduler" repo:cloudflare/workerd is:issue '
      + 'author:"jasnell OR repo:cloudflare/quiche" assignee:"octocat OR repo:cloudflare/quiche"',
    );
  });

  it("escapes quotes inside plain search text", () => {
    expect(buildIssueSearchQuery("cloudflare", "workerd", {
      text: 'bug" OR repo:cloudflare/quiche OR "',
    })).toBe('"bug\\" OR repo:cloudflare/quiche OR \\"" repo:cloudflare/workerd is:issue');
  });
});

describe("GitHubApi.searchIssuesConditional", () => {
  it("enables GitHub advanced search parsing", async () => {
    let requestUrl: URL | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      requestUrl = new URL(String(input));
      return new Response(JSON.stringify({ items: [] }), {
        headers: { "content-type": "application/json" },
      });
    }));

    const api = new GitHubApi(async () => "test-token");
    await api.searchIssuesConditional(
      "repo:cloudflare/quiche OR repo:cloudflare/workerd is:issue",
      1,
      100,
    );

    expect(requestUrl?.searchParams.get("advanced_search")).toBe("true");
  });
});

describe("GitHubApi.getContents", () => {
  it("requests the encoded path with an optional ref", async () => {
    let requestUrl: URL | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      requestUrl = new URL(String(input));
      return new Response(JSON.stringify({
        name: "index.ts",
        path: "src/index.ts",
        sha: "abc123",
        size: 12,
        type: "file",
        content: Buffer.from("hello world\n").toString("base64"),
        encoding: "base64",
        download_url: "https://example.com/raw",
      }), {
        headers: { "content-type": "application/json" },
      });
    }));

    const api = new GitHubApi(async () => "test-token");
    const result = await api.getContents("cloudflare", "yctour-app", "src/index.ts", "feature/test");

    expect(requestUrl?.pathname).toBe("/repos/cloudflare/yctour-app/contents/src/index.ts");
    expect(requestUrl?.searchParams.get("ref")).toBe("feature/test");
    expect(Array.isArray(result)).toBe(false);
    expect((result as { sha: string }).sha).toBe("abc123");
  });

  it("returns the directory entry array for a folder", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([
      { name: "a.ts", path: "src/a.ts", sha: "a", size: 1, type: "file" },
      { name: "b.ts", path: "src/b.ts", sha: "b", size: 2, type: "file" },
    ]), {
      headers: { "content-type": "application/json" },
    })));

    const api = new GitHubApi(async () => "test-token");
    const result = await api.getContents("cloudflare", "yctour-app", "src");

    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBe(2);
  });
});

describe("GitHubApi.putContents", () => {
  it("PUTs base64 content to the encoded path", async () => {
    let requestUrl: URL | undefined;
    let requestBody: unknown;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      requestUrl = new URL(String(input));
      requestBody = init?.body ? JSON.parse(String(init.body)) : undefined;
      return new Response(JSON.stringify({
        content: { name: "index.ts", path: "src/index.ts", sha: "new-sha", size: 5, type: "file" },
        commit: { sha: "commit-sha", message: "update" },
      }), {
        headers: { "content-type": "application/json" },
      });
    }));

    const api = new GitHubApi(async () => "test-token");
    const result = await api.putContents("cloudflare", "yctour-app", "src/index.ts", {
      message: "update",
      content: Buffer.from("hello").toString("base64"),
      sha: "old-sha",
      branch: "feature/test",
    });

    expect(requestUrl?.pathname).toBe("/repos/cloudflare/yctour-app/contents/src/index.ts");
    expect(requestUrl?.search).toBe("");
    expect(requestBody).toMatchObject({
      message: "update",
      sha: "old-sha",
      branch: "feature/test",
    });
    expect(result.commit.sha).toBe("commit-sha");
    expect(result.content?.sha).toBe("new-sha");
  });

  it("encodes multi-segment paths", async () => {
    let requestUrl: URL | undefined;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      requestUrl = new URL(String(input));
      return new Response(JSON.stringify({
        content: null,
        commit: { sha: "c", message: "m" },
      }), {
        headers: { "content-type": "application/json" },
      });
    }));

    const api = new GitHubApi(async () => "test-token");
    await api.putContents("cloudflare", "yctour-app", "docs/설정 파일.md", {
      message: "m",
      content: "YQ==",
    });

    expect(requestUrl?.pathname).toBe(
      `/repos/cloudflare/yctour-app/contents/docs/${encodeURIComponent("설정 파일.md")}`);
  });
});
