// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

contract WrapETH {
    IWETH public weth = IWETH(0x4200000000000000000000000000000000000006);

    event Wrapped(address indexed user, uint256 amount);

    // Fonction pour convertir l'ETH en WETH
    function wrap() external payable {
        require(msg.value > 0, "Send some ETH to wrap");

        // Dépose l'ETH dans le contrat WETH
        weth.deposit{value: msg.value}();

        emit Wrapped(msg.sender, msg.value);
    }
}



