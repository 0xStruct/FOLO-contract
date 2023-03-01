import FungibleToken from "../../contracts/FungibleToken.cdc"
import ExampleToken from "../../contracts/ExampleToken.cdc"

import LostAndFound from "../../contracts/LostAndFound.cdc"

pub fun main(redeemer: String, ticketID: UInt64): &LostAndFound.Ticket? {
    let shelfManager = LostAndFound.borrowShelfManager()
    let shelf = shelfManager.borrowShelf(redeemer: redeemer)
    let bin = shelf!.borrowBin(type: Type<@ExampleToken.Vault>())!

    return bin.borrowTicket(id: ticketID)
}
