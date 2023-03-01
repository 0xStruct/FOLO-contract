import {
    executeScript,
    getContractAddress,
    getFlowBalance,
    sendTransaction
} from "flow-js-testing";
import {
    addFlowTokensToDepositor,
    after,
    alice, betty, elon,
    before, cleanup, exampleNFTAdmin,
    exampleTokenAdmin, getEventFromTransaction,
    //getRedeemableTypes, // defined below internally
    getTicketDepositFromRes,
    lostAndFoundAdmin
} from "./common";

// Increase timeout if your tests failing due to timeout
jest.setTimeout(1000000);

const depositAmount = 1000

describe("lost-and-found FOLO tests", () => {
    beforeEach(async () => {
        await before()
    });

    // Stop emulator, so it could be restarted
    afterEach(async () => {
        await after()
    });

    const getRedeemableTypes = async (alias) => {
        return await executeScript("Folo/get_alias_redeemable_types", [alias])
    }

    const depositExampleToken = async (redeemer, amount) => {
        const exampleTokenAddress = await getContractAddress("ExampleToken")

        const args = [redeemer, amount]
        const signers = [exampleTokenAddress]
        let [tx, err] = await sendTransaction({ name: "Folo/deposit_minted_ft", args, signers });
        console.log(tx)
        console.log(err)
        return [tx, err]
    }

    const configureExampleToken = async (account) => {
        const signers = [account]
        let [tx, err] = await sendTransaction({ name: "ExampleToken/setup_vault", args: [], signers })
        return [tx, err]
    }
    
    test("deposit minted ExampleToken to @elonmusk", async () => {

        let recipient = "@elonmusk"
        let [tx, err0] = await depositExampleToken(recipient, depositAmount) // deposit from minter
        
        // check recipient's redeemable tickets
        let [result, err] = await getRedeemableTypes(recipient)
        expect(err).toBe(null)
        let found = false
        result.forEach(val => {
            if (val.typeID === `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`) {
                found = true
            }
        })
        expect(found).toBe(true)

        // check deposit transaction event
        const eventType = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event = getEventFromTransaction(tx, eventType)
        console.log("deposit event", event)
        const ticketID = event.data.ticketID
        expect(ticketID).toBeGreaterThan(0)
        let [ticketDetail, ticketDetailErr] = await executeScript("Folo/borrow_ticket", [recipient, ticketID])
        expect(ticketDetailErr).toBe(null)
        expect(ticketDetail.redeemer).toBe(recipient)
        expect(ticketDetail.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)

        // @alias redemption process check for the alias's linked account
        // supposedly @elonmusk is linked to elon in emulator
        // redeem Elon's tickets
        let [_, redeemErr] = await sendTransaction({
            name: "Folo/redeem_example_token_all",
            args: [],
            signers: [elon],
            limit: 9999
        })
        expect(redeemErr).toBe(null)

        // check Elon's balance
        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [elon])
        expect(balanceErr).toBe(null)
        expect(Number(balance)).toBeGreaterThanOrEqual(depositAmount)
        console.log("Elon's balance", balance)

        const tokenType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`

        // deposit to Elon's bin
        await depositExampleToken(recipient, depositAmount) // deposit from minter

        // check balance of Elon's bin
        let [balance3, balanceErr3] = await executeScript("Folo/get_alias_bin_vault_balance", [recipient, tokenType])
        expect(balanceErr3).toBe(null)
        expect(balance3).toBe("1000.00000000")
        console.log("Elon's bin balance", balance3)
    })

    test("deposit non-minted ExampleToken to @elonmusk", async () => {

        let recipient = "@elonmusk"
        let [tx, err0] = await depositExampleToken(recipient, depositAmount) // deposit from minter
        
        // check recipient's redeemable tickets
        let [result, err] = await getRedeemableTypes(recipient)
        expect(err).toBe(null)
        let found = false
        result.forEach(val => {
            if (val.typeID === `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`) {
                found = true
            }
        })
        expect(found).toBe(true)

        // check deposit transaction event
        const eventType = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event = getEventFromTransaction(tx, eventType)
        console.log("deposit event", event)
        const ticketID = event.data.ticketID
        expect(ticketID).toBeGreaterThan(0)
        let [ticketDetail, ticketDetailErr] = await executeScript("Folo/borrow_ticket", [recipient, ticketID])
        expect(ticketDetailErr).toBe(null)
        expect(ticketDetail.redeemer).toBe(recipient)
        expect(ticketDetail.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)

        // @alias redemption process check for the alias's linked account
        // supposedly @elonmusk is linked to elon in emulator
        // redeem Elon's tickets
        // !!! withdrawn to alice
        let [_, redeemErr] = await sendTransaction({
            name: "Folo/redeem_example_token_all",
            args: [],
            signers: [alice],
            limit: 9999
        })
        expect(redeemErr).toBe(null)

        // check Alice's balance
        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr).toBe(null)
        expect(Number(balance)).toBeGreaterThanOrEqual(depositAmount)
        console.log("Alice's balance", balance)

        const tokenType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`

        // deposit to Elon's bin from Alice instead of minter
        //await depositExampleToken(recipient, depositAmount) // deposit from minter
        const [sendRes2, sendErr2] = await sendTransaction({
            name: "Folo/deposit_ft_without_depositor",
            args: [recipient, 10],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr2).toBe(null)

        const [sendRes3, sendErr3] = await sendTransaction({
            name: "Folo/deposit_ft_without_depositor",
            args: [recipient, 10],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr3).toBe(null)

        const [sendRes4, sendErr4] = await sendTransaction({
            name: "Folo/deposit_ft_without_depositor",
            args: [recipient, 10],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr4).toBe(null)

        // check balance of Elon's bin
        let [balance3, balanceErr3] = await executeScript("Folo/get_alias_bin_vault_balance", [recipient, tokenType])
        expect(balanceErr3).toBe(null)
        expect(balance3).toBe("30.00000000")
        console.log("Elon's bin balance", balance3)
    })

    /*
    test("alice deposits to betty WITHOUT depositor, betty redeems, alice deposits again", async () => {
        await depositExampleToken(alice, depositAmount) // deposit from minter

        // redeem Alice's tickets
        let [_, redeemErr] = await sendTransaction({
            name: "ExampleToken/redeem_example_token_all",
            args: [],
            signers: [alice],
            limit: 9999
        })
        expect(redeemErr).toBe(null)

        // check Alice's balance
        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr).toBe(null)
        expect(Number(balance)).toBeGreaterThanOrEqual(depositAmount)
        console.log("Alice's balance", balance)

        // now Alice has redeemed
        // then Alice deposits (without depositor) for Betty

        // deposit from Alice to Betty - 100 tokens
        const [sendRes2, sendErr2] = await sendTransaction({
            name: "Folo/deposit_ft_without_depositor",
            args: [betty, 100],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr2).toBe(null)

        // redeem Betty's tickets
        let [_2, redeemErr2] = await sendTransaction({
            name: "ExampleToken/redeem_example_token_all",
            args: [],
            signers: [betty],
            limit: 9999
        })
        expect(redeemErr2).toBe(null)

        // test balance of ExampleToken inside Betty's account
        let [balance2, balanceErr2] = await executeScript("ExampleToken/get_example_token_balance", [betty])
        console.log("Betty's balance", balance2)
        expect(balanceErr2).toBe(null)
        expect(Number(balance2)).toBeGreaterThanOrEqual(100)

        // deposit from Alice to Betty - 100 tokens
        const [sendRes3, sendErr3] = await sendTransaction({
            name: "Folo/deposit_ft_without_depositor",
            args: [betty, 100],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr3).toBe(null)

        // check Betty's ticket
        const [redeemableTypes2, rtErr2] = await getRedeemableTypes(betty)
        console.log(redeemableTypes2)
        expect(rtErr2).toBe(null)
        let found2 = false
        redeemableTypes2.forEach(val => {
            if (val.typeID === `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`) {
                found2 = true
            }
        })
        expect(found2).toBe(true)

        const eventType2 = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event2 = getEventFromTransaction(sendRes2, eventType2)
        //console.log("betty's ticket deposit event", event2)
        expect(sendErr2).toBe(null)
        expect(event2.data.redeemer).toBe(betty)
        expect(event2.data.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)

        const tokenType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`

        // deposit from Betty to Alice - 100 tokens
        const [sendRes4, sendErr4] = await sendTransaction({
            name: "Folo/deposit_ft_without_depositor",
            args: [alice, 100],
            signers: [betty],
            limit: 9999
        })
        expect(sendErr4).toBe(null)

        // check balance of Betty's bin
        let [balance3, balanceErr3] = await executeScript("ExampleToken/get_bin_vault_balance", [betty, tokenType])
        expect(balanceErr3).toBe(null)
        expect(balance3).toBe("100.00000000")
        console.log("Betty's bin balance", balance3)

        // check balance of Alice's bin
        let [balance4, balanceErr4] = await executeScript("ExampleToken/get_bin_vault_balance", [alice, tokenType])
        expect(balanceErr4).toBe(null)
        expect(balance4).toBe("100.00000000")
        console.log("Alice's bin balance", balance4)

        // check Alice's balance
        let [balance5, balanceErr5] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr5).toBe(null)
        //expect(Number(balance5)).toBeGreaterThanOrEqual(depositAmount)
        console.log("Alice's balance", balance5)

        // check Alice's $FLOW balance
        //const [result, error] = await getFlowBalance(alice)
        //console.log(result, error)
    })*/
    /*
    test("alice deposits to betty WITH depositor, betty redeems, alice deposits again", async () => {
        await depositExampleToken(alice, depositAmount) // deposit from minter

        // redeem Alice's tickets
        let [_, redeemErr] = await sendTransaction({
            name: "ExampleToken/redeem_example_token_all",
            args: [],
            signers: [alice],
            limit: 9999
        })
        expect(redeemErr).toBe(null)

        // check Alice's balance
        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr).toBe(null)
        expect(Number(balance)).toBeGreaterThanOrEqual(depositAmount)
        console.log("Alice's balance", balance)

        // now Alice has redeemed
        // then Alice deposits (via depositor) for Betty
        await addFlowTokensToDepositor(alice, 1) // setup flow depositor pool first for Alice

        // deposit from Alice to Betty - 100 tokens
        const [sendRes2, sendErr2] = await sendTransaction({
            name: "Folo/deposit_ft_with_depositor",
            args: [betty, 100],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr2).toBe(null)

        // redeem Betty's tickets
        let [_2, redeemErr2] = await sendTransaction({
            name: "ExampleToken/redeem_example_token_all",
            args: [],
            signers: [betty],
            limit: 9999
        })
        expect(redeemErr2).toBe(null)

        // test balance of ExampleToken inside Betty's account
        let [balance2, balanceErr2] = await executeScript("ExampleToken/get_example_token_balance", [betty])
        console.log("Betty's balance", balance2)
        expect(balanceErr2).toBe(null)
        expect(Number(balance2)).toBeGreaterThanOrEqual(100)

        // deposit from Alice to Betty - 100 tokens
        const [sendRes3, sendErr3] = await sendTransaction({
            name: "Folo/deposit_ft_with_depositor",
            args: [betty, 100],
            signers: [alice],
            limit: 9999
        })
        expect(sendErr3).toBe(null)

        // check Betty's ticket
        const [redeemableTypes2, rtErr2] = await getRedeemableTypes(betty)
        console.log(redeemableTypes2)
        expect(rtErr2).toBe(null)
        let found2 = false
        redeemableTypes2.forEach(val => {
            if (val.typeID === `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`) {
                found2 = true
            }
        })
        expect(found2).toBe(true)

        const eventType2 = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event2 = getEventFromTransaction(sendRes2, eventType2)
        console.log("betty's ticket deposit event", event2)
        expect(sendErr2).toBe(null)
        expect(event2.data.redeemer).toBe(betty)
        expect(event2.data.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)

        const tokenType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`

        // check balance of Betty's bin
        let [balance3, balanceErr3] = await executeScript("ExampleToken/get_bin_vault_balance", [betty, tokenType])
        expect(balanceErr3).toBe(null)
        expect(balance3).toBe("100.00000000")
        console.log("Betty's bin balance", balance3)

        // check balance of Alice's bin
        let [balance4, balanceErr4] = await executeScript("ExampleToken/get_bin_vault_balance", [alice, tokenType])
        expect(balanceErr4).toBe(null)
        expect(balance4).toBe("0.00000000")
        console.log("Alice's bin balance", balance4)

        // check Alice's balance
        let [balance5, balanceErr5] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr5).toBe(null)
        //expect(Number(balance5)).toBeGreaterThanOrEqual(depositAmount)
        console.log("Alice's balance", balance5)
    })*/
    /*
    test("send ExampleToken with setup", async () => {
        let [_, setupErr] = await sendTransaction({
            name: "ExampleToken/setup_account_ft",
            args: [],
            signers: [alice],
            limit: 999
        })
        expect(setupErr).toBe(null)

        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr).toBe(null)

        let [sendRes, sendErr] = await sendTransaction({
            name: "ExampleToken/try_send_example_token",
            args: [alice, depositAmount],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        expect(sendErr).toBe(null)
        const eventType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.TokensDeposited`
        const event = getEventFromTransaction(sendRes, eventType)
        expect(event.type).toBe(eventType)
        expect(Number(event.data.amount)).toBe(depositAmount)
        expect(event.data.to).toBe(alice)

        let [balanceAfter, balanceAfterErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceAfterErr).toBe(null)
        expect(Number(balanceAfter)).toBe(depositAmount + Number(balance))
    })*/
    /*
    test("send ExampleToken without setup", async () => {
        await sendTransaction({
            name: "ExampleToken/destroy_example_token_storage",
            signers: [alice],
            args: [],
            limit: 9999
        })

        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr.message.includes("unexpectedly found nil while forcing an Optional value")).toBe(true)

        let [sendRes, sendErr] = await sendTransaction({
            name: "ExampleToken/try_send_example_token",
            args: [alice, depositAmount],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        expect(sendErr).toBe(null)

        const eventType = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event = getEventFromTransaction(sendRes, eventType)
        expect(event !== null).toBe(true)
        expect(event.type).toBe(eventType)
        expect(event.data.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)
        expect(event.data.redeemer).toBe(alice)
    })*/
    /*
    it("should send ExampleToken through Depositor", async () => {
        await cleanup(alice)
        await addFlowTokensToDepositor(exampleTokenAdmin, 1)

        let [setupRes, setupErr] = await sendTransaction({
            name: "ExampleToken/setup_account_ft",
            args: [],
            signers: [alice],
            limit: 999
        })
        expect(setupErr).toBe(null)

        const tokensToSend = 100
        const [sendRes, sendErr] = await sendTransaction({
            name: "ExampleToken/try_send_example_token_depositor",
            args: [alice, tokensToSend],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        const eventType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.TokensDeposited`
        const event = getEventFromTransaction(sendRes, eventType)
        expect(sendErr).toBe(null)
        expect(event.type).toBe(eventType)
        expect(event.data.to).toBe(alice)

        let [balance, balanceErr] = await executeScript("ExampleToken/get_example_token_balance", [alice])
        expect(balanceErr).toBe(null)
    })*/
    /*
    it("should deposit ExampleToken through Depositor", async () => {
        await cleanup(alice)
        await addFlowTokensToDepositor(exampleTokenAdmin, 1)

        const tokensToSend = 100
        const [sendRes, sendErr] = await sendTransaction({
            name: "ExampleToken/try_send_example_token_depositor",
            args: [alice, tokensToSend],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        const eventType = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event = getEventFromTransaction(sendRes, eventType)
        expect(sendErr).toBe(null)
        expect(event.data.redeemer).toBe(alice)
        expect(event.data.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)
    })*/
    /*
    it("should be able to get total vaults balance to a specific bin", async () => {
        await cleanup(alice)
        await addFlowTokensToDepositor(exampleTokenAdmin, 1)

        const tokensToSend = 100.00000000
        const tokenType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`
        const [sendRes, sendErr] = await sendTransaction({
            name: "ExampleToken/try_send_example_token_depositor",
            args: [alice, tokensToSend],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        const eventType = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event = getEventFromTransaction(sendRes, eventType)
        expect(event.data.redeemer).toBe(alice)
        expect(event.data.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)

        let [balance, balanceErr] = await executeScript("ExampleToken/get_bin_vault_balance", [alice, tokenType])
        expect(balanceErr).toBe(null)
        expect(balance).toBe("100.00000000")

        const [sendRes2, sendErr2] = await sendTransaction({
            name: "ExampleToken/try_send_example_token_depositor",
            args: [alice, tokensToSend],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        expect(sendErr2).toBe(null)

        let [balance2, balanceErr2] = await executeScript("ExampleToken/get_bin_vault_balance", [alice, tokenType])
        expect(balanceErr2).toBe(null)
        expect(balance2).toBe("200.00000000")

    })*/
    /*
    it("should get the flow repayment address from script", async () => {
        await cleanup(alice)
        await addFlowTokensToDepositor(exampleTokenAdmin, 1)

        const tokensToSend = 100.00000000
        const tokenType = `A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`
        const [sendRes, sendErr] = await sendTransaction({
            name: "ExampleToken/try_send_example_token_depositor",
            args: [alice, tokensToSend],
            signers: [exampleTokenAdmin],
            limit: 9999
        })
        const eventType = `A.${lostAndFoundAdmin.substring(2)}.LostAndFound.TicketDeposited`
        const event = getEventFromTransaction(sendRes, eventType)
        expect(event.data.redeemer).toBe(alice)
        expect(event.data.type.typeID).toBe(`A.${exampleTokenAdmin.substring(2)}.ExampleToken.Vault`)

        const ticketID = event.data.ticketID

        let [repaymentAddress, repaymentAddressErr] = await executeScript("get_flowRepayment_address", [alice, tokenType, ticketID])
        expect(repaymentAddressErr).toBe(null)
        expect(repaymentAddress).toBe(`${exampleTokenAdmin}`)

    })*/
})
 