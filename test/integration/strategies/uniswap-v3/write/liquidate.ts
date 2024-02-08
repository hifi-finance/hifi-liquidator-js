import { expect } from "chai";
import { BigNumber } from "ethers";

export function shouldBehaveLikeLiquidate(): void {
  beforeEach(async function () {
    const timestamp = (await this.signers.borrower.provider?.getBlock("latest"))?.timestamp || 0;

    await this.mocks.oracle.mock.latestRoundData.returns(0, "229849896605", 0, timestamp, 0);

    await this.contracts.weth
      .connect(this.signers.borrower)
      .approve(this.contracts.balanceSheet.address, "1000000000000000000");
    await this.contracts.balanceSheet
      .connect(this.signers.borrower)
      .depositCollateral(this.contracts.weth.address, "1000000000000000000");
    await this.contracts.balanceSheet
      .connect(this.signers.borrower)
      .borrow(this.contracts.bond.address, "1838799100000000000000");

    await this.mocks.oracle.mock.latestRoundData.returns(0, "9849896605", 0, timestamp, 0);
  });

  it("liquidates the underwater vaults", async function () {
    let excessLiquidity, shortfallLiquidity;

    // Assert the state of the vault pre liquidation
    [excessLiquidity, shortfallLiquidity] = await this.contracts.balanceSheet.getCurrentAccountLiquidity(
      this.signers.borrower.address,
    );
    expect(excessLiquidity).to.be.equal("0");
    expect(shortfallLiquidity).to.be.equal("1759999927160000000000");

    // Increase test timeout to 2 minutes
    this.timeout(120000);

    // Execute liquidation
    await this.liquidator.liquidate(
      this.signers.borrower.address,
      this.contracts.bond.address,
      this.contracts.weth.address,
      BigNumber.from("2000000000"),
      this.contracts.usdc.address,
    );

    // Assert the state of the vault post liquidation
    [excessLiquidity, shortfallLiquidity] = await this.contracts.balanceSheet.getCurrentAccountLiquidity(
      this.signers.borrower.address,
    );
    expect(excessLiquidity).to.be.equal("0");
    expect(shortfallLiquidity).to.be.equal("1749254585409090909091");
  });
}
