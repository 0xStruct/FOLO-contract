import FlowToken from "../../contracts/FlowToken.cdc"
import FungibleToken from "../../contracts/FungibleToken.cdc"
import ExampleToken from "../../contracts/ExampleToken.cdc"

import LostAndFound from "../../contracts/LostAndFound.cdc"

transaction(recipient: String, amount: UFix64) {
    let depositor: &LostAndFound.Depositor
    let vault: &ExampleToken.Vault

    prepare(acct: AuthAccount) {
        self.depositor = acct.borrow<&LostAndFound.Depositor>(from: LostAndFound.DepositorStoragePath)!

        self.vault = acct.borrow<&ExampleToken.Vault>(from: /storage/exampleTokenVault)
            ?? panic("Could not borrow exampleTokenVault")
    }

    execute {
        let v <- self.vault.withdraw(amount: amount)

        let memo = "test memo"

        self.depositor.deposit(
            redeemer: recipient,
            item: <- v,
            memo: nil,
            display: nil
        )
    }
}
 