import {test} from "node:test"
import assert from "node:assert/strict"
import lines from "../source/plugins/lines/index.mjs"

test("user aggregate lines include the user's commits in organization repositories", async () => {
  const result = await lines({
    login: "dskvr", account: "user", q: {lines: true},
    data: {account: "user", shared: {"repositories.skipped": []}, user: {repositories: {nodes: [{name: "nsyte", owner: {login: "sandwichfarm"}}]}}},
    imports: {
      metadata: {plugins: {lines: {enabled: () => true, inputs: () => ({skipped: [], sections: ["base", "repositories"], "repositories.limit": 4, "history.limit": 0, delay: 0})}}},
      filters: {repo: () => true}, format: {error: error => error},
    },
    rest: {repos: {getContributorsStats: async () => ({data: [
      {author: {login: "dskvr"}, weeks: [{a: 12, d: 3, c: 2, w: 1700000000}]},
      {author: {login: "someone-else"}, weeks: [{a: 900, d: 800, c: 100, w: 1700000000}]},
    ]})}},
  }, {enabled: true})
  assert.equal(result.added, 12)
  assert.equal(result.deleted, 3)
  assert.equal(result.changed, 2)
  assert.equal(result.repos[0].handle, "sandwichfarm/nsyte")
})
