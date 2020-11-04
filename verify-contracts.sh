#!/usr/bin/env sh

set -e

# Function definitions
compareRepoContract () {
	cd tests/contract/my-consumers/$1
	rm -rf .tmp

	git init .tmp
	cd .tmp
	git remote add origin https://github.com/pipedrive/$1
	git config core.sparsecheckout true

	# download only specific folder
	echo "test/contract/my-producers/*" >> .git/info/sparse-checkout
	git pull --depth=1 origin $2
	cd ..

	# diff, files should match, ignore whitespaces
	diff .tmp/test/contract/my-producers/php-app/contract.json contract.json -w -E

	# cleanup
	rm -rf .tmp
}

echo "Comparing local and remote contracts to be the same.."

# Verify that contracts match, providing repo name & branch:
#compareRepoContract "monograph" "CTL-1545-contracts"
#compareRepoContract "monograph" "CTL-1545-contracts"
