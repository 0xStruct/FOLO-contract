import FungibleToken from "../../contracts/FungibleToken.cdc"
import LostAndFound from "../../contracts/LostAndFound.cdc"

pub fun main(redeemer: String, type: String): UFix64 {
    let tickets = LostAndFound.borrowAllTicketsByType(redeemer: redeemer, type: CompositeType(type)!)
    var balance : UFix64 = 0.0
    for ticket in tickets {
        if let b = ticket.getFungibleTokenBalance() {
            balance = balance + b
        }
    }
    return balance
}