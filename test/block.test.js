const Block = require("../src/block");

describe("Block", () => {
  const timestamp = "a-date";
  const lastHash = "dummyLastHash";
  const hash = "dummyHash";
  const data = ["blockchain", "dummyData"];
  const block = new Block({
    timestamp,
    lastHash,
    hash,
    data
  });

  it("has a timestamp property", () => {
    expect(block.timestamp).toEqual(timestamp);
  });

  it("has a lastHash property", () => {
    expect(block.lastHash).toEqual(lastHash);
  });

  it("has a hash property", () => {
    expect(block.hash).toEqual(hash);
  });

  it("has a data property", () => {
    expect(block.data).toEqual(data);
  });
});
