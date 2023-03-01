import LostAndFound from "../../contracts/LostAndFound.cdc"

pub fun main(redeemer: String): [Type] {
    let shelfManager = LostAndFound.borrowShelfManager()
    let shelf = shelfManager.borrowShelf(redeemer: redeemer)
    if shelf == nil {
        return []
    }
    
    return shelf!.getRedeemableTypes()
}
 