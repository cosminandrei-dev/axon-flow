.PHONY: amend
amend:
	git add --all
	git commit --amend --no-edit --no-verify
	git push --force-with-lease
