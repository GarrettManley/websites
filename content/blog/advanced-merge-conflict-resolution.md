---
title: Advanced merge conflict resolution
date: 2019-08-16
tags: []
---

_by: Garrett Manley_

## Merging release branches to `master` when squashing changes to `develop` on merge
_A guide to merge conflict resolution using git flow_

When creating a PR to merge the latest prod release to master, you’ll find that you’ll get many merge conflicts since master does not have the git history for the recent changes. All of these changes need to be resolved to auto accept current changes rather than incoming changes.

After some research, I found that git has flags to handle this correctly:
```git pull -X ours origin master```

However, there is an issue with this method, when the local changes have deleted a file, but the master does not know about these changes, it will attempt to re-add them, so we need to manually remove the files before committing the merge to the prod release branch. Since git pull is simply an alias for `git fetch && git merge` we can do a fetch all from source tree and run the following command to resolve all merge conflicts, but don’t create a commit, so we can manually remove the files it’s attempting to add from `origin/master`
```git merge --strategy-option ours --no-commit origin/master```

After you have done this, you should be able to commit your changes to the release branch. To know you’ve done things correctly, the release branch should not show any changes in the commit for the merge from master. If that is the case, you are safe to create a PR to merge the release branch to master knowing that the code will match that of the code in the release branch.

*NOTE* _The above merge strategy may also be achieved using the below command, but this has not been tested._
```git merge -s ours --no-commit origin/master```
>_`-s` is an alias for the merge strategy, and `--strategy-option` is the options related to the strategy being used. `ours` is a specific option of using the current local changes as opposed to the changes coming in from the remote, the inverse of this is `theirs`. `ours` and `theirs` are options for the `recursive` merge strategy, which is the default strategy when pulling or merging from a single branch. This is why we can pass `ours` to the `-s` flag without the need to specify `-s recursive --strategy-option ours`._

*Other Options*
>If you use visual studio code to resolve merge conflicts (like many developers today do, myself included) you’ll be able to accept all current changes for all merge conflicts as opposed to a single file in the upcoming July release of VS Code: https://github.com/Microsoft/vscode/issues/63621

# Merging two repos into a single repo

|               |                   |
| ------------- | ----------------- |
| newer branch: | `other-repo-code` |
| older branch: |     `develop`     |

## Commands Used

create a new root directory to move the files to
```
mkdir test
```

moving all files in `other-repo-code` into a sub-directory named `test`
```
git mv -k * test/
```
_this is needed because the two repositories being merged have the same root directory named `src`_

cleaning up files left over from other branches/changes
```
git clean -fdx
```

Merging `develop` branch into `other-repo-code`
```
git pull origin develop --allow-unrelated-histories -X ours
```

Lastly, if there have been a lot of changes between the branches, there may be leftover files that need to be deleted. This is usually due to file renames that were not due using `git mv` so they were not treated as a rename but a deletion followed by an addition of a new file. The only way to avoid this is good code hygiene and vigilance with merge reviews.
