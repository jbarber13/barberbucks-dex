import {tokens, EVM_REVERT} from '../src/helpers.js'

const Token = artifacts.require('./Token')

require('chai')
	.use(require('chai-as-promised'))
	.should()
contract('Token', ([deployer, sender, receiver, exchange]) => {
	const name = "Barber Buck"
	const symbol = "BB"
	const decimals = '18'
	const totalSupply = tokens(1000000).toString()
	let token

	beforeEach(async () => {
		//Fetch token from blockchain
		token = await Token.new()
	})
	describe('deployment', () =>{
		it('tracks the name', async () => {	
			//Read token name
			const result = await token.name()
			//Check token name is My Name
			result.should.equal(name)
		})

		it('tracks the symbol', async () => {
			const result = await token.symbol()
			result.should.equal(symbol)
		})

		it('tracks the decimals', async () => {
			const result = await token.decimals()
			result.toString().should.equal(decimals)
		})

		it('tracks the total suply', async () => {
			const result = await token.totalSupply()
			result.toString().should.equal(totalSupply.toString())
		})

		it('assigns the total supply to the deployer', async () => {
			const result = await token.balanceOf(deployer)
			result.toString().should.equal(totalSupply.toString())
		})
	})
	describe('sending tokens', () =>{
		let amount
		let result

		describe('success', async() => {

			beforeEach(async () => { 
				amount = tokens(100)
				result = await token.transfer(receiver, amount, { from: deployer })//transfer
			})

			it('transfers token balances', async () => {
				let balanceOf
				//before transfer
				/*
				balanceOf = await token.balanceOf(deployer)
				console.log("deployer balance before transfer", balanceOf.toString())
				balanceOf = await token.balanceOf(receiver)
				console.log("receiver balance before transfer", balanceOf.toString())
				*/
				//post transfer
				balanceOf = await token.balanceOf(deployer)
				balanceOf.toString().should.equal(tokens(999900).toString())
				//console.log("deployer balance after transfer", balanceOf.toString())
				balanceOf = await token.balanceOf(receiver)
				balanceOf.toString().should.equal(tokens(100).toString())
				//console.log("receiver balance after transfer", balanceOf.toString())
			})
			it('emits a Transfer event', async() => {
				const log = result.logs[0]
				log.event.should.eq('Transfer')
				const event = log.args
				event.from.toString().should.equal(deployer, 'from is correct')
				event.to.toString().should.equal(receiver, 'to is correct')
				event.value.toString().should.equal(amount.toString(), 'value is correct')
			})

		})//describe success

		describe('failure', async() => {
			it('rejects insufficient balances', async() => {
				let invalidAmount
				invalidAmount = tokens(100000000) //100 million - greater than toal supply
				await token.transfer(receiver, invalidAmount, {from: deployer}).should.be.rejected;

				invalidAmount = tokens(10) //attempt to transfer token when you have none, receiver has none
				await token.transfer(receiver, invalidAmount, {from: receiver}).should.be.rejected;
			})

			it('rejects invalid recipients', async() => {
				//invalid address
				await token.transfer(0x0, amount, {from: deployer}).should.be.rejected;
			})
		})//describe failure		
	})
	describe('approving tokens', () =>{
		let result
		let amount

		beforeEach(async() => {
			amount = tokens(100)
			result = await token.approve(exchange, amount, {from: deployer}) //deployer has toknes

		})
		describe('success', async() => {
			it('allocates an allowance for delegated token spending on an exchange', async () =>{
				const allowance = await token.allowance(deployer, exchange)
				allowance.toString().should.equal(amount.toString())
			})
			it('emits an Approval event', async() => {
				const log = result.logs[0]
				log.event.should.eq('Approval')
				const event = log.args
				event.owner.toString().should.equal(deployer, 'owner is correct')
				event.spender.toString().should.equal(exchange, 'spender is correct')
				event.value.toString().should.equal(amount.toString(), 'value is correct')
			})
		})
		describe('failure', async() => {
			it('rejects invalid spenders', async() => {
				//invalid address
				await token.transfer(0x0, amount, {from: deployer}).should.be.rejected;
			})
		})
	})
	describe('delegated token transfers', () =>{
		let amount
		let result

		beforeEach(async () => { 
			amount = tokens(100)
			await token.approve(exchange, amount, {from: deployer})
			})

		describe('success', async() => {

			beforeEach(async () => { 
				amount = tokens(100)
				result = await token.transferFrom(deployer, receiver, amount, { from: exchange })//transfer
			})
			it('transfers token balances', async () => {
				let balanceOf
				//before transfer
				/*
				balanceOf = await token.balanceOf(deployer)
				console.log("deployer balance before transfer", balanceOf.toString())
				balanceOf = await token.balanceOf(receiver)
				console.log("receiver balance before transfer", balanceOf.toString())
				*/
				//post transfer
				balanceOf = await token.balanceOf(deployer)
				balanceOf.toString().should.equal(tokens(999900).toString())
				//console.log("deployer balance after transfer", balanceOf.toString())
				balanceOf = await token.balanceOf(receiver)
				balanceOf.toString().should.equal(tokens(100).toString())
				//console.log("receiver balance after transfer", balanceOf.toString())
			})
			it('resets the allowance', async () =>{
				const allowance = await token.allowance(deployer, exchange)
				allowance.toString().should.equal('0')
			})			
			it('emits a Transfer event', async() => {
				const log = result.logs[0]
				log.event.should.eq('Transfer')
				const event = log.args
				event.from.toString().should.equal(deployer, 'from is correct')
				event.to.toString().should.equal(receiver, 'to is correct')
				event.value.toString().should.equal(amount.toString(), 'value is correct')
			})
		})//describe success		
		describe('failure', async() => {
			it('rejects insufficient amounts', async() => {
				//attempt transfer too many tokens
				const invalidAmount = tokens(100000000) //100 million - greater than toal supply
				await token.transfer(receiver, invalidAmount, {from: receiver}).should.be.rejected;
			})	

			it('rejects invalid recipients', async() => {
				await token.transfer(0x0, amount, {from: deployer}).should.be.rejected;
			})		
		})
	})
})

