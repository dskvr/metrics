import {test} from "node:test"
import assert from "node:assert/strict"
import base from "../source/plugins/base/index.mjs"

test("small pages aggregate selected owners and a maintained fork", async () => {
  const nodes = [
    {name: "personal", owner: {login: "dskvr"}, diskUsage: 10},
    {name: "nsyte", owner: {login: "sandwichfarm"}, isFork: true, diskUsage: 20},
    {name: "unrelated", owner: {login: "other"}, diskUsage: 500},
    {name: "ignored-fork", owner: {login: "dskvr"}, isFork: true, diskUsage: 600},
    {name: "sdk", owner: {login: "napplet"}, diskUsage: 30},
    {name: "shell", owner: {login: "kehto"}, diskUsage: 40},
  ]
  const pages = []
  const graphql = async query => {
    if (query.kind === "user") return {user: {login: "dskvr", createdAt: "2020-01-01"}}
    if (query.kind === "bulk") return {user: {repositories: {}, repositoriesContributedTo: {}, packages: {totalCount: 0}, contributionsCollection: {totalCommitContributions: 0}}}
    if (query.type === "repositoriesContributedTo") return {user: {repositoriesContributedTo: {nodes: [], edges: []}}}
    const offset = Number(query.after.match(/[0-9]+/)?.[0] ?? 0)
    const page = nodes.slice(offset, offset + query.repositories)
    pages.push(offset)
    return {user: {repositories: {nodes: page, edges: page.map((_, i) => ({cursor: String(offset + i + 1)}))}}}
  }
  const data = {base: {}}
  const inputs = {"repositories.forks": true, "repositories.affiliations": ["owner", "organization_member"], "repositories.batch": 2, "repositories.included": ["dskvr", "sandwichfarm", "napplet", "kehto"], "repositories.maintained.forks": ["sandwichfarm/nsyte"], "repositories.skipped": [], "users.ignored": [], "commits.authoring": ["dskvr"]}
  await base({login: "dskvr", data, q: {}, graphql,
    queries: {base: {user: () => ({kind: "user"}), "user.x": () => ({kind: "bulk"}), repositories: query => query}},
    imports: {metadata: {plugins: {base: {inputs: () => inputs}}}},
    rest: {search: {commits: async () => ({data: {total_count: 5}})}, packages: {listPackagesForUser: async () => ({data: []})}},
  }, {authenticated: "dskvr", settings: {repositories: 100, plugins: {base: {parts: []}}}})
  assert.deepEqual(pages, [0, 2, 4, 6])
  assert.deepEqual(data.user.repositories.nodes.map(repository => repository.name), ["personal", "nsyte", "sdk", "shell"])
  assert.equal(data.user.repositories.totalCount, 4)
  assert.equal(data.user.repositories.totalDiskUsage, 100)
  assert.equal(data.user.contributionsCollection.totalCommitContributions, 20)
})
