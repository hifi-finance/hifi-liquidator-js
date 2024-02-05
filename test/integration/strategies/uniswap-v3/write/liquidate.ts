import { expect } from "chai";

export function shouldBehaveLikeLiquidate(): void {
  beforeEach(async function () {
    const timestamp = (await this.signers.admin.provider?.getBlock("latest"))?.timestamp || 0;

    await this.mocks.oracle.mock.latestRoundData.returns(0, "229849896605", 0, timestamp, 0);

    await this.contracts.weth
      .connect(this.signers.admin)
      .approve(this.contracts.balanceSheet.address, "1000000000000000000");
    await this.contracts.balanceSheet
      .connect(this.signers.admin)
      .depositCollateral(this.contracts.weth.address, "1000000000000000000");
    await this.contracts.balanceSheet
      .connect(this.signers.admin)
      .borrow(this.contracts.bond.address, "1838799100000000000000");

    await this.mocks.oracle.mock.latestRoundData.returns(0, "9849896605", 0, timestamp, 0);
  });

  it("liquidates the underwater vaults", async function () {
    await this.contracts.usdc
      .connect(this.signers.admin)
      .approve("0x86432aA958e34b9A90C349F46C3162c98D0ea5c4", ethers.constants.MaxUint256);
    await this.contracts.weth
      .connect(this.signers.admin)
      .approve("0x86432aA958e34b9A90C349F46C3162c98D0ea5c4", ethers.constants.MaxUint256);
    // Increase test timeout to 2 minutes
    this.timeout(120000);
    // Execute liquidation
    await (this.liquidator as any).liquidate(
      this.signers.admin.address,
      this.contracts.bond.address,
      this.contracts.weth.address,
      "1759999927",
      this.contracts.usdc.address,
    );

    // TODO: assert the state of the vault pre and post liquidation
  });
}
