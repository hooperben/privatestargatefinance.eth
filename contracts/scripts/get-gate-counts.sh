#!/bin/bash

echo "Getting gate counts for all circuits..."

echo "----------------------------------"

echo "Deposit circuit gate count:"
bb gates -b ../circuits/deposit/target/deposit.json
echo "----------------------------------"

echo "Transfer circuit gate count:"
bb gates -b ../circuits/transfer/target/transfer.json
echo "----------------------------------"


echo "Withdraw circuit gate count:"
bb gates -b ../circuits/withdraw/target/withdraw.json
echo "----------------------------------"

echo "Warp circuit gate count:"
bb gates -b ../circuits/warp/target/warp.json
echo "----------------------------------"

echo "Done!"
