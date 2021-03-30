
// SPDX-License-Identifier: LICENSE
/*
Description: 
[x] Set the fee
[x] Deposit Ether
[x] Withdraw Ether
[x] Deposit Tokens
[x] Withdraw Tokens
[x] Check balance
[x] Make order
[x] Cancel order
[x] Fill order
[x] Charge fees
*/


pragma solidity ^0.5.0;
import "./Token.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange{
	using SafeMath for uint256;


	address public  feeAccount; //account that will receive exchange fees
	uint256 public feePercent; //fee %
	address constant ETHER = address(0); //store Ether in tokens mapping with blank address - save space on blockchain
	uint256 public orderCount; //counts orders in array mapping, first index is 0

	mapping(address => mapping(address => uint256)) public tokens; //key/value pair	
	mapping(uint256 => _Order) public orders;//store the order
	mapping(uint256 => bool) public orderCancelled;
	mapping(uint256 => bool) public orderFilled;

	//events
	event Deposit(address token, address user, uint256 amount, uint256 balance);
	event Withdraw(address token, address user, uint256 amount, uint256 balance);
	//orderEvent
	event Order(
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timeStamp
	);

	event Cancel(
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timeStamp
	);
	event Trade(
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		address userFill, 
		uint256 timeStamp
	);

	//model the order
	struct _Order { //custom data type
		uint256 id;
		address user;
		address tokenGet;
		uint256 amountGet;
		address tokenGive;
		uint256 amountGive;
		uint256 timeStamp;
	}

	

	constructor(address _feeAccount, uint256 _feePercent) public {
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}

	//add/retrieve order to storage
	function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
		orderCount = orderCount.add(1);
				//'now' key word gives timestamp - epoch time -  epochconverter.com
		orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
		emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, now);
	}

	//Fallback: reverts if Ether is sent to this contract unintentionally 
	function() external {
		revert();
	}

	function depositEther() payable public {
		//msg.value = sending ether is inherent to the blockchain, need 'payable' modifier in function call
		tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
		emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
	}

	function withdrawEther(uint256 _amount) public {
		require(tokens[ETHER][msg.sender] >= _amount); //check balance is enough
		tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
		msg.sender.transfer(_amount);
		emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
	}

	function depositToken(address _token, uint256 _amount) public {
		//Don't allow ether deposit
		require(_token != ETHER);
		//which token? 
		require(Token(_token).transferFrom(msg.sender, address(this), _amount)); //this = this smart contract
		tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
		//how much? 
		//send tokens to this contract		
		//manage deposit - update balance
		//emit event
	}

	function withdrawToken(address _token, uint256 _amount) public {
		require(_token != ETHER);
		require(tokens[_token][msg.sender] >= _amount);

		tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
		require(Token(_token).transfer(msg.sender, _amount)); 
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function balanceOf(address _token, address _user) public view returns(uint256){
		return tokens[_token][_user];
	}

	function cancelOrder(uint256 _id) public {
		//must be "my" order in order to cancel
		//must be valid order
		_Order storage _order = orders[_id]; //retrieve order from storage on blockchain
		require(address(_order.user)==msg.sender);
		require(_order.id==_id);

		//cancel the order
		orderCancelled[_id] = true;
		emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
	}

	function fillOrder(uint256 _id) public {
		//require valid orderID
		require(_id > 0 && _id <= orderCount);

		//make sure order is not already filled or cancelled
		require(!orderFilled[_id]);
		require(!orderCancelled[_id]);

		//fetch order
		_Order storage _order = orders[_id]; //retrieve order from storage on blockchain
		_trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
		//mark order as filled
		orderFilled[_order.id] = true;
	}
	function _trade(uint256 _orderID, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
		//charge fee
		uint256 _feeAmount = _amountGive.mul(feePercent).div(100);
		//fee paid by the user that fills the order -  msg.sender
		tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);

		//do the trade
		tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));//fee deducted from _amountGet
		tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
		tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
		tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);

		//emit a trade event
		emit Trade(_orderID, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
	}

}