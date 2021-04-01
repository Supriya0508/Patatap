Numocity Repository Template
============================

Copyright (C) 2020 Numocity Technologies Pvt Ltd. All rights reserved.

This material, including documentation and any related computer programs, is
protected by copyright controlled by Numocity  Corporation. All rights are
reserved. Copying, including reproducing, storing, adapting or translating, any
or all of this material requires the prior written consent of
Numocity  Corporation. This material also contains confidential information which
may not be disclosed to others without the prior written consent of
Numocity  Corporation.


> Please find the README for the simulator in [ReadMe](https://bitbucket.org/namp_eng/cms-simulator/src/master/01_SourceCode/README.md)

Git Commands
============

___

_A list of my commonly used Git commands_

--

### Getting & Creating Projects

| Command | Description |
| ------- | ----------- |
| `git init` | Initialize a local Git repository |
| `git clone https://bitbucket.org/[bitbucket_project_name]/[repositor-name]].git` | Create a local copy of a remote repository |

### Basic Snapshotting

| Command | Description |
| ------- | ----------- |
| `git status` | Check status |
| `git add [file-name.txt]` | Add a file to the staging area |
| `git add -A` | Add all new and changed files to the staging area |
| `git commit -m "[commit message]"` | Commit changes |
| `git rm -r [file-name.txt]` | Remove a file (or folder) |


### Sharing & Updating Projects

| Command | Description |
| ------- | ----------- |
| `git push origin [branch name]` | Push a branch to your remote repository |
| `git push -u origin [branch name]` | Push changes to remote repository (and remember the branch) |
| `git push` | Push changes to remote repository (remembered branch) |
| `git push origin --delete [branch name]` | Delete a remote branch |
| `git pull` | Update local repository to the newest commit |
| `git pull origin [branch name]` | Pull changes from remote repository |
| `git remote add origin ssh://git@github.com/[username]/[repository-name].git` | Add a remote repository |
| `git remote set-url origin ssh://git@github.com/[username]/[repository-name].git` | Set a repository's origin branch to SSH |

### Inspection & Comparison
 
| Command | Description |
| ------- | ----------- |
| `git log` | View changes |
| `git log --summary` | View changes (detailed) |
| `git log -u` | View changes (detailed) |
| `git log -n <number a>` | view just one change that happened at ath commit from last commit |
| `git diff [source branch] [target branch]` | Preview changes before merging |
| `git diff [commitID1] [commitID2]` | Preview changes b/w two commits |
| `git diff --staged` | Preview changes b/w edited file and the file before editing at the staging area |



*If you are interested in learning more commands, have a look at https://git-scm.com/docs*


