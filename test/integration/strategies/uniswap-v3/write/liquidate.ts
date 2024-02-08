import { BigNumber } from "ethers";
import { ethers } from "hardhat";

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
    await this.contracts.usdc
      .connect(this.signers.runner)
      .approve("0x86432aA958e34b9A90C349F46C3162c98D0ea5c4", ethers.constants.MaxUint256);
    await this.contracts.weth
      .connect(this.signers.runner)
      .approve("0x86432aA958e34b9A90C349F46C3162c98D0ea5c4", ethers.constants.MaxUint256);
    // Increase test timeout to 2 minutes
    this.timeout(120000);
    // Execute liquidation
    await this.liquidator.liquidate(
      this.signers.borrower.address,
      this.contracts.bond.address,
      this.contracts.weth.address,
      BigNumber.from("1759999927"),
      this.contracts.usdc.address,
    );

    // TODO: assert the state of the vault pre and post liquidation
  });
}
