# Contributing to Realtime Map

First off, thank you for considering contributing to Realtime Map. It's people like you that make Realtime Map such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

## Fork & create a branch

If this is something you think you can fix, then fork and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```bash
git checkout -b 325-add-japanese-translations
```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## Make a Pull Request

At this point, you should switch back to your `dev` branch and make sure it's up to date with the latest Realtime Map `dev` branch:

```bash
git remote add upstream git@github.com:LACMTA/realtime-map.git
git checkout dev
git pull upstream dev
```

Then update your feature branch from your local copy of dev, and push it!

```bash
git checkout 325-add-japanese-translations
git rebase dev
git push --set-upstream origin 325-add-japanese-translations
```

Finally, go to GitHub and make a Pull Request into the `dev` branch.

## Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing in Git, there are a lot of [good resources](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) but here's the suggested workflow:

```bash
git checkout 325-add-japanese-translations
git pull --rebase upstream dev
git push --force-with-lease 325-add-japanese-translations
```

## Merging a PR (maintainers only)

A PR can only be merged into main by a maintainer if:

- It has been approved by at least a maintainer. If it was a maintainer who opened the PR, no  approval is needed.
- It has no requested changes.
- It is up to date with current `dev`.

Any maintainer is allowed to merge a PR if all of these conditions are met.