import { expect } from "chai";
import { BigNumber, ethers } from "ethers";

export function shouldBehaveLikeLiquidate(): void {
  context("when the pair does not exist", function () {
    beforeEach(async function () {
      await this.mocks.oracle.mock.latestRoundData.returns(0, 0, 0, 0, 0);
    });

    it("reverts", async function () {
      await expect(
        this.liquidator.liquidate(
          this.signers.borrower.address,
          this.contracts.bond.address,
          this.contracts.usdc.address,
          BigNumber.from("0"),
          this.contracts.usdc.address,
        ),
      ).to.be.rejectedWith("Uniswap V2 Strategy: Pair does not exist");
    });
  });

  context("when the pair exists", function () {
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
      await this.contracts.usdc
        .connect(this.signers.runner)
        .approve("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", ethers.constants.MaxUint256);
      await this.contracts.weth
        .connect(this.signers.runner)
        .approve("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc", ethers.constants.MaxUint256);
      await this.liquidator.liquidate(
        this.signers.borrower.address,
        this.contracts.bond.address,
        this.contracts.weth.address,
        BigNumber.from("1759999927"),
        this.contracts.usdc.address,
      );

      // TODO: assert the state of the vault pre and post liquidation
    });
  });
}
