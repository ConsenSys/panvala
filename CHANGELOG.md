# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - - 2019-04-26

### Changed
- Fix `ipfs-mini` was using wrong URL format - switched to `ipfs-http-client`
- Forcing use of Node 10 for API
- Fix incorrect display of slate submitter address on main page ([#40](https://github.com/ConsenSys/panvala/issues/40))
- Fix saving of proposal multihashes in slate metadata

### Added
- Direct links to slates and proposals
- Contracts: implement ballot reveal
- Contracts: implement vote counting
- Contracts: implement slate staking

## [0.1.0] - 2019-04-02

[Unreleased]: https://github.com/ConsenSys/panvala/compare/v0.2.0...develop
[0.2.0]: https://github.com/ConsenSys/panvala/releases/tag/v0.2.0
[0.1.0]: https://github.com/ConsenSys/panvala/releases/tag/v0.1.0
